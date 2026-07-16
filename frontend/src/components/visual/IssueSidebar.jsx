const severityColors = {
  Critical: "bg-red-600",
  High: "bg-orange-500",
  Medium: "bg-yellow-500 text-black",
  Low: "bg-green-600",
};

export default function IssueSidebar({
  issues = [],
  selectedIssue,
  onSelectIssue,
}) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl h-full overflow-hidden">

      <div className="border-b border-gray-700 px-5 py-4">

        <h2 className="text-xl font-bold">
          Detected Issues
        </h2>

        <p className="text-gray-400 text-sm mt-1">
          {issues.length} issue(s) found
        </p>

      </div>

      <div className="overflow-y-auto max-h-[850px]">

        {issues.length === 0 && (

          <div className="p-8 text-center text-gray-500">

            No issues detected 🎉

          </div>

        )}

        {issues.map(issue => {

          const active =
            selectedIssue?.id === issue.id;

          return (

            <button
              key={issue.id}
              onClick={() => onSelectIssue(issue)}
              className={`w-full text-left p-5 border-b border-gray-800 transition

                ${
                  active
                    ? "bg-blue-900"
                    : "hover:bg-gray-800"
                }
              `}
            >

              <div className="flex justify-between">

                <div>

                  <h3 className="font-semibold">

                    {issue.section}

                  </h3>

                  <p className="text-sm text-gray-400 mt-1">

                    {issue.category}

                  </p>

                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    severityColors[issue.severity]
                  }`}
                >
                  {issue.severity}
                </span>

              </div>

              <div className="mt-3">

                <p className="text-gray-300 text-sm line-clamp-2">

                  {issue.description}

                </p>

              </div>

              <div className="mt-4 flex justify-between text-sm">

                <span className="text-blue-400">

                  Confidence

                </span>

                <span>

                  {issue.confidence}

                </span>

              </div>

            </button>

          );

        })}

      </div>

    </div>
  );
}