import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

/**
 * Analyze the uploaded baseline image.
 * Determines viewport, page type, aspect ratio and metadata.
 */

export async function analyzeBaseline(baselinePath) {
  const fullPath = path.resolve(process.cwd(), baselinePath);

  await fs.access(fullPath);

  const metadata = await sharp(fullPath).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Invalid baseline image.");
  }

  const width = metadata.width;
  const height = metadata.height;

  // -------------------------
  // Aspect Ratio
  // -------------------------
  const aspectRatio = Number((width / height).toFixed(2));

  // -------------------------
  // Full Page Detection
  // -------------------------
  const isFullPage = height > 2000;

  // -------------------------
  // Device Detection
  // -------------------------
  let device = "Desktop";

  if (width <= 480) {
    device = "Mobile";
  } else if (width <= 1024) {
    device = "Tablet";
  }

  // -------------------------
  // Recommended Viewport
  // -------------------------
  const viewport = {
    width,
    height: isFullPage ? 1080 : height
  };

  // -------------------------
  // Orientation
  // -------------------------
  let orientation = "Landscape";

  if (height > width) {
    orientation = "Portrait";
  }

  return {
    file: {
      path: baselinePath,
      format: metadata.format,
      size: metadata.size
    },

    dimensions: {
      width,
      height,
      aspectRatio,
      orientation
    },

    page: {
      type: isFullPage ? "FULL_PAGE" : "VIEWPORT",
      device
    },

    viewport,

    metadata
  };
}