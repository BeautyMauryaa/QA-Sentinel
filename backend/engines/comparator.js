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
export async function compareImages(baselinePath, livePath) {
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