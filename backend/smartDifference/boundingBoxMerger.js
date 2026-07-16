/**
 * Merge nearby bounding boxes into larger regions.
 * This helps convert many tiny pixel clusters into
 * meaningful UI issues (cards, sections, buttons, etc.).
 */

export function mergeBoundingBoxes(
  clusters,
  options = {}
) {
  const {
    horizontalGap = 40,
    verticalGap = 40,
    padding = 20,
  } = options;

  if (!clusters || clusters.length === 0) {
    return [];
  }

  //-----------------------------------------
  // Helper Functions
  //-----------------------------------------

  function intersects(a, b) {
    return (
      a.x <= b.x + b.width + horizontalGap &&
      a.x + a.width + horizontalGap >= b.x &&
      a.y <= b.y + b.height + verticalGap &&
      a.y + a.height + verticalGap >= b.y
    );
  }

  function merge(a, b) {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);

    const right = Math.max(
      a.x + a.width,
      b.x + b.width
    );

    const bottom = Math.max(
      a.y + a.height,
      b.y + b.height
    );

    return {
      x,
      y,
      width: right - x,
      height: bottom - y,
      pixels: (a.pixels || 0) + (b.pixels || 0),
      area: (right - x) * (bottom - y),
    };
  }

  //-----------------------------------------
  // Merge Algorithm
  //-----------------------------------------

  const merged = [];

  for (const cluster of clusters) {
    let current = { ...cluster };

    let mergedSomething = true;

    while (mergedSomething) {
      mergedSomething = false;

      for (let i = 0; i < merged.length; i++) {
        if (intersects(current, merged[i])) {
          current = merge(current, merged[i]);
          merged.splice(i, 1);
          mergedSomething = true;
          break;
        }
      }
    }

    merged.push(current);
  }

  //-----------------------------------------
  // Apply Padding
  //-----------------------------------------

  const padded = merged.map(box => ({
    x: Math.max(0, box.x - padding),
    y: Math.max(0, box.y - padding),
    width: box.width + padding * 2,
    height: box.height + padding * 2,
    area: box.area,
    pixels: box.pixels,
  }));

  //-----------------------------------------
  // Sort Largest First
  //-----------------------------------------

  padded.sort((a, b) => b.area - a.area);

  return padded;
}