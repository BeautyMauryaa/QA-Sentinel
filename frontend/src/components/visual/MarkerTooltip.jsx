const severityColors = {
  Critical: "text-red-400",
  High: "text-orange-400",
  Medium: "text-yellow-400",
  Low: "text-green-400",
};

export default function MarkerTooltip({ issue, index }) {
  if (!issue) return null;

  return (
    <div
      className="
        absolute
        left-1/2
        -translate-x-1/2
        bottom-full
        mb-3
        w-64
        rounded-xl
        bg-gray-900
        border
        border-gray-700
        shadow-2xl
        p-4
        text-left
        z-50
        pointer-events-none
      "
    >
      <div className="font-bold text-white">
        Issue #{index + 1}
      </div>

      <div className="text-gray-300 mt-1">
        {issue.section}
      </div>

      <div
        className={`mt-3 font-semibold ${
          severityColors[issue.severity]
        }`}
      >
        {issue.severity}
      </div>

      <div className="text-gray-400 text-sm mt-2">
        Confidence
      </div>

      <div className="font-semibold">
        {issue.confidence}
      </div>

      <div className="text-gray-400 text-sm mt-3">
        Category
      </div>

      <div>
        {issue.category}
      </div>

      <div className="text-gray-400 text-sm mt-3">
        Description
      </div>

      <div className="text-sm">
        {issue.description}
      </div>

      <div className="mt-4 text-blue-400 text-xs">
        Click to inspect →
      </div>

      {/* Triangle */}

      <div
        className="
          absolute
          left-1/2
          -translate-x-1/2
          top-full
          w-0
          h-0
          border-l-8
          border-r-8
          border-t-8
          border-transparent
          border-t-gray-700
        "
      />
    </div>
  );
}