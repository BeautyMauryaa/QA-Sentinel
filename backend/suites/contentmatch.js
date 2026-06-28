// Suite: Content Match
// This suite appears in the Run panel so users can include it in a test run.
// The actual DOCX vs website comparison runs via the Content Match tab
// using the /api/content-match endpoint.

export const id = "contentMatch";
export const label = "Content Match";

export async function run(page, url, helpers) {
  const { record } = helpers;
  return [
    record(
      "TC_CM_001",
      "Content Match",
      "skipped",
      "Use the Content Match tab for full DOCX vs website side-by-side comparison."
    ),
  ];
}