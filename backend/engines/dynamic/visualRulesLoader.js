import fs from "fs/promises";
import path from "path";

let cachedRules = null;

/**
 * Loads visual comparison rules.
 * Uses cache after first read.
 */
export async function loadVisualRules() {
  if (cachedRules) {
    return cachedRules;
  }

  const filePath = path.join(
    process.cwd(),
    "engines",
    "dynamic",
    "visualRules.json"
  );

  const file = await fs.readFile(filePath, "utf8");

  cachedRules = JSON.parse(file);

  return cachedRules;
}