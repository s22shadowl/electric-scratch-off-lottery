import { useState, useEffect, useRef, useId } from "react";

interface InfoTooltipProps {
  content: string;
  position?: "top" | "bottom" | "right";
}

export default function InfoTooltip({
  content,
  position = "top",
}: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!visible) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setVisible(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [visible]);

  const positionClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="說明"
        aria-expanded={visible}
        aria-describedby={visible ? tooltipId : undefined}
        onClick={() => setVisible((v) => !v)}
        className="text-red-300 hover:text-yellow-300 transition-colors text-sm leading-none"
      >
        ⓘ
      </button>
      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 w-48 px-3 py-2 text-xs text-white bg-gray-900 border border-gray-600 rounded-lg shadow-xl whitespace-normal ${positionClasses[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
