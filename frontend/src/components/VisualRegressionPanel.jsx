import React, { useState } from 'react';
import axios from 'axios';

const VisualMatchPanel = ({ url }) => {
  const [baseline, setBaseline] = useState(null);
  const [diffImage, setDiffImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Upload Figma Design as Baseline
  const handleUpload = async (e) => {
    const formData = new FormData();
    formData.append('design', e.target.files[0]);
    formData.append('url', url);
    await axios.post('http://127.0.0.1:4000/api/visual/set-baseline', formData);
    setBaseline(URL.createObjectURL(e.target.files[0]));
  };

  // 2. Trigger Pixel-by-Pixel Comparison
  const runComparison = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post('http://127.0.0.1:4000/api/visual/compare-ui', { url });
      setDiffImage(`http://127.0.0.1:4000${data.diffUrl}`);
    } catch (err) {
      alert("Comparison failed: " + err.response?.data?.error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">UI vs. Figma Comparison</h2>
      
      <div className="flex gap-4 mb-6">
        <input type="file" onChange={handleUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700" />
        <button onClick={runComparison} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {loading ? 'Comparing...' : 'Run Visual Diff'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {baseline && (
          <div>
            <h3 className="font-semibold mb-2">Figma Baseline</h3>
            <img src={baseline} alt="Baseline" className="w-full border" />
          </div>
        )}
        {diffImage && (
          <div>
            <h3 className="font-semibold mb-2">Visual Differences (Red Highlight)</h3>
            <img src={diffImage} alt="Diff" className="w-full border border-red-500" />
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualMatchPanel;