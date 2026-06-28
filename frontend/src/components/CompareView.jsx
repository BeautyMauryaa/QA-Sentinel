import React, { useEffect, useState } from "react";
import { api } from "../api.js";

const SECTIONS = [
  { key: "fixed",    title: "Fixed Bugs",    color: "text-signal-pass", bg: "bg-signal-pass/5",  border: "border-signal-pass/20", icon: "✓" },
  { key: "new",      title: "New Bugs",      color: "text-red-400",     bg: "bg-red-400/5",      border: "border-red-400/20",     icon: "✗" },
  { key: "existing", title: "Still Failing", color: "text-orange-400",  bg: "bg-orange-400/5",   border: "border-orange-400/20",  icon: "!" },
  { key: "stable",   title: "Stable",        color: "text-steel",       bg: "",                  border: "border-panelborder",    icon: "·" },
];

const SEVERITY = {
  TC_001: "critical", TC_002: "major",   TC_003: "minor",   TC_004: "minor",   TC_005: "critical",
  TC_006: "major",   TC_007: "major",   TC_008: "minor",   TC_009: "minor",   TC_010: "major",
  TC_011: "major",   TC_012: "minor",   TC_013: "minor",   TC_014: "minor",   TC_015: "info",
  TC_016: "major",   TC_017: "major",   TC_018: "major",   TC_019: "minor",   TC_020: "minor",
  TC_021: "major",   TC_022: "minor",   TC_023: "critical", TC_024: "major",  TC_025: "minor",
  TC_026: "major",   TC_027: "major",   TC_028: "major",   TC_029: "minor",   TC_030: "minor",
  TC_031: "major",   TC_032: "major",   TC_033: "major",   TC_034: "minor",   TC_035: "minor",
  TC_036: "critical",TC_037: "major",   TC_038: "major",   TC_039: "minor",   TC_040: "info",
  TC_046: "major",   TC_047: "major",   TC_048: "minor",   TC_049: "minor",   TC_050: "info",
  TC_051: "critical",TC_052: "major",   TC_053: "major",   TC_054: "major",   TC_055: "major",
  TC_056: "major",   TC_057: "major",
  TC_066: "major",   TC_067: "major",   TC_068: "major",   TC_069: "major",   TC_070: "minor",
  TC_071: "major",   TC_072: "major",   TC_073: "major",   TC_074: "major",   TC_075: "major",
  TC_076: "critical",TC_077: "critical",TC_078: "major",   TC_079: "critical",TC_080: "major",
  TC_081: "major",   TC_082: "minor",   TC_083: "major",   TC_084: "minor",   TC_085: "minor",
  TC_086: "info",    TC_087: "info",    TC_088: "info",    TC_089: "info",    TC_090: "info",
  TC_091: "major",   TC_092: "major",   TC_093: "minor",   TC_094: "minor",
};

function calcHealth(results) {
  if (!results || results.length === 0) return 100;
  const fails = results.filter((r) => r.status === "fail");
  let penalty = 0;
  for (const f of fails) {
    const sev = SEVERITY[f.test_id] || "info";
    if (sev === "critical") penalty += 20;
    else if (sev === "major") penalty += 8;
    else if (sev === "minor") penalty += 3;
    else penalty += 1;
  }
  return Math.max(0, Math.min(100, 100 - penalty));
}

const SEV_COLORS = {
  critical: "text-red-400 border-red-400/30 bg-red-400/10",
  major:    "text-orange-400 border-orange-400/30 bg-orange-400/10",
  minor:    "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  info:     "text-steel border-panelborder",
};

