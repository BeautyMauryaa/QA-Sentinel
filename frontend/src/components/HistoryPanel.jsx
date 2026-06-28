import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function HistoryPanel({ onView, onCompare }) {
  const [runs, setRuns] = useState([]);
  const [error, setError] = useState(null);
  const [compareSet, setCompareSet] = useState([]);

  useEffect(() => {
    api.getHistory().then(setRuns).catch((e) => setError(e.message));
  }, []);


  function toggleCompare(id) {
    setCompareSet((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  if (error) return <div className="text-signal-fail font-mono text-sm">✗ {error}</div>;
  if (runs.length === 0) return <div className="text-steel font-mono text-sm">No runs yet. Run a scan to see history here.</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-steel uppercase tracking-widest">
          Select two runs of the same URL to compare
        </div>
        <button
          disabled={compareSet.length !== 2}
          onClick={() => onCompare(compareSet[0], compareSet[1])}
          className="text-xs font-mono px-3 py-1.5 rounded-md border border-signal-run/50 text-signal-run disabled:opacity-30 disabled:cursor-not-allowed hover:bg-signal-run/10"
        >
          Compare selected ({compareSet.length}/2)
        </button>
      </div>

      <ul className="divide-y divide-panelborder border border-panelborder rounded-md overflow-hidden">
        {runs.map((r) => (
          <li key={r.id} className="px-4 py-3 flex items-center gap-3 bg-panel hover:bg-panelborder/40 transition-colors">
            <input
              type="checkbox"
              checked={compareSet.includes(r.id)}
              onChange={() => toggleCompare(r.id)}
              className="w-4 h-4 accent-signal-run flex-shrink-0"
            />
            <button onClick={() => onView(r.id)} className="flex-1 text-left min-w-0">
              <div className="font-sans text-sm text-mist truncate">{r.url}</div>
              <div className="font-mono text-[11px] text-steel mt-0.5">
                {new Date(r.started_at).toLocaleString()} · {r.suites.length} suite(s)
              </div>
            </button>
            <div className="flex items-center gap-3 font-mono text-xs flex-shrink-0">
              <span className="text-signal-pass">{r.passed}P</span>
              <span className="text-signal-fail">{r.failed}F</span>
              <span className="text-signal-skip">{r.skipped}S</span>
              <button
  onClick={async (e) => {
    e.stopPropagation();

    if (!confirm("Delete this run?")) return;

    try {
      await api.deleteRun(r.id);

      setRuns((prev) =>
        prev.filter((run) => run.id !== r.id)
      );

      setCompareSet((prev) =>
        prev.filter((id) => id !== r.id)
      );
    } catch (err) {
      alert(err.message);
    }
  }}
  className="text-red-400 hover:text-red-300 font-mono text-xs"
>
  Delete
</button>
            </div>
            
          </li>
          
        ))}
      </ul>
      
    </div>
  );
}
