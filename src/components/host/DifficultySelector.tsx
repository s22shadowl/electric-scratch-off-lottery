import type { DifficultyPreset } from "@/types";
import { DIFFICULTY_PRESETS } from "@/utils/prize-presets";

interface DifficultySelectorProps {
  value: DifficultyPreset;
  onChange: (preset: DifficultyPreset) => void;
}

const PRESET_ORDER: DifficultyPreset[] = [
  "generous",
  "standard",
  "conservative",
  "realistic",
];

export default function DifficultySelector({
  value,
  onChange,
}: DifficultySelectorProps) {
  return (
    <section>
      <h2 className="text-lg font-bold text-yellow-300 mb-3">難度預設</h2>
      <div
        role="radiogroup"
        aria-label="難度預設"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {PRESET_ORDER.map((preset) => {
          const info = DIFFICULTY_PRESETS[preset];
          const isSelected = value === preset;
          return (
            <button
              key={preset}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(preset)}
              className={`flex flex-col items-center gap-1 px-3 py-3 rounded-lg border-2 transition-colors text-center ${
                isSelected
                  ? "border-yellow-400 bg-yellow-400/20 text-yellow-300"
                  : "border-red-700 bg-red-900/50 text-red-200 hover:border-red-500"
              }`}
            >
              <span className="text-2xl" aria-hidden="true">
                {info.emoji}
              </span>
              <span className="text-sm font-bold">{info.label}</span>
              <span className="text-xs opacity-70">
                {(info.targetRtp * 100).toFixed(0)}% RTP
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
