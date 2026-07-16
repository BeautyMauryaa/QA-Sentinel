// import React, { useState } from "react";
// import { api } from "../api";

// export default function VisualMatchPanel() {
//   const [url, setUrl] = useState("");
//   const [viewport, setViewport] = useState({ width: 1920, height: 1080 });
//   const [ignoreSelectors, setIgnoreSelectors] = useState([
//     ".cookie-banner",
//     ".chat-widget",
//   ]);
//   const [newSelector, setNewSelector] = useState("");
//   const [baselineFile, setBaselineFile] = useState(null); // Tracks file for upload
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);

//   const viewports = [
//     { name: "Desktop", width: 1920, height: 1080 },
//     { name: "Laptop", width: 1366, height: 768 },
//     { name: "Tablet", width: 768, height: 1024 },
//     { name: "Mobile", width: 375, height: 812 },
//   ];

//   const handleAddSelector = () => {
//     if (newSelector && !ignoreSelectors.includes(newSelector)) {
//       setIgnoreSelectors([...ignoreSelectors, newSelector]);
//       setNewSelector("");
//     }
//   };

//   const runVisualTest = async () => {
//     if (!baselineFile) return alert("Please upload a reference image first.");

//     setLoading(true);
//     setResult(null);
//     try {
//       // 1. Actually upload the file bytes to the backend first.
//       //    The backend writes it to data/baselines/ and returns the real path.
//       const { path: baselinePath } = await api.uploadBaseline(baselineFile);

//       // 2. Now run the visual test using the path that actually exists on disk.
//       const payload = { url, viewport, ignoreSelectors, baselinePath };

//       const data = await api.runVisualTest(payload);
//       console.log("API Response:", data);
//       console.log("Statistics:", data.statistics);
//       console.log("Matched:", data.statistics?.matchedPixels);

//       setResult(data);
//     } catch (err) {
//       console.error("Visual Test Failed:", err);
//       alert("Visual test failed: " + err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6 bg-gray-900 text-white rounded-lg">
//       <h2 className="text-xl font-bold mb-4">VISUAL REGRESSION TEST</h2>

//       <input
//         className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded"
//         placeholder="https://digimantra.com/..."
//         value={url}
//         onChange={(e) => setUrl(e.target.value)}
//       />

//       <input
//         type="file"
//         className="mb-4 block text-sm text-gray-400"
//         onChange={(e) => setBaselineFile(e.target.files[0])}
//       />

//       <div className="grid grid-cols-2 gap-2 mb-4">
//         {viewports.map((v) => (
//           <button
//             key={v.name}
//             className={`p-2 border ${viewport.width === v.width ? "border-blue-500 bg-blue-900" : "border-gray-700"}`}
//             onClick={() => setViewport({ width: v.width, height: v.height })}
//           >
//             {v.name} ({v.width}×{v.height})
//           </button>
//         ))}
//       </div>

//       <div className="mb-4">
//         <label className="block text-sm mb-2">Ignore Selectors</label>
//         <div className="flex flex-wrap gap-2 mb-2">
//           {ignoreSelectors.map((sel) => (
//             <span
//               key={sel}
//               className="bg-red-900 px-2 py-1 rounded text-xs flex items-center"
//             >
//               {sel}{" "}
//               <button
//                 className="ml-2"
//                 onClick={() =>
//                   setIgnoreSelectors(ignoreSelectors.filter((s) => s !== sel))
//                 }
//               >
//                 ×
//               </button>
//             </span>
//           ))}
//         </div>
//         <div className="flex gap-2">
//           <input
//             className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded text-sm"
//             value={newSelector}
//             onChange={(e) => setNewSelector(e.target.value)}
//             placeholder=".header-clock"
//           />
//           <button
//             onClick={handleAddSelector}
//             className="bg-green-700 px-3 rounded"
//           >
//             +
//           </button>
//         </div>
//       </div>

//       <button
//         onClick={runVisualTest}
//         disabled={loading}
//         className="w-full bg-blue-600 py-3 rounded font-bold hover:bg-blue-500 disabled:bg-gray-600"
//       >
//         {loading ? "RUNNING..." : "RUN VISUAL TEST"}
//       </button>

//     {result?.summary && result?.statistics && (
//   <div className="mt-8 border-t border-gray-700 pt-6">

//     {/* ================= HEADER ================= */}
//     <div className="flex justify-between items-center mb-6">
//       <h3 className="text-2xl font-bold">Comparison Results</h3>

//       <div
//         className={`px-4 py-2 rounded font-bold ${
//           result.summary.status === "PASS"
//             ? "bg-green-900 text-green-300"
//             : result.summary.status === "NEED IMPROVEMENT"
//             ? "bg-yellow-900 text-yellow-300"
//             : "bg-red-900 text-red-300"
//         }`}
//       >
//         {result.summary.status} ({result.summary.score}%)
//       </div>
//     </div>

//     {/* ================= IMAGES ================= */}

//     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//       {[
//         { title: "Reference", src: result.artifacts.baseline },
//         { title: "Live", src: result.artifacts.live },
//         { title: "Difference", src: result.artifacts.diff },
//       ].map((img, idx) => (
//         <div
//           key={idx}
//           className="bg-gray-800 rounded border border-gray-700 p-2"
//         >
//           <p className="text-xs text-gray-400 uppercase mb-2">
//             {img.title}
//           </p>

