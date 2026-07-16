import { useState } from "react";

const BACKEND =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const severityColor = {
  Critical: "bg-red-600",
  High: "bg-orange-500",
  Medium: "bg-yellow-500 text-black",
  Low: "bg-green-600",
};

export default function IssueCard({ issue, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">

      {/* Header */}

      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-6 py-4 hover:bg-gray-800 transition"
      >
        <div className="text-left">

          <h3 className="font-bold text-lg">
            Issue #{index + 1}
          </h3>

          <p className="text-gray-400">
            {issue.section}
          </p>

        </div>

        <div className="flex gap-3 items-center">

          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              severityColor[issue.severity]
            }`}
          >
            {issue.severity}
          </span>

          <span className="text-blue-400 font-bold">
            {issue.confidence}
          </span>

        </div>

      </button>

      {/* Expanded */}

      {open && (
        <div className="border-t border-gray-700 p-6">

          <div className="grid grid-cols-2 gap-6 mb-6">

            <Info title="Category" value={issue.category} />
            <Info title="Section" value={issue.section} />
            <Info title="Severity" value={issue.severity} />
            <Info title="Confidence" value={issue.confidence} />

          </div>

          <div className="mb-6">

            <h4 className="font-semibold mb-2">
              Description
            </h4>

            <p className="text-gray-300">
              {issue.description}
            </p>

          </div>

          <div className="mb-6">

            <h4 className="font-semibold mb-2">
              Recommendation
            </h4>

            <p className="text-green-400">
              {issue.recommendation}
            </p>

          </div>

          <div className="grid md:grid-cols-3 gap-5">

            <ImageCard
              title="Reference"
              src={issue.evidence?.baseline}
            />

            <ImageCard
              title="Live"
              src={issue.evidence?.live}
            />

            <ImageCard
              title="Difference"
              src={issue.evidence?.diff}
            />

          </div>

        </div>
      )}

    </div>
  );
}

function Info({ title, value }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">

      <div className="text-xs text-gray-400">
        {title}
      </div>

      <div className="font-semibold mt-1">
        {value}
      </div>

    </div>
  );
}

function ImageCard({ title, src }) {

  if (!src) return null;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">

      <div className="p-3 border-b border-gray-700">

        <h4>{title}</h4>

      </div>

      <img
        src={`${BACKEND}/${src}`}
        alt={title}
        className="w-full"
      />

    </div>
  );
}