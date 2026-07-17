

import React, { useState } from "react";
import { api } from "../api";
import SummaryCard from "./visual/SummaryCard";
import ScreenshotGallery from "./visual/ScreenshotGallery";
import IssueGallery from "./visual/IssueGallery";
import FullPageViewer from "./visual/FullPageViewer";
import IssueSidebar from "./visual/IssueSidebar";
import AccordionSection from "./visual/AccordionSection";




export default function VisualMatchPanel() {
  const [url, setUrl] = useState("");
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });
  const [ignoreSelectors, setIgnoreSelectors] = useState([
    ".cookie-banner",
    ".chat-widget",
  ]);
  const [newSelector, setNewSelector] = useState("");
  const [baselineFile, setBaselineFile] = useState(null); // Tracks file for upload
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const viewports = [
    { name: "Desktop", width: 1920, height: 1080 },
    { name: "Laptop", width: 1366, height: 768 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Mobile", width: 375, height: 812 },
  ];

  const handleAddSelector = () => {
    if (newSelector && !ignoreSelectors.includes(newSelector)) {
      setIgnoreSelectors([...ignoreSelectors, newSelector]);
      setNewSelector("");
    }
  };
const [selectedIssue, setSelectedIssue] =
  useState(null);


  const runVisualTest = async () => {
    if (!baselineFile) return alert("Please upload a reference image first.");

    setLoading(true);
    setResult(null);
    try {
      // 1. Actually upload the file bytes to the backend first.
      //    The backend writes it to data/baselines/ and returns the real path.
      const { path: baselinePath } = await api.uploadBaseline(baselineFile);

      // 2. Now run the visual test using the path that actually exists on disk.
      const payload = { url, viewport, ignoreSelectors, baselinePath };

      const data = await api.runVisualTest(payload);
      console.log("API Response:", data);
      console.log("Statistics:", data.statistics);
      console.log("Matched:", data.statistics?.matchedPixels);

      setResult(data);
    } catch (err) {
      console.error("Visual Test Failed:", err);
      alert("Visual test failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">VISUAL REGRESSION TEST</h2>

      <input
        className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded"
        placeholder="https://digimantra.com/..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <input
        type="file"
        className="mb-4 block text-sm text-gray-400"
        onChange={(e) => setBaselineFile(e.target.files[0])}
      />

      <div className="grid grid-cols-2 gap-2 mb-4">
        {viewports.map((v) => (
          <button
            key={v.name}
            className={`p-2 border ${viewport.width === v.width ? "border-blue-500 bg-blue-900" : "border-gray-700"}`}
            onClick={() => setViewport({ width: v.width, height: v.height })}
          >
            {v.name} ({v.width}×{v.height})
          </button>
        ))}
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-2">Ignore Selectors</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {ignoreSelectors.map((sel) => (
            <span
              key={sel}
              className="bg-red-900 px-2 py-1 rounded text-xs flex items-center"
            >
              {sel}{" "}
              <button
                className="ml-2"
                onClick={() =>
                  setIgnoreSelectors(ignoreSelectors.filter((s) => s !== sel))
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded text-sm"
            value={newSelector}
            onChange={(e) => setNewSelector(e.target.value)}
            placeholder=".header-clock"
          />
          <button
            onClick={handleAddSelector}
            className="bg-green-700 px-3 rounded"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={runVisualTest}
        disabled={loading}
        className="w-full bg-blue-600 py-3 rounded font-bold hover:bg-blue-500 disabled:bg-gray-600"
      >
        {loading ? "RUNNING..." : "RUN VISUAL TEST"}
      </button>

    {result?.summary && result?.statistics && (
  <div className="mt-8 border-t border-gray-700 pt-6">

    {/* ================= HEADER ================= */}
    <SummaryCard

    summary={result.summary}

    issueSummary={result.issueSummary}

/>

    {/* ================= IMAGES ================= */}

   <ScreenshotGallery
    artifacts={result.artifacts}
/>


{/* ================= FULL REPORT ================= */}

<AccordionSection
    title="Full Report"
    defaultOpen={false}
>

    <div className="grid lg:grid-cols-4 gap-6">

        <div className="lg:col-span-3">

            <FullPageViewer
                artifacts={result.artifacts}
                issues={result.issues}
                selectedIssue={selectedIssue}
                onSelectIssue={setSelectedIssue}
            />

        </div>

        <IssueSidebar
            issues={result.issues}
            selectedIssue={selectedIssue}
            onSelectIssue={setSelectedIssue}
        />

    </div>
    

    {/* Statistics */}

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-950 rounded border border-gray-800 p-4 mt-6">

        <div>
            <p className="text-gray-500 text-xs">MATCHED PIXELS</p>
            <p className="text-lg font-mono">
                {result.statistics.matchedPixels.toLocaleString()}
            </p>
        </div>

        <div>
            <p className="text-gray-500 text-xs">DIFFERENT PIXELS</p>
            <p className="text-lg font-mono text-red-400">
                {result.statistics.differentPixels.toLocaleString()}
            </p>
        </div>

        <div>
            <p className="text-gray-500 text-xs">TOTAL PIXELS</p>
            <p className="text-lg font-mono">
                {result.statistics.totalPixels.toLocaleString()}
            </p>
        </div>

        <div>
            <p className="text-gray-500 text-xs">EXECUTION TIME</p>
            <p className="text-lg font-mono">
                {result.metadata.executionTime}
            </p>
        </div>

    </div>

    {/* Analysis */}

    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">

        <div className="bg-gray-800 rounded p-4">
            <p className="text-gray-400 text-sm">Layout</p>
            <p className="font-bold">{result.analysis.layout}</p>
        </div>

        <div className="bg-gray-800 rounded p-4">
            <p className="text-gray-400 text-sm">Visual</p>
            <p className="font-bold">{result.analysis.visual}</p>
        </div>

        <div className="bg-gray-800 rounded p-4">
            <p className="text-gray-400 text-sm">Ignored</p>
            <p className="font-bold">{result.analysis.dynamic.ignored}</p>
        </div>

        <div className="bg-gray-800 rounded p-4">
            <p className="text-gray-400 text-sm">Masked</p>
            <p className="font-bold">{result.analysis.dynamic.masked}</p>
        </div>

    </div>

</AccordionSection>
{/* ================= SMART ISSUES ================= */}

<AccordionSection
    title="Smart Issues"
    count={result.issueSummary?.total}
    defaultOpen={true}
>
    <IssueGallery
        issues={result.issues}
    />
</AccordionSection>

  </div>
)}
    </div>
  );
}
                                                                                 