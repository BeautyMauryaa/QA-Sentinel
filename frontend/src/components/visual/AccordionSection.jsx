import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function AccordionSection({
  title,
  count,
  defaultOpen = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-6 rounded-xl border border-gray-700 bg-gray-900 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800 transition"
      >
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronDown size={18} />
          ) : (
            <ChevronRight size={18} />
          )}

          <span className="font-bold text-lg">
            {title}
          </span>

          {count !== undefined && (
            <span className="bg-blue-600 text-xs px-2 py-1 rounded-full">
              {count}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-700 p-5">
          {children}
        </div>
      )}
    </div>
  );
}