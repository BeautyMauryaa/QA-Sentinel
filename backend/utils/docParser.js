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

    // 1. Detect Fold Headings OR Numbered Section Headings
    // (Preserves original 'fold' logic, adds '1. NAME' support)
    const isSectionHeading = line.toLowerCase().includes("fold") || /^\d+\.\s+[A-Z\s]+$/.test(line);
    
    if (isSectionHeading) {
      currentSection = {
        heading: line.toUpperCase(),
        items: [],
      };
      sections.push(currentSection);
      continue;
    }

    // Default container if text exists before a Section/Fold
    if (!currentSection) {
      currentSection = { heading: "GENERAL CONTENT", items: [] };
      sections.push(currentSection);
    }

    // 2. Logic: Handle TechList
    if (line.endsWith(":")) {
      currentSection.items.push({
        type: "TechList",
        heading: line,
        expected: [], // Collect subsequent lines here
      });
      continue;
    }
    
    // If it's a technology name, add to the last TechList (Preserving original logic)
    if (currentSection && currentSection.items.length > 0) {
      const lastItem = currentSection.items[currentSection.items.length - 1];
      if (lastItem.type === "TechList" && !line.toLowerCase().includes("cta")) {
        lastItem.expected.push(line);
        continue;
      }
    }

    // 3. Handle Buttons / FAQs
    let contentType = "Paragraph";
    let combinedContent = line;

    if (line.toLowerCase().includes("cta")) {
      contentType = "Button/CTA";
      combinedContent = line.split(/:|:/)[1]?.trim() || line;
    } else if (line.match(/^\d+\.\s/)) {
      contentType = "FAQ Item";
      combinedContent = line.replace(/^\d+\.\s*/, "").trim();
    } else {
      // Look ahead for a descriptive paragraph (Preserving original look-ahead logic)
      if (i + 1 < rawLines.length) {
        let nextLine = rawLines[i + 1].trim();
        if (
          !nextLine.toLowerCase().includes("fold") &&
          !nextLine.toLowerCase().includes("cta") &&
          !/^\d+\.\s+[A-Z\s]+$/.test(nextLine) &&
          nextLine.length > 20
        ) {
          combinedContent = `${line}\n\n${nextLine}`;
          i++; 
        }
      }
    }

    // 4. Final validation: Push only if valid
    if (combinedContent && combinedContent.length > 5) {
      currentSection.items.push({
        type: contentType,
        expected: combinedContent,
      });
    }
  }

  return sections;
}