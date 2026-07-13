import React, { useState } from 'react';
import { api } from '../api'; // Use the consolidated api object

export default function VisualMatchPanel() {
  const [url, setUrl] = useState('');
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });
  const [ignoreSelectors, setIgnoreSelectors] = useState(['.cookie-banner', '.chat-widget']);
  const [newSelector, setNewSelector] = useState('');
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
    setLoading(true);
    setResult(null); // Clear previous result
    try {
      // Use the consolidated api object here
      const data = await api.runVisualTest({ url, viewport, ignoreSelectors });
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
        <div className="mt-6 border-t border-gray-700 pt-4">
          <h3 className="text-lg">Score: {result.score}%</h3>
          <p className={`font-bold ${parseFloat(result.score) > 95 ? 'text-green-500' : 'text-red-500'}`}>
            {parseFloat(result.score) > 95 ? 'PASS' : 'FAIL'}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <img src={result.baselinePath} alt="Baseline" />
            <img src={result.livePath} alt="Live" />
            <img src={result.diffPath} alt="Difference" />
          </div>
        </div>
      )}
    </div>
  );
}