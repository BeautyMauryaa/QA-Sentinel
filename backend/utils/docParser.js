/**
 * utils/docParser.js
 * Final version: Robust grouping and defensive return types.
 */
export function parseAndCleanDocument(rawLines) {
  // Always return an array to prevent "is not iterable" errors
  if (!rawLines || !Array.isArray(rawLines)) {
    console.error("parseAndCleanDocument received invalid input:", rawLines);
    return [];
  }

  const sections = [];
  let currentSection = null;

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();
    
    // Skip empty lines or structural separators
    if (!line || line.includes("____")) continue;

    // 1. Detect Fold Headings
    if (line.toLowerCase().includes("fold")) {
      currentSection = { 
        heading: line.toUpperCase(), 
        items: [] 
      };
      sections.push(currentSection);
      continue;
    }

    // Default container if text exists before a Fold
    if (!currentSection) {
      currentSection = { heading: "GENERAL CONTENT", items: [] };
      sections.push(currentSection);
    }

    // 2. Grouping Logic: Combine Heading/Subheading + Description
    // We combine the current line with the next line if it looks like a description
    let combinedContent = line;
    let contentType = "Paragraph";

    // Look ahead for a descriptive paragraph
    if (i + 1 < rawLines.length) {
      let nextLine = rawLines[i + 1].trim();
      // Logic: If next line is not a fold/CTA and is long, it's the description
      if (!nextLine.toLowerCase().includes("fold") && 
          !nextLine.toLowerCase().includes("cta") && 
          nextLine.length > 20) {
        combinedContent = `${line}\n\n${nextLine}`;
        i++; // Skip the next line as it's now part of this combined block
      }
    }

    // Handle Buttons / FAQs
    if (line.toLowerCase().includes("cta")) {
      contentType = "Button/CTA";
      combinedContent = line.split(/:|:/)[1]?.trim() || line;
    } else if (line.match(/^\d+\.\s/)) {
      contentType = "FAQ Item";
      combinedContent = line.replace(/^\d+\.\s*/, "").trim();
    }

    // 3. Final validation: Push only if valid
    if (combinedContent && combinedContent.length > 5) {
      currentSection.items.push({
        type: contentType,
        expected: combinedContent
      });
    }
  }

  return sections;
}