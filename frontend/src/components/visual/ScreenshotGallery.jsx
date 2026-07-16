import { useState } from "react";

const BACKEND =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function ScreenshotGallery({ artifacts }) {
  const [selected, setSelected] = useState(null);

  const images = [
    {
      title: "Reference",
      src: artifacts?.baseline,
    },
    {
      title: "Live",
      src: artifacts?.live,
    },
    {
      title: "Difference",
      src: artifacts?.diff,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {images.map((image) => (
          <div
            key={image.title}
            className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-lg"
          >
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="font-semibold">
                {image.title}
              </h3>
            </div>

            <div
              className="cursor-pointer overflow-hidden bg-black"
              onClick={() =>
                setSelected(`${BACKEND}/${image.src}`)
              }
            >
              <img
                src={`${BACKEND}/${image.src}`}
                alt={image.title}
                className="w-full object-contain transition duration-300 hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/600x400?text=Image+Not+Found";
                }}
              />
            </div>
          </div>
        ))}

      </div>

      {/* Modal */}

      {selected && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setSelected(null)}
        >
          <img
            src={selected}
            alt="Preview"
            className="max-h-[95vh] max-w-[95vw] rounded-lg shadow-2xl"
          />
        </div>
      )}
    </>
  );
}