//           <img
//             src={`http://localhost:4000/${img.src}`}
//             alt={img.title}
//             className="w-full rounded"
//           />
//         </div>
//       ))}
//     </div>

//     {/* ================= STATISTICS ================= */}

//     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-950 rounded border border-gray-800 p-4">

//       <div>
//         <p className="text-gray-500 text-xs">MATCHED PIXELS</p>
//         <p className="text-lg font-mono">
//           {result.statistics.matchedPixels.toLocaleString()}
//         </p>
//       </div>

//       <div>
//         <p className="text-gray-500 text-xs">DIFFERENT PIXELS</p>
//         <p className="text-lg font-mono text-red-400">
//           {result.statistics.differentPixels.toLocaleString()}
//         </p>
//       </div>

//       <div>
//         <p className="text-gray-500 text-xs">TOTAL PIXELS</p>
//         <p className="text-lg font-mono">
//           {result.statistics.totalPixels.toLocaleString()}
//         </p>
//       </div>

//       <div>
//         <p className="text-gray-500 text-xs">EXECUTION TIME</p>
//         <p className="text-lg font-mono">
//           {result.metadata.executionTime}
//         </p>
//       </div>

//     </div>

//     {/* ================= SUMMARY ================= */}

//     <div className="mt-6 bg-gray-800 rounded border border-gray-700 p-4">
//       <h4 className="text-lg font-bold mb-2">
//         Summary
//       </h4>

//       <p className="text-gray-300">
//         {result.summary.message}
//       </p>
//     </div>

//     {/* ================= ANALYSIS ================= */}

//     <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">

//       <div className="bg-gray-800 rounded p-4">
//         <p className="text-gray-400 text-sm">Layout</p>
//         <p className="font-bold">{result.analysis.layout}</p>
//       </div>

//       <div className="bg-gray-800 rounded p-4">
//         <p className="text-gray-400 text-sm">Visual</p>
//         <p className="font-bold">{result.analysis.visual}</p>
//       </div>

//       <div className="bg-gray-800 rounded p-4">
//         <p className="text-gray-400 text-sm">Ignored</p>
//         <p className="font-bold">{result.analysis.dynamic.ignored}</p>
//       </div>

//       <div className="bg-gray-800 rounded p-4">
//         <p className="text-gray-400 text-sm">Masked</p>
//         <p className="font-bold">{result.analysis.dynamic.masked}</p>
//       </div>

//     </div>

//     {/* ================= ISSUES ================= */}

//     {result.issues?.length > 0 && (
//       <div className="mt-6 bg-gray-900 rounded border border-gray-700 p-4">

//         <h4 className="text-lg font-bold mb-4">
//           Issues
//         </h4>

//         {result.issues.map((issue, index) => (
//           <div
//             key={index}
//             className="border-b border-gray-700 last:border-none py-3"
//           >
//             <div className="flex justify-between">

//               <p className="font-semibold">
//                 {issue.category}
//               </p>

//               <span className="text-xs px-2 py-1 rounded bg-red-800">
//                 {issue.severity}
//               </span>

//             </div>

//             <p className="text-gray-400 text-sm mt-1">
//               {issue.message}
//             </p>

//           </div>
//         ))}

//       </div>
//     )}

//   </div>
// )}
//     </div>
//   );
// }


import React, { useState } from "react";
import { api } from "../api";
import SummaryCard from "./visual/SummaryCard";
import ScreenshotGallery from "./visual/ScreenshotGallery";
import IssueGallery from "./visual/IssueGallery";
import FullPageViewer from "./visual/FullPageViewer";
import IssueSidebar from "./visual/IssueSidebar";




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
<IssueGallery
    issues={result.issues}
/><div className="grid lg:grid-cols-4 gap-6">

    <div className="lg:col-span-3">

        <FullPageViewer
            artifacts={result.artifacts}
            issues={result.issues}
            onSelectIssue={setSelectedIssue}
        />

    </div>

    <IssueSidebar
        issues={result.issues}
        selectedIssue={selectedIssue}
        onSelectIssue={setSelectedIssue}
    />

</div>
    {/* ================= STATISTICS ================= */}

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-950 rounded border border-gray-800 p-4">

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

    {/* ================= SUMMARY ================= */}

    <div className="mt-6 bg-gray-800 rounded border border-gray-700 p-4">
      <h4 className="text-lg font-bold mb-2">
        Summary
      </h4>

      <p className="text-gray-300">
        {result.summary.message}
      </p>
    </div>

    {/* ================= ANALYSIS ================= */}

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

    {/* ================= ISSUES ================= */}

    {result.issues?.length > 0 && (
      <div className="mt-6 bg-gray-900 rounded border border-gray-700 p-4">

        <h4 className="text-lg font-bold mb-4">
          Issues
        </h4>

        {result.issues.map((issue, index) => (
          <div
            key={index}
            className="border-b border-gray-700 last:border-none py-3"
          >
            <div className="flex justify-between">

              <p className="font-semibold">
                {issue.category}
              </p>

              <span className="text-xs px-2 py-1 rounded bg-red-800">
                {issue.severity}
              </span>

            </div>

            <p className="text-gray-400 text-sm mt-1">
              {issue.message}
            </p>

          </div>
        ))}

      </div>
    )}

  </div>
)}
    </div>
  );
}
                                                                                 