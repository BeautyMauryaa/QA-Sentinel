export async function runVisualTest(url, baselinePath, ignoreSelectors = []) {
  if (!baselinePath) {
    throw new Error("Baseline path is undefined. Ensure the design file is selected.");
  }

  // Ensure the path is correctly located relative to your project root
  const fullBaselinePath = path.join(process.cwd(), baselinePath);
  
  try {
    const baselineBuffer = await fs.readFile(fullBaselinePath);
    const { width, height } = await sharp(baselineBuffer).metadata();
    
    // ... rest of your code
  } catch (err) {
    throw new Error(`Could not read baseline file at ${fullBaselinePath}: ${err.message}`);
  }
}