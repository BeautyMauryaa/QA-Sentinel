import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "qa-sentinel.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

function load() {
  if (!fs.existsSync(DB_FILE)) {
    return { runs: {}, results: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch {
    return { runs: {}, results: {} };
  }
}

let state = load();
let writeQueued = false;

function persist() {
  // Debounce writes slightly so bursts of inserts (one per test result) don't
  // each trigger a full synchronous disk write.
  if (writeQueued) return;
  writeQueued = true;
  setTimeout(() => {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
    writeQueued = false;
  }, 50);
}

function persistSync() {
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
}

export const db = {
  insertRun(run) {
    state.runs[run.id] = { ...run };
    persist();
  },

  updateRun(id, patch) {
    if (!state.runs[id]) return;
    state.runs[id] = { ...state.runs[id], ...patch };
    persist();
  },

  getRun(id) {
    return state.runs[id] || null;
  },

  insertResult(result) {
    (state.results[result.run_id] = state.results[result.run_id] || []).push(result);
    persist();
  },

  getResults(runId) {
    return state.results[runId] || [];
  },

  getHistory(limit = 100) {
    return Object.values(state.runs)
      .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
      .slice(0, limit);
  },

  deleteRun(runId) {
  if (!state.runs[runId]) {
    return false;
  }

  // Remove run
  delete state.runs[runId];

  // Remove associated results
  delete state.results[runId];

  persistSync();

  return true;
},
  // Forces an immediate flush — used before process exit if ever needed.
  flush: persistSync,
};

export default db;
