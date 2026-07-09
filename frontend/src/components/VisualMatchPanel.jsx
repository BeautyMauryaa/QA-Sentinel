import React, { useState } from 'react';
import axios from 'axios';

const VIEWPORTS = [
  { label: 'Full HD', width: 1920, height: 1080 },
  { label: 'Laptop', width: 1366, height: 768 },
  { label: 'Mobile', width: 375, height: 812 },
];

const VisualMatchPanel = () => {
  const [form, setForm] = useState({ url: '', username: '', password: '', file: null, viewport: VIEWPORTS[0] });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runComparison = async () => {
    if (!form.file || !form.url) return alert("Please provide URL and design file.");

    setLoading(true);

    
    setResult(null);

    const fd = new FormData();
    fd.append('design', form.file);
    fd.append('url', form.url);
    fd.append('username', form.username);
    fd.append('password', form.password);
    fd.append('width', form.viewport.width);
    fd.append('height', form.viewport.height);

    try {
      const { data } = await axios.post('http://127.0.0.1:4000/api/visual/compare', fd);
      setResult({ ...data, diffUrl: `http://127.0.0.1:4000${data.diffUrl}` });
    } catch (err) {
      alert("Comparison failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-panel border border-panelborder rounded text-mist">
      <h2 className="text-xl font-mono uppercase tracking-widest mb-6">Compare Design vs Live</h2>

      {/* Input Section */}
      <div className="grid gap-4 mb-6">
        <input onChange={e => setForm({...form, url: e.target.value})} placeholder="https://example.com" className="w-full p-3 bg-ink border border-panelborder rounded text-sm" />
        
        <div className="flex gap-4">
          <input type="file" onChange={e => setForm({...form, file: e.target.files[0]})} className="text-sm text-steel file:bg-panelborder file:border-0 file:px-4 file:py-2 file:rounded" />
          <div className="flex bg-ink rounded border border-panelborder p-1">
            {VIEWPORTS.map(vp => (
              <button key={vp.label} onClick={() => setForm({...form, viewport: vp})} className={`px-3 py-1 text-xs rounded ${form.viewport.label === vp.label ? 'bg-blue-600' : ''}`}>
                {vp.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={runComparison} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded font-mono text-xs uppercase tracking-widest">
        {loading ? "Analyzing Pixel Fidelity..." : "Run Comparison"}
      </button>

      {/* Result Stats Section */}
      {/* Result Stats Section */}

{result && result.matchScore !== undefined ? (
  <div className="mt-8 border-t border-panelborder pt-6">
    <div className="flex justify-between items-center mb-6">
      <div>
        <div className="text-5xl font-bold text-signal-pass">{result.matchScore}%</div>
        <div className="text-steel text-xs uppercase">Match Score</div>
      </div>
      <div className="text-right">
        {/* Safe rendering with ternary check */}
        <div className="text-xl text-mist">
          {result.diffPixels ? result.diffPixels.toLocaleString() : '0'}
        </div>
        <div className="text-steel text-xs uppercase">Diff Pixels</div>
      </div>
    </div>
    
    <div className="bg-ink p-2 rounded">
      <img src={result.diffUrl} className="w-full border border-panelborder" alt="Diff" />
    </div>
  </div>
) : loading ? <p className="text-steel mt-4">Processing...</p> : null}
    </div>
  );
};

export default VisualMatchPanel;