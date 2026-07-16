import { useMemo, useState, useRef } from "react";
import IssueHighlighter from "./IssueHighlighter";
import { useZoomController } from "./ZoomController";
import MarkerTooltip from "./MarkerTooltip";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const imageTypes = [
  {
    key: "baseline",
    label: "Reference",
  },
  {
    key: "live",
    label: "Live",
  },
  {
    key: "diff",
    label: "Difference",
  },
];
const markerColor = {
  Critical: "bg-red-600",
  High: "bg-orange-500",
  Medium: "bg-yellow-500 text-black",
  Low: "bg-green-600",
};


export default function FullPageViewer({
  artifacts,
  issues = [],
  selectedIssue,
  onSelectIssue,
}) {
  const viewerRef = useRef(null);
  const [hoveredIssue, setHoveredIssue] = useState(null);
  useZoomController({
    viewerRef,
    selectedIssue,
    scale: 1,
  });
  const [selectedImage, setSelectedImage] = useState("diff");

  const [naturalSize, setNaturalSize] = useState({
    width: 1,
    height: 1,
  });

  const imageSrc = useMemo(() => {
    if (!artifacts) return "";

    return `${BACKEND}/${artifacts[selectedImage]}`;
  }, [artifacts, selectedImage]);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* ===================================== */}
      {/* Header */}
      {/* ===================================== */}

      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">Full Page Viewer</h2>

        <div className="flex gap-2">
          {imageTypes.map((item) => (
            <button
              key={item.key}
              onClick={() => setSelectedImage(item.key)}
              className={`px-4 py-2 rounded-lg transition

                ${
                  selectedImage === item.key
                    ? "bg-blue-600"
                    : "bg-gray-800 hover:bg-gray-700"
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===================================== */}
      {/* Viewer */}
      {/* ===================================== */}

      <div ref={viewerRef} className="overflow-auto max-h-[900px] bg-gray-950">
        <div className="relative inline-block">
          {/* Screenshot */}

          <img
            key={selectedImage}
            src={imageSrc}
            alt="Visual Comparison"
            className="max-w-full h-auto transition-opacity duration-300"
            loading="lazy"
            onLoad={(e) => {
              setNaturalSize({
                width: e.target.naturalWidth,
                height: e.target.naturalHeight,
              });
            }}
          />
          {/* ===================================== */}
          {/* Selected Issue Highlight */}
          {/* ===================================== */}

          <IssueHighlighter
            issue={selectedIssue}
            imageWidth={naturalSize.width}
            imageHeight={naturalSize.height}
          />

          {/* ===================================== */}
          {/* Issue Markers */}
          {/* ===================================== */}

          {issues.map((issue, index) => {
            const left =
              ((issue.location.x + issue.location.width / 2) /
                naturalSize.width) *
              100;

            const top =
              ((issue.location.y + issue.location.height / 2) /
                naturalSize.height) *
              100;

            return (
              <button
                key={issue.id}
                onMouseEnter={() => setHoveredIssue(issue)}
                onMouseLeave={() => setHoveredIssue(null)}
                title={`${issue.section} (${issue.severity})`}
                onClick={() => onSelectIssue?.(issue)}
                className={`
  absolute
  w-8
  h-8
  rounded-full
  border-2
  border-white
  shadow-lg
  text-sm
  font-bold
  flex
  items-center
  justify-center
  transition
  hover:scale-110

  ${
    selectedIssue?.id === issue.id
      ? "bg-blue-600 ring-4 ring-blue-400"
      : `${markerColor[issue.severity] || "bg-red-600"} hover:scale-125`
  }
                `}
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <>
                  {index + 1}

                  {hoveredIssue?.id === issue.id && (
                    <MarkerTooltip issue={issue} index={index} />
                  )}
                </>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================== */}
      {/* Footer */}
      {/* ===================================== */}

      <div className="border-t border-gray-700 px-6 py-3 flex justify-between text-sm text-gray-400">
        <span>
          Image : <b className="text-white">{selectedImage.toUpperCase()}</b>
        </span>

        {selectedIssue ? (
          <span>
            Selected :<b className="text-blue-400"> {selectedIssue.section}</b>
          </span>
        ) : (
          <span>
            Issues :<b className="text-white"> {issues.length}</b>
          </span>
        )}
      </div>
    </div>
  );
}
