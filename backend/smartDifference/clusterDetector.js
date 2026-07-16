import sharp from "sharp";

/**
 * Detect clusters of changed pixels in a diff image.
 *
 * @param {string} diffPath
 * @param {Object} options
 * @returns {Promise<Array>}
 */

export async function detectClusters(
  diffPath,
  options = {}
) {
  const {

    // Pixel intensity needed to consider it "changed"
    threshold = 120,

    // Ignore tiny noisy regions
    minClusterSize = 40,

  } = options;

  //----------------------------------------
  // Load Image
  //----------------------------------------

  const { data, info } = await sharp(diffPath)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;

  //----------------------------------------
  // Helpers
  //----------------------------------------

  const visited = new Uint8Array(width * height);

  const index = (x, y) => y * width + x;

  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  const isChangedPixel = (x, y) => {

    const i = (y * width + x) * 4;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Pixelmatch paints changed pixels bright red

    return (
      r > threshold &&
      g < 80 &&
      b < 80
    );
  };

  //----------------------------------------
  // Flood Fill
  //----------------------------------------

  const clusters = [];

  for (let y = 0; y < height; y++) {

    for (let x = 0; x < width; x++) {

      const id = index(x, y);

      if (visited[id]) continue;

      if (!isChangedPixel(x, y)) continue;

      //----------------------------------
      // BFS
      //----------------------------------

      const queue = [[x, y]];

      visited[id] = 1;

      let count = 0;

      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;

      while (queue.length) {

        const [cx, cy] = queue.shift();

        count++;

        minX = Math.min(minX, cx);
        minY = Math.min(minY, cy);

        maxX = Math.max(maxX, cx);
        maxY = Math.max(maxY, cy);

        for (const [dx, dy] of directions) {

          const nx = cx + dx;
          const ny = cy + dy;

          if (
            nx < 0 ||
            ny < 0 ||
            nx >= width ||
            ny >= height
          ) {
            continue;
          }

          const next = index(nx, ny);

          if (visited[next]) continue;

          if (!isChangedPixel(nx, ny)) continue;

          visited[next] = 1;

          queue.push([nx, ny]);
        }
      }

      //----------------------------------
      // Ignore tiny noise
      //----------------------------------

      if (count < minClusterSize) {
        continue;
      }

      clusters.push({

        x: minX,

        y: minY,

        width: maxX - minX + 1,

        height: maxY - minY + 1,

        area:
          (maxX - minX + 1) *
          (maxY - minY + 1),

        pixels: count,

      });
    }
  }

  //----------------------------------------
  // Sort biggest first
  //----------------------------------------

  clusters.sort((a, b) => b.area - a.area);

  return {

    width,

    height,

    totalClusters: clusters.length,

    clusters,

  };
}