export default function CompareView({ run1, run2 }) {
  const [data, setData]     = useState(null);
  const [run1Data, setRun1] = useState(null);
  const [run2Data, setRun2] = useState(null);
  const [error, setError]   = useState(null);

  useEffect(() => {
    Promise.all([
      api.compareRuns(run1, run2),
      api.getRun(run1),
      api.getRun(run2),
    ])
      .then(([cmp, r1, r2]) => {
        setData(cmp);
        setRun1(r1);
        setRun2(r2);
      })
      .catch((e) => setError(e.message));
  }, [run1, run2]);

  if (error) return <div className="text-signal-fail font-mono text-sm">✗ {error}</div>;
  if (!data)  return <div className="text-steel font-mono text-sm animate-pulse">Comparing runs…</div>;

  const score1 = calcHealth(run1Data?.results || []);
  const score2 = calcHealth(run2Data?.results || []);
  const delta  = score2 - score1;

  const deltaColor = delta > 0 ? "text-signal-pass" : delta < 0 ? "text-red-400" : "text-steel";
  const deltaIcon  = delta > 0 ? "▲" : delta < 0 ? "▼" : "—";

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <div className="font-mono text-[10px] text-steel tracking-widest mb-1">REGRESSION REPORT</div>
        <div className="font-mono text-xs text-steel">
          Run <span className="text-mist">{run1.slice(0, 8)}</span>
          <span className="mx-2 text-steel/40">→</span>
          Run <span className="text-mist">{run2.slice(0, 8)}</span>
        </div>
      </div>

      {/* ── Health Score Delta ── */}
      <div className="bg-panel border border-panelborder rounded-md p-5">
        <div className="font-mono text-[10px] text-steel tracking-widest mb-4">HEALTH SCORE</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-mono text-[10px] text-steel/50 mb-1">Previous Run</div>
            <div className={`font-mono text-4xl font-bold ${
              score1 >= 80 ? "text-signal-pass" : score1 >= 50 ? "text-yellow-400" : "text-red-400"
            }`}>{score1}</div>
            <div className="font-mono text-[10px] text-steel/40 mt-1">/100</div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className={`font-mono text-3xl font-bold ${deltaColor}`}>
              {deltaIcon} {Math.abs(delta)}
            </div>
            <div className={`font-mono text-[10px] mt-1 ${deltaColor}`}>
              {delta > 0 ? "Improved" : delta < 0 ? "Degraded" : "No change"}
            </div>
          </div>

          <div>
            <div className="font-mono text-[10px] text-steel/50 mb-1">Current Run</div>
            <div className={`font-mono text-4xl font-bold ${
              score2 >= 80 ? "text-signal-pass" : score2 >= 50 ? "text-yellow-400" : "text-red-400"
            }`}>{score2}</div>
            <div className="font-mono text-[10px] text-steel/40 mt-1">/100</div>
          </div>
        </div>

        {/* Score bars */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] text-steel/50 w-16">Previous</span>
            <div className="flex-1 h-1.5 bg-panelborder rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${score1 >= 80 ? "bg-signal-pass" : score1 >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                style={{ width: `${score1}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] text-steel/50 w-16">Current</span>
            <div className="flex-1 h-1.5 bg-panelborder rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${score2 >= 80 ? "bg-signal-pass" : score2 >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                style={{ width: `${score2}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary counts ── */}
      <div className="grid grid-cols-4 gap-3">
        {SECTIONS.map((s) => (
          <div key={s.key} className={`bg-panel border ${s.border} rounded-md px-3 py-3 text-center`}>
            <div className={`text-2xl font-mono font-semibold ${s.color}`}>
              {data.summary[s.key]}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-steel mt-1">
              {s.title}
            </div>
          </div>
        ))}
      </div>

      {/* ── Detail sections ── */}
      {SECTIONS.map((s) => {
        const items = data[s.key];
        if (!items || items.length === 0) return null;
        return (
          <div key={s.key} className={`bg-panel border ${s.border} rounded-md overflow-hidden`}>
            <div className={`px-4 py-2.5 border-b border-panelborder font-mono text-xs uppercase tracking-widest ${s.color} flex items-center justify-between`}>
              <span>{s.icon} {s.title}</span>
              <span className="text-steel/50 normal-case">{items.length} test(s)</span>
            </div>
            <ul className="divide-y divide-panelborder">
              {items.map((item) => {
                const sev = SEVERITY[item.test_id] || "info";
                const sevCls = SEV_COLORS[sev] || SEV_COLORS.info;
                return (
                  <li key={item.test_id} className={`px-4 py-2.5 flex items-center gap-3 text-sm ${s.bg}`}>
                    <span className="font-mono text-[10px] text-steel/50 flex-shrink-0 w-16">
                      {item.test_id}
                    </span>
                    <span className="font-sans text-mist flex-1">{item.test_name}</span>
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0 ${sevCls}`}>
                      {sev}
                    </span>
                    <span className="font-mono text-[10px] text-steel/40 flex-shrink-0">
                      {item.suite_id}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {/* ── Removed tests ── */}
      {data.removed?.length > 0 && (
        <div className="font-mono text-xs text-steel/50 border border-panelborder rounded-md px-4 py-3">
          {data.removed.length} test(s) from the first run were not in the second run's selected suites.
        </div>
      )}
    </div>
  );
}