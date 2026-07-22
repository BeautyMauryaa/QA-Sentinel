import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export async function generateCrops({
  baselinePath,
  livePath,
  diffPath,
  boxes,
}) {
  if (!boxes || boxes.length === 0) {
    return [];
  }

  const cropRoot = path.join(process.cwd(), "data", "crops");

  await fs.mkdir(cropRoot, {
    recursive: true,
  });

  //-------------------------------------
  // Load image metadata
  //-------------------------------------

  const meta = await sharp(baselinePath).metadata();

  const imageWidth = meta.width;
  const imageHeight = meta.height;

  const results = [];

  //-------------------------------------
  // Generate crops
  //-------------------------------------
console.log({
  imageWidth,
  imageHeight,
  totalBoxes: boxes.length,
});
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];

    const issueFolder = path.join(cropRoot, `issue-${i + 1}`);

    await fs.mkdir(issueFolder, {
      recursive: true,
    });

    //-----------------------------------
    // Keep crop inside image
    //-----------------------------------
const left = Math.max(
  0,
  Number(box.x) || 0
);

const top = Math.max(
  0,
  Number(box.y) || 0
);

const rawWidth = Number(box.width);
const rawHeight = Number(box.height);

if (
  !Number.isFinite(rawWidth) ||
  !Number.isFinite(rawHeight)
) {
  console.warn(
    "Invalid crop size:",
    box
  );
  continue;
}

const width = Math.min(
  Math.floor(rawWidth),
  imageWidth - left
);

const height = Math.min(
  Math.floor(rawHeight),
  imageHeight - top
);

if (
  width <= 0 ||
  height <= 0 ||
  left >= imageWidth ||
  top >= imageHeight
) {
  console.warn(
    "Skipping invalid crop:",
    {
      left,
      top,
      width,
      height,
      imageWidth,
      imageHeight,
    }
  );
  continue;
}

    //-----------------------------------
    // Output paths
    //-----------------------------------

    const baselineCrop = path.join(issueFolder, "baseline.png");

    const liveCrop = path.join(issueFolder, "live.png");

    const diffCrop = path.join(issueFolder, "diff.png");

    //-----------------------------------
    // Extract baseline
    //-----------------------------------
try {
  await sharp(baselinePath)
    .extract({
      left,
      top,
      width,
      height,
    })
    .toFile(baselineCrop);
} catch (err) {
  console.error("Baseline crop failed:", {
    left,
    top,
    width,
    height,
  });
  throw err;
}

    //-----------------------------------
    // Extract live
    //-----------------------------------

    await sharp(livePath)
      .extract({
        left,
        top,
        width,
        height,
      })
      .toFile(liveCrop);

    //-----------------------------------
    // Extract diff
    //-----------------------------------

    await sharp(diffPath)
      .extract({
        left,
        top,
        width,
        height,
      })
      .toFile(diffCrop);

    //-----------------------------------
    // Save result
    //-----------------------------------

    results.push({
      issue: i + 1,

      box: {
        x: left,
        y: top,
        width,
        height,
      },

      baseline: path.relative(process.cwd(), baselineCrop),

      live: path.relative(process.cwd(), liveCrop),

      diff: path.relative(process.cwd(), diffCrop),
    });
  }

  return results;
}
