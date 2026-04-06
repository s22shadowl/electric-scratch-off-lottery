import { useState } from "react";
import type { PrizeDraft } from "@/hooks/useHostForm";
import { autoLabel } from "@/utils/prize-presets";

interface Props {
  prizes: PrizeDraft[];
  weightTotal: number;
  onUpdate: (
    uid: string,
    field: keyof Omit<PrizeDraft, "uid">,
    value: string,
  ) => void;
  onAdd: () => void;
  onRemove: (uid: string) => void;
  onAmountBlur?: () => void;
  disabled?: boolean;
}

export default function PrizeEditor({
  prizes,
  weightTotal,
  onUpdate,
  onAdd,
  onRemove,
  onAmountBlur,
  disabled,
}: Props) {
  const [editingLabelUid, setEditingLabelUid] = useState<string | null>(null);

  const handleLabelClick = (uid: string) => {
    if (disabled) return;
    setEditingLabelUid(uid);
  };

  const handleLabelBlur = (prize: PrizeDraft, value: string) => {
    const trimmed = value.trim();
    // If the entered value matches the auto-generated label, store empty string
    if (trimmed === autoLabel(prize.amount)) {
      onUpdate(prize.uid, "label", "");
    } else {
      onUpdate(prize.uid, "label", trimmed);
    }
    setEditingLabelUid(null);
  };

  const handleLabelKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    prize: PrizeDraft,
  ) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditingLabelUid(null);
    }
  };

  const isWeightValid = Math.abs(weightTotal - 100) < 0.01;

  return (
    <section aria-label="獎項設定" className="relative">
      {/* Shimmer keyframes injected via style tag */}
      <style>{`
        @keyframes prize-row-enter {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .prize-row-anim { animation: none !important; }
          .shimmer-bar { animation: none !important; }
        }
      `}</style>

      {disabled && (
        <div className="absolute inset-0 bg-gray-900/60 rounded-lg z-10 flex items-center justify-center">
          <span className="text-gray-300 text-sm">賓果玩法不使用獎項設定</span>
        </div>
      )}

      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_5rem_6rem_2.5rem] gap-2 mb-3 items-center">
        <h2 className="text-lg font-bold text-yellow-300 col-span-2">獎項設定</h2>
        <span />
        <button
          type="button"
          onClick={onAdd}
          aria-label="新增獎項"
          disabled={disabled}
          tabIndex={disabled ? -1 : undefined}
          className="px-3 py-1 text-sm bg-yellow-400 text-red-900 font-bold rounded hover:bg-yellow-300 transition-colors"
        >
          ＋ 新增
        </button>
        <span />
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[auto_1fr_5rem_6rem_2.5rem] gap-2 mb-1">
        <span className="text-xs text-red-200 pl-2">名稱</span>
        <span className="text-xs text-red-200 pl-2">金額（元）</span>
        <span className="text-xs text-red-200 pl-2">權重</span>
        <span className="text-xs text-red-200 pl-1">機率</span>
        <span />
      </div>

      {/* Prize rows */}
      <ul className="space-y-2">
        {prizes.map((prize) => {
          const pct =
            weightTotal > 0
              ? ((parseFloat(prize.weight) || 0) / weightTotal) * 100
              : 0;
          const isRare = pct < 0.01 && pct > 0;
          const isEditing = editingLabelUid === prize.uid;
          const displayLabel = prize.label || autoLabel(prize.amount);

          return (
            <li
              key={prize.uid}
              className="prize-row-anim grid grid-cols-[auto_1fr_5rem_6rem_2.5rem] gap-2 items-center"
              style={{
                animation: "prize-row-enter 0.3s ease-out",
                borderLeft: isRare ? "2px solid rgba(251, 191, 36, 0.4)" : "2px solid transparent",
              }}
            >
              {/* Label: button or input */}
              {isEditing ? (
                <input
                  type="text"
                  defaultValue={prize.label}
                  autoFocus
                  onBlur={(e) => handleLabelBlur(prize, e.target.value)}
                  onKeyDown={(e) => handleLabelKeyDown(e, prize)}
                  placeholder={autoLabel(prize.amount)}
                  aria-label="獎項名稱"
                  className="px-2 py-1 rounded bg-red-900 border border-yellow-400 text-white placeholder-red-400 text-sm focus:outline-none min-w-[6rem]"
                  style={{
                    animation: "prize-row-enter 0.2s ease-out",
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => handleLabelClick(prize.uid)}
                  aria-label="獎項名稱"
                  disabled={disabled}
                  tabIndex={disabled ? -1 : undefined}
                  className="px-2 py-1 rounded bg-red-900/60 border border-red-700 text-white text-sm text-left hover:border-yellow-400 hover:bg-red-900 transition-colors truncate min-w-[6rem] cursor-pointer disabled:cursor-default"
                >
                  {displayLabel}
                </button>
              )}

              {/* Amount */}
              <input
                type="number"
                value={prize.amount}
                onChange={(e) => onUpdate(prize.uid, "amount", e.target.value)}
                onBlur={onAmountBlur}
                min="0"
                aria-label="獎項金額"
                disabled={disabled}
                tabIndex={disabled ? -1 : undefined}
                className="px-2 py-1 rounded bg-red-900 border border-red-700 text-white text-sm focus:outline-none focus:border-yellow-400"
              />

              {/* Weight */}
              <input
                type="number"
                value={prize.weight}
                onChange={(e) => onUpdate(prize.uid, "weight", e.target.value)}
                min="0"
                aria-label="相對權重"
                disabled={disabled}
                tabIndex={disabled ? -1 : undefined}
                className="px-2 py-1 rounded bg-red-900 border border-red-700 text-white text-sm focus:outline-none focus:border-yellow-400"
              />

              {/* Probability bar */}
              <div className="w-full flex items-center gap-1">
                <div className="flex-1 h-1.5 bg-red-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isRare ? "shimmer-bar" : ""}`}
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      ...(isRare
                        ? {
                            background:
                              "linear-gradient(90deg, #fbbf24 0%, #fef3c7 50%, #fbbf24 100%)",
                            backgroundSize: "200% 100%",
                            animation: "shimmer 2s linear infinite",
                          }
                        : {
                            backgroundColor:
                              pct < 0.01 ? "#fbbf24" : "#ef4444",
                          }),
                    }}
                  />
                </div>
                <span className="text-[10px] text-red-300 w-10 text-right tabular-nums">
                  {pct < 0.01 && pct > 0
                    ? pct.toFixed(4)
                    : pct < 1
                      ? pct.toFixed(2)
                      : pct.toFixed(1)}
                  %
                </span>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => onRemove(prize.uid)}
                aria-label={`刪除獎項 ${displayLabel}`}
                disabled={disabled || prizes.length <= 1}
                tabIndex={disabled ? -1 : undefined}
                className="text-red-300 hover:text-white disabled:opacity-30 text-lg leading-none transition-colors"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>

      {/* Sum row */}
      <div className="grid grid-cols-[auto_1fr_5rem_6rem_2.5rem] gap-2 mt-2 border-t border-red-700 pt-2">
        <span className="text-xs text-red-300 pl-2">合計</span>
        <span />
        <span
          className={`text-sm font-bold pl-2 ${
            isWeightValid ? "text-green-400" : "text-red-200"
          }`}
        >
          {weightTotal.toFixed(2)}
        </span>
        <span
          className={`text-[10px] pl-1 font-bold ${
            isWeightValid ? "text-green-400" : "text-yellow-400"
          }`}
        >
          {isWeightValid ? "= 100%" : "≠ 100%"}
        </span>
        <span />
      </div>
    </section>
  );
}
