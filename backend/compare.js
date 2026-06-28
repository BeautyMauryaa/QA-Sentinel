import db from "./db.js";

/**
 * Compares two test runs by test_id (stable identifier, not test name).
 * Returns { fixed, existing, new, stable, removed } each as an array of
 * { test_id, test_name, suite_id } plus summary counts.
 */
export function compareRuns(run1Id, run2Id) {
  const run1Results = db.getResults(run1Id);
  const run2Results = db.getResults(run2Id);

  const run1Map = new Map(run1Results.map((r) => [r.test_id, r]));
  const run2Map = new Map(run2Results.map((r) => [r.test_id, r]));

  const fixed = [];
  const existing = [];
  const newBugs = [];
  const stable = [];
  const removed = []; // present in run1 but not run2 (e.g. suite no longer selected)

  const allTestIds = new Set([...run1Map.keys(), ...run2Map.keys()]);

  for (const testId of allTestIds) {
    const prev = run1Map.get(testId);
    const curr = run2Map.get(testId);

    if (prev && !curr) {
      removed.push({ test_id: testId, test_name: prev.test_name, suite_id: prev.suite_id });
      continue;
    }
    if (!prev && curr) {
      // newly introduced test case, not a regression signal — skip
      continue;
    }

    const prevFail = prev.status === "fail";
    const currFail = curr.status === "fail";
    const entry = { test_id: testId, test_name: curr.test_name, suite_id: curr.suite_id };

    if (prevFail && !currFail) fixed.push(entry);
    else if (prevFail && currFail) existing.push(entry);
    else if (!prevFail && currFail) newBugs.push(entry);
    else stable.push(entry);
  }

  return {
    run1Id,
    run2Id,
    fixed,
    existing,
    new: newBugs,
    stable,
    removed,
    summary: {
      fixed: fixed.length,
      existing: existing.length,
      new: newBugs.length,
      stable: stable.length,
      removed: removed.length,
    },
  };
}
