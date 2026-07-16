import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

/**
 * Generate cropped images for every detected issue.
 *
 * Output:
 * data/crops/
 *    issue-1/
 *       baseline.png
 *       live.png
 *       diff.png
 */

export async function generateCrops({
  baselinePath,
  livePath,
  diffPath,
  boxes,
}) {
  if (!boxes || boxes.length === 0) {
    return [];
  }

  const cropRoot = path.join(
    process.cwd(),
    "data",
    "crops"
  );

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

  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];

    const issueFolder = path.join(
      cropRoot,
      `issue-${i + 1}`
    );

    await fs.mkdir(issueFolder, {
      recursive: true,
    });

    //-----------------------------------
    // Keep crop inside image
    //-----------------------------------

    const left = Math.max(
      0,
      Math.floor(box.x)
    );

    const top = Math.max(
      0,
      Math.floor(box.y)
    );

    const width = Math.min(
      Math.floor(box.width),
      imageWidth - left
    );

    const height = Math.min(
      Math.floor(box.height),
      imageHeight - top
    );

    //-----------------------------------
    // Skip invalid boxes
    //-----------------------------------

    if (width <= 0 || height <= 0) {
      continue;
    }

    //-----------------------------------
    // Output paths
    //-----------------------------------

    const baselineCrop = path.join(
      issueFolder,
      "baseline.png"
    );

    const liveCrop = path.join(
      issueFolder,
      "live.png"
    );

    const diffCrop = path.join(
      issueFolder,
      "diff.png"
    );

    //-----------------------------------
    // Extract baseline
    //-----------------------------------

    await sharp(baselinePath)
      .extract({
        left,
        top,
        width,
        height,
      })
      .toFile(baselineCrop);

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

      baseline: path.relative(
        process.cwd(),
        baselineCrop
      ),

      live: path.relative(
        process.cwd(),
        liveCrop
      ),

      diff: path.relative(
        process.cwd(),
        diffCrop
      ),
    });
  }

  return results;
}