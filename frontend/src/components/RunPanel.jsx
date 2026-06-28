import React, { useState, useEffect, useRef } from "react";
import { api } from "../api.js";

export default function RunPanel({ onRunStarted }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [suites, setSuites] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [error, setError] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const fileRef = useRef();

  const contentMatchSelected = selected.has("contentMatch");

  useEffect(() => {
    api
      .getSuites()
      .then((data) => {
        setSuites(data);
        setSelected(new Set(data.map((s) => s.id)));
      })
      .catch((e) => setError(e.message));
  }, []);

  // Clear docx file if content match suite is deselected
  useEffect(() => {
    if (!contentMatchSelected) setDocumentFile(null);
  }, [contentMatchSelected]);

  function toggleSuite(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(
      selected.size === suites.length
        ? new Set()
        : new Set(suites.map((s) => s.id))
    );
  }

  async function handleRun(e) {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("Enter a website URL to scan.");
      return;
    }
    if (selected.size === 0) {
      setError("Select at least one test suite.");
      return;
    }
    if (contentMatchSelected && !documentFile) {
      setError("Upload a .docx file to run the Content Match suite.");
      return;
    }

    setSubmitting(true);
    try {
      const { runId } = await api.runTests(
        url.trim(),
        Array.from(selected),
        username,
        password,
        documentFile
      );
      onRunStarted(runId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleRun} className="space-y-5">

      {/* ── URL ── */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-widest text-steel mb-2">
          Target URL
        </label>
        <div className="flex items-center gap-2 bg-panel border border-panelborder rounded-md px-4 py-3 focus-within:border-signal-run transition-colors">
          <span className="text-signal-run font-mono text-sm">$</span>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 bg-transparent outline-none text-mist font-mono text-sm placeholder:text-steel/50"
          />
        </div>
      </div>

      {/* ── Optional auth (collapsible) ── */}
      <div>
        <button
          type="button"
          onClick={() => setShowAuth((v) => !v)}
          className="flex items-center gap-2 font-mono text-xs text-steel hover:text-mist transition-colors"
        >
          <span className="text-[10px]">{showAuth ? "▾" : "▸"}</span>
          Authentication
          <span className="text-steel/40">(optional — for password-protected sites)</span>
        </button>

        {showAuth && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-steel mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full bg-panel border border-panelborder rounded-md px-4 py-3 text-mist font-mono text-sm outline-none focus:border-signal-run transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-steel mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-panel border border-panelborder rounded-md px-4 py-3 text-mist font-mono text-sm outline-none focus:border-signal-run transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Test suites ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-mono uppercase tracking-widest text-steel">
            Test Suites · {selected.size}/{suites.length} selected
          </label>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-mono text-signal-run hover:underline"
          >
            {selected.size === suites.length ? "deselect all" : "select all"}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {suites.map((s) => {
            const active = selected.has(s.id);
            const isContentMatch = s.id === "contentMatch";
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => toggleSuite(s.id)}
                className={`text-left px-3 py-2.5 rounded-md border font-mono text-xs transition-colors flex items-center gap-2 ${
                  active
                    ? "border-signal-run/60 bg-signal-run/10 text-mist"
                    : "border-panelborder bg-panel text-steel hover:border-steel/60"
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-sm border flex-shrink-0 ${
                    active ? "bg-signal-run border-signal-run" : "border-steel"
                  }`}
                />
                {s.label}
                {isContentMatch && (
                  <span className="ml-auto text-[9px] text-steel/40">docx</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── DOCX upload — only shown when Content Match is selected ── */}
      {contentMatchSelected && (
        <div className="border border-signal-run/20 bg-signal-run/5 rounded-md p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-run flex-shrink-0" />
            <span className="font-mono text-xs text-mist">
              Content Match requires a reference document
            </span>
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer?.files?.[0];
              if (f?.name.endsWith(".docx")) {
                setDocumentFile(f);
                setError(null);
              } else {
                setError("Only .docx files are supported.");
              }
            }}
            className={`cursor-pointer border-2 border-dashed rounded-md px-5 py-5 text-center transition-colors ${
              documentFile
                ? "border-signal-pass/50 bg-signal-pass/5"
                : "border-panelborder hover:border-steel/60"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setDocumentFile(f); setError(null); }
              }}
            />
            {documentFile ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-signal-pass font-mono text-sm">✓</span>
                <span className="font-mono text-sm text-mist">{documentFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDocumentFile(null);
                  }}
                  className="font-mono text-[10px] text-steel hover:text-signal-fail ml-2"
                >
                  ✕ remove
                </button>
              </div>
            ) : (
              <div>
                <div className="font-mono text-steel text-sm mb-1">
                  Drop .docx here or click to browse
                </div>
                <div className="font-mono text-[10px] text-steel/50">Max 10 MB</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="text-signal-fail font-mono text-xs border border-signal-fail/40 bg-signal-fail/10 rounded-md px-3 py-2">
          ✗ {error}
        </div>
      )}

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-signal-run text-ink font-sans font-semibold text-sm rounded-md py-3 hover:bg-signal-run/90 disabled:opacity-50 transition-colors"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-ink pulse-dot" />
            Queuing run…
          </span>
        ) : (
          "Run Tests"
        )}
      </button>
    </form>
  );
}