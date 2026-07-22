import sharp from "sharp";
import pixelmatch from "pixelmatch";
import fs from "fs/promises";
import path from "path";

/**
 * Compare baseline image with live screenshot.
 *
 * @param {string} baselinePath Relative or absolute baseline image path
 * @param {string} livePath Absolute live screenshot path
 * @returns {Object}
 */
function paintIgnoredRegions(
  buffer,
  width,
  height,
  ignoredRegions
) {
  for (const region of ignoredRegions) {

    if (
      region.x == null ||
      region.y == null ||
      region.width == null ||
      region.height == null
    ) {
      continue;
    }

    const startX = Math.max(0, Math.floor(region.x));
    const startY = Math.max(0, Math.floor(region.y));

    const endX = Math.min(
      width,
      Math.ceil(region.x + region.width)
    );

    const endY = Math.min(
      height,
      Math.ceil(region.y + region.height)
    );

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {

        const index = (y * width + x) * 4;

        buffer[index] = 128;
        buffer[index + 1] = 128;
        buffer[index + 2] = 128;
        buffer[index + 3] = 255;
      }
    }
  }
}

export async function compareImages({
  baselinePath,
  livePath,
  ignoredRegions = []
}) {
  const fullBaselinePath = path.resolve(process.cwd(), baselinePath);

  // Ensure files exist
  await fs.access(fullBaselinePath);
  await fs.access(livePath);

  // Read metadata
  const baselineMeta = await sharp(fullBaselinePath).metadata();
  const liveMeta = await sharp(livePath).metadata();

  if (!baselineMeta.width || !baselineMeta.height) {
    throw new Error("Invalid baseline image.");
  }

  if (!liveMeta.width || !liveMeta.height) {
    throw new Error("Invalid live screenshot.");
  }

  // Match dimensions
  const width = Math.min(baselineMeta.width, liveMeta.width);
  const height = Math.min(baselineMeta.height, liveMeta.height);

  // Convert to raw RGBA buffers
  const baselineBuffer = await sharp(fullBaselinePath)
    .resize(width, height)
    .ensureAlpha()
    .raw()
    .toBuffer();

  const liveBuffer = await sharp(livePath)
    .resize(width, height)
    .ensureAlpha()
    .raw()
    .toBuffer();

  // Pixelmatch
  console.log("\nIgnoring Regions:");
console.table(ignoredRegions);
paintIgnoredRegions(
  baselineBuffer,
  width,
  height,
  ignoredRegions
);

paintIgnoredRegions(
  liveBuffer,
  width,
  height,
  ignoredRegions
);
await sharp(baselineBuffer, {
  raw: { width, height, channels: 4 },
}).png().toFile("debug-masked-baseline.png");

await sharp(liveBuffer, {
  raw: { width, height, channels: 4 },
}).png().toFile("debug-masked-live.png");

  const diffBuffer = Buffer.alloc(width * height * 4);

  const diffPixels = pixelmatch(
    baselineBuffer,
    liveBuffer,
    diffBuffer,
    width,
    height,
    {
      threshold: 0.1,
      includeAA: false,
    }
  );

  // Save diff
  const diffDir = path.join(process.cwd(), "data", "diffs");
  await fs.mkdir(diffDir, { recursive: true });

  const timestamp = Date.now();

  const diffPath = path.join(
    diffDir,
    `diff-${timestamp}.png`
  );

  await sharp(diffBuffer, {
    raw: {
      width,
      height,
      channels: 4,
    },
  }).png().toFile(diffPath);

  // Calculate score
  const totalPixels = width * height;
  const matchedPixels = totalPixels - diffPixels;

  const score = Number(
    ((matchedPixels / totalPixels) * 100).toFixed(2)
  );

  let status = "FAIL";

  if (score >= 95) {
    status = "PASS";
  } else if (score >= 80) {
    status = "NEED IMPROVEMENT";
  }

  return {
    score,
    status,

    diffPath: path.relative(
      process.cwd(),
      diffPath
    ),

    stats: {
      width,
      height,
      totalPixels,
      matchedPixels,
      diffPixels,
    },
  };
}