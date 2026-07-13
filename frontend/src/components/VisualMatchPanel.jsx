import React, { useState } from 'react';
import { api } from '../api';

export default function VisualMatchPanel() {
  const [url, setUrl] = useState('');
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });
  const [ignoreSelectors, setIgnoreSelectors] = useState(['.cookie-banner', '.chat-widget']);
  const [newSelector, setNewSelector] = useState('');
  const [baselineFile, setBaselineFile] = useState(null); // Tracks file for upload
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Laptop', width: 1366, height: 768 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 812 },
  ];

  const handleAddSelector = () => {
    if (newSelector && !ignoreSelectors.includes(newSelector)) {
      setIgnoreSelectors([...ignoreSelectors, newSelector]);
      setNewSelector('');
    }
  };

  const runVisualTest = async () => {
    if (!baselineFile) return alert("Please upload a reference image first.");
    
    setLoading(true);
    setResult(null);
    try {
      // Note: Backend expects path. Ensure your backend handles the uploaded file path
      const payload = { 
        url, 
        viewport, 
        ignoreSelectors, 
        baselinePath: `data/baselines/${baselineFile.name}` 
      };
      
      const data = await api.runVisualTest(payload);
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
            className={`p-2 border ${viewport.width === v.width ? 'border-blue-500 bg-blue-900' : 'border-gray-700'}`}
            onClick={() => setViewport({ width: v.width, height: v.height })}
          >
            {v.name} ({v.width}×{v.height})
          </button>
        ))}
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-2">Ignore Selectors</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {ignoreSelectors.map(sel => (
            <span key={sel} className="bg-red-900 px-2 py-1 rounded text-xs flex items-center">
              {sel} <button className="ml-2" onClick={() => setIgnoreSelectors(ignoreSelectors.filter(s => s !== sel))}>×</button>
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
          <button onClick={handleAddSelector} className="bg-green-700 px-3 rounded">+</button>
        </div>
      </div>

      <button 
        onClick={runVisualTest} 
        disabled={loading}
        className="w-full bg-blue-600 py-3 rounded font-bold hover:bg-blue-500 disabled:bg-gray-600"
      >
        {loading ? 'RUNNING...' : 'RUN VISUAL TEST'}
      </button>

      {result && (
        <div className="mt-8 border-t border-gray-700 pt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">Comparison Results</h3>
            <div className={`px-4 py-2 rounded font-bold ${result.status === 'PASS' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {result.status} ({result.score}%)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { title: "Reference", src: result.baselinePath },
              { title: "Live", src: result.livePath },
              { title: "Difference", src: result.diffPath }
            ].map((img, idx) => (
              <div key={idx} className="bg-gray-800 p-2 rounded border border-gray-700">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">{img.title}</p>
                <img src={`/${img.src}`} alt={img.title} className="w-full rounded shadow-lg" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-950 p-4 rounded border border-gray-800">
            <div>
              <p className="text-gray-500 text-xs">MATCHED PIXELS</p>
              <p className="text-lg font-mono">{result.stats.matchedPixels.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">DIFFERENT PIXELS</p>
              <p className="text-lg font-mono text-red-400">{result.stats.diffPixels.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">THRESHOLD</p>
              <p className="text-lg font-mono">0.15</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">COMPARISON TIME</p>
              <p className="text-lg font-mono">{result.stats.time}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}