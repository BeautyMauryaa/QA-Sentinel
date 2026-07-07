import React, { useState } from "react";
import RunPanel from "./components/RunPanel.jsx";
import ResultsDashboard from "./components/ResultsDashboard.jsx";
import HistoryPanel from "./components/HistoryPanel.jsx";
import CompareView from "./components/CompareView.jsx";
import OldContentMatchPanel from "./panels/ContentMatchPanel"; 
import ContentMatchPanel from "./components/ContentMatchPanel";
import VisualRegressionPanel from "./components/VisualRegressionPanel.jsx";
const TABS = [
  { id: "run",     label: "Run"               },
  { id: "visual",  label: "Visual Regression" },  // ← add
  { id: "content", label: "Content Match"     },
  { id: "history", label: "History"           },
];

export default function App() {
  const [tab, setTab] = useState("run");
  const [activeRunId, setActiveRunId] = useState(null);
  const [compareIds, setCompareIds] = useState(null);

  function handleRunStarted(runId) {
    setActiveRunId(runId);
    setCompareIds(null);
    setTab("run");
  }

  function handleViewRun(runId) {
    setActiveRunId(runId);
    setCompareIds(null);
    setTab("run");
  }

  function handleCompare(run1, run2) {
    setCompareIds([run1, run2]);
    setActiveRunId(null);
    setTab("run");
  }

  return (
    <div className="min-h-screen bg-ink text-mist font-sans">
      <header className="border-b border-panelborder">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-signal-pass pulse-dot" />
            <span className="font-mono text-sm tracking-widest text-mist">
              QA_SENTINEL
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
  setTab(t.id);
  if (t.id === "history" || t.id === "content" || t.id === "visual") {
    setActiveRunId(null);
    setCompareIds(null);
  }
}}
                className={`font-mono text-xs uppercase tracking-widest px-3 py-1.5 rounded-md transition-colors ${
                  tab === t.id
                    ? "bg-panel text-mist border border-panelborder"
                    : "text-steel hover:text-mist"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {tab === "run" && !activeRunId && !compareIds && (
          <>
            <Intro />
            <RunPanel onRunStarted={handleRunStarted} />
          </>
        )}
        {tab === "run" && activeRunId && (
          <>
            <BackLink onClick={() => setActiveRunId(null)} label="← new run" />
            <ResultsDashboard runId={activeRunId} />
          </>
        )}
        {tab === "run" && compareIds && (
          <>
            <BackLink onClick={() => setCompareIds(null)} label="← new run" />
            <CompareView run1={compareIds[0]} run2={compareIds[1]} />
          </>
        )}
        {tab === "history" && (
          <HistoryPanel onView={handleViewRun} onCompare={handleCompare} />
        )}
        {tab === "content" && <ContentMatchPanel />} {/* ← add this line */}
        {tab === "visual"  && <VisualRegressionPanel />}
      </main>
    </div>
  );
}

function Intro() {
  return (
    <div className="mb-8">
      <h1 className="font-sans text-2xl font-semibold text-mist mb-2">
        Point it at a URL. Get a test report back.
      </h1>
      <p className="text-steel text-sm max-w-xl">
        QA Sentinel runs a generic Playwright suite against any public website —
        navigation, forms, links, images, mobile layout, accessibility,
        performance, and security basics — no login, no setup, no site-specific
        config.
      </p>
    </div>
  );
}

function BackLink({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="font-mono text-xs text-steel hover:text-mist mb-6"
    >
      {label}
    </button>
  );
}
