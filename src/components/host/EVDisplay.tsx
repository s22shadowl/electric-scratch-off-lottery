import { useState } from "react";
import { classifyDifficulty, DIFFICULTY_PRESETS } from "@/utils/prize-presets";
import PrizePoolModal from "@/components/common/PrizePoolModal";
import type { CardTypeConfig } from "@/types";

interface EVDisplayProps {
  rtp: number | null;
  cardTypes?: CardTypeConfig[];
}

export default function EVDisplay({ rtp, cardTypes }: EVDisplayProps) {
  const [showPrizePool, setShowPrizePool] = useState(false);

  if (rtp === null) {
    return (
      <div
        data-testid="ev-display"
        className="rounded-lg bg-red-900/50 border border-red-700 px-4 py-3 text-sm text-red-400"
      >
        票面價格無效，無法計算返還率
      </div>
    );
  }

  const rtpPct = (rtp * 100).toFixed(0);
  const housePct = ((1 - rtp) * 100).toFixed(0);
  const difficulty = classifyDifficulty(rtp);
  const diffLabel =
    difficulty === "custom" ? "自訂" : DIFFICULTY_PRESETS[difficulty].label;

  let colorClass: string;
  if (rtp >= 1.0) {
    colorClass = "text-green-400 border-green-600 bg-green-900/20";
  } else if (rtp >= 0.7) {
    colorClass = "text-yellow-300 border-yellow-600 bg-yellow-900/20";
  } else {
    colorClass = "text-orange-400 border-orange-600 bg-orange-900/20";
  }

  const housePositive = 1 - rtp > 0;

  return (
    <>
      <div
        data-testid="ev-display"
        className={`rounded-lg border px-4 py-3 text-sm ${colorClass}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-xs opacity-70 block">
              返還率（玩家平均拿回）
            </span>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold">{rtpPct}%</span>
              {cardTypes && cardTypes.length > 0 && (
                <button
                  type="button"
                  aria-label="查看獎池"
                  onClick={() => setShowPrizePool(true)}
                  className="opacity-70 hover:opacity-100 transition-opacity text-base leading-none"
                >
                  ⓘ
                </button>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs opacity-70 block">
              {housePositive ? "賺錢率（主持人抽成）" : "主持人倒貼"}
            </span>
            <span className="text-lg font-bold">
              {housePositive ? "" : "-"}
              {Math.abs(parseFloat(housePct))}%
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs opacity-70 block">難度</span>
            <span className="font-bold">{diffLabel}</span>
          </div>
        </div>
      </div>

      {showPrizePool && cardTypes && cardTypes.length > 0 && (
        <PrizePoolModal
          cardTypes={cardTypes}
          onClose={() => setShowPrizePool(false)}
        />
      )}
    </>
  );
}
