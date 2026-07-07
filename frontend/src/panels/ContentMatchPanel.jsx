import React, { useState } from 'react';

export default function ContentMatchPanel() {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');

  const handleRunComparison = async (e) => {
    e.preventDefault();
    if (!url || !file) {
      setError('Please provide both a target URL and a valid configuration document (.docx).');
      return;
    }

    setLoading(true);
    setError('');
    setReportData(null);

    const formData = new FormData();
    formData.append('url', url);
    formData.append('docx', file);

    try {
      const response = await fetch('/api/content-match', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Comparison extraction run failed.');

      // DEFENSIVE CHECK: Ensure we fall back cleanly if response keys differ
      const realReportData = data.reportData || data.report || data;
      
      if (Array.isArray(realReportData)) {
        setReportData(realReportData);
      } else if (realReportData && typeof realReportData === 'object' && Array.isArray(realReportData.reportData)) {
        setReportData(realReportData.reportData);
      } else {
        throw new Error("Invalid response format. Expected an array of report sections.");
      }

    } catch (err) {
      console.error("Frontend Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black text-white p-6 font-sans min-h-screen">
      {/* Header Studio Section */}
      <div className="mb-8 max-w-4xl border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-2">QA Content Comparison Studio</h1>
        <p className="text-sm text-zinc-400">Validate real-time DOM layout strings against structural blueprint specifications.</p>
        
        {/* Input Controls */}
        <form onSubmit={handleRunComparison} className="mt-6 flex flex-wrap gap-4 items-end bg-zinc-950 p-4 rounded-xl border border-zinc-900">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
            <label className="text-xs font-semibold text-zinc-400">Target Website URL</label>
            <input 
              type="url" 
              required
              placeholder="https://example.com/page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-sm rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-700 w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <label className="text-xs font-semibold text-zinc-400">Blueprint Document (.docx)</label>
            <input 
              type="file" 
              required
              accept=".docx"
              onChange={(e) => setFile(e.target.files[0])}
              className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-900 disabled:text-zinc-600 font-semibold text-sm text-black disabled:cursor-not-allowed px-5 py-2 rounded transition-colors"
          >
            {loading ? 'Analyzing Layout...' : 'Run Content Match'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-950/50 border border-red-900 text-red-400 rounded text-xs font-medium">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Loading Placeholder */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 max-w-6xl border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
          <div className="w-8 h-8 border-2 border-t-transparent border-emerald-500 rounded-full animate-spin mb-4" />
          <p className="text-sm text-zinc-400 animate-pulse">Running Playwright layout validation and fetching document nodes...</p>
        </div>
      )}

      {/* Default State Indicator (Stops screen from going empty black) */}
      {!loading && !reportData && !error && (
        <div className="flex flex-col items-center justify-center py-20 max-w-6xl border border-zinc-900 rounded-xl bg-zinc-950/20 text-center">
          <p className="text-zinc-500 text-sm font-medium">No active analysis session.</p>
          <p className="text-zinc-600 text-xs mt-1">Provide a URL and blueprint parameters above to render validation reporting metrics.</p>
        </div>
      )}

      {/* Render Table Report Data */}
      {!loading && reportData && reportData.map((section, sIdx) => (
        <div key={sIdx} className="mb-10 border-b border-zinc-900 pb-8 max-w-6xl">
          <h2 className="text-md font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded border border-zinc-800">Section Container</span>
            <span className="text-zinc-100">{section.sectionHeading}</span>
          </h2>

          <div className="overflow-x-auto border border-zinc-900 rounded-lg bg-zinc-950/40 backdrop-blur-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 bg-zinc-950 text-zinc-400 font-medium">
                  <th className="p-3 w-1/6">Content Variant</th>
                  <th className="p-3 w-5/12">Expected Text Blueprint (DOCX)</th>
                  <th className="p-3 w-5/12">Live Captured Layout (Website)</th>
                  <th className="p-3 text-right pr-4">Status Evaluation</th>
                </tr>
              </thead>
              <tbody>
                {section.results?.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-zinc-900/60 hover:bg-zinc-950/80 transition-colors">
                    <td className="p-3 font-semibold text-zinc-400 align-top">{row.label}</td>
                    <td className="p-3 text-zinc-300 whitespace-pre-wrap leading-relaxed">{row.expected}</td>
                    <td className="p-3 text-zinc-300 whitespace-pre-wrap leading-relaxed">{row.actual}</td>
                    <td className="p-3 text-right pr-4 align-top">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold tracking-wide text-[10px] ${
                        row.status === 'Match' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/40' : 
                        row.status === 'Missing Content' ? 'bg-red-950/80 text-red-400 border border-red-900/40' : 
                        'bg-amber-950/80 text-amber-400 border border-amber-900/40'
                      }`}>
                        {row.status === 'Match' ? '✓ MATCH' : row.status === 'Missing Content' ? '✗ MISSING' : '⚠ MISMATCH'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Issue Logs Drawer */}
          {section.status === "FAIL" && (
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-lg p-4 mt-3 max-w-4xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-red-400 font-bold text-xs tracking-wider uppercase">System Flag Logs</h3>
              </div>
              {section.results?.filter(r => r.status !== 'Match').map((err, eIdx) => (
                <div key={eIdx} className="text-xs text-zinc-400 border-l-2 border-zinc-800 pl-3 py-1 my-2 last:mb-0">
                  <p className="font-semibold text-zinc-200">{err.label} → <span className="text-amber-400">{err.issue?.type}</span></p>
                  <p className="text-zinc-500 text-[11px] mt-0.5 font-medium">Reasoning: {err.issue?.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}