import { useState } from "react";
import { calcBingoLineProbabilities } from "@/utils/game-math";
import type { CardTypeConfig, BingoOptions } from "@/types";

interface PrizePoolModalProps {
  cardTypes: CardTypeConfig[];
  initialIndex?: number;
  onClose: () => void;
}

const MECHANIC_LABELS: Record<string, string> = {
  symbol: "符號",
  triple: "三同",
  compare: "比大小",
  bingo: "賓果",
};

function PrizeTable({ cardType }: { cardType: CardTypeConfig }) {
  const { prizes } = cardType;
  const totalWeight = prizes.reduce((sum, p) => sum + p.probability, 0);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-red-700">
          <th className="text-left py-2 text-yellow-300 font-bold">獎項名稱</th>
          <th className="text-right py-2 text-yellow-300 font-bold">金額</th>
          <th className="text-right py-2 text-yellow-300 font-bold">機率</th>
        </tr>
      </thead>
      <tbody>
        {prizes.map((prize) => {
          const pct =
            totalWeight > 0
              ? ((prize.probability / totalWeight) * 100).toFixed(1)
              : "0.0";
          return (
            <tr key={prize.id} className="border-b border-red-800">
              <td className="py-2 text-white">{prize.label}</td>
              <td className="py-2 text-right text-white">
                {prize.amount > 0 ? `$${prize.amount}` : "—"}
              </td>
              <td className="py-2 text-right text-red-200">{pct}%</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function BingoStats({ cardType }: { cardType: CardTypeConfig }) {
  const opts = cardType.mechanicOptions as BingoOptions;
  const { gridSize, drawnCount, prizePerLine } = opts;
  const ticketPrice = cardType.ticketPrice ?? 100;

  const probs = calcBingoLineProbabilities(gridSize, drawnCount);
  const expectedLines = Object.entries(probs).reduce(
    (sum, [k, p]) => sum + Number(k) * p,
    0,
  );
  const expectedRTP =
    ((prizePerLine * expectedLines) / ticketPrice) * 100;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between border-b border-red-800 py-2">
        <span className="text-yellow-300 font-bold">格子大小</span>
        <span className="text-white">
          {gridSize} × {gridSize}
        </span>
      </div>
      <div className="flex justify-between border-b border-red-800 py-2">
        <span className="text-yellow-300 font-bold">開獎號碼顆數</span>
        <span className="text-white">{drawnCount} 顆</span>
      </div>
      <div className="flex justify-between border-b border-red-800 py-2">
        <span className="text-yellow-300 font-bold">每條連線獎金</span>
        <span className="text-white">${prizePerLine}</span>
      </div>
      <div className="flex justify-between border-b border-red-800 py-2">
        <span className="text-yellow-300 font-bold">預期連線數</span>
        <span className="text-white">{expectedLines.toFixed(2)} 條</span>
      </div>
      <div className="flex justify-between py-2">
        <span className="text-yellow-300 font-bold">預期報酬率</span>
        <span className="text-white">{expectedRTP.toFixed(1)}%</span>
      </div>
    </div>
  );
}

export default function PrizePoolModal({
  cardTypes,
  initialIndex = 0,
  onClose,
}: PrizePoolModalProps) {
  const [activeIndex, setActiveIndex] = useState(
    Math.min(initialIndex, cardTypes.length - 1),
  );

  const activeCardType = cardTypes[activeIndex];
  if (!activeCardType) return null;

  const showTabs = cardTypes.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="獎池資訊"
    >
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 面板 */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-red-950 border border-red-700 shadow-2xl">
        {/* 標題列 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-red-700">
          <h2 className="text-lg font-bold text-yellow-300">獎池資訊</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="text-red-300 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tab bar（多卡型才顯示） */}
        {showTabs && (
          <div className="flex border-b border-red-700">
            {cardTypes.map((ct, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`flex-1 py-2 text-sm font-bold transition-colors ${
                  activeIndex === i
                    ? "text-yellow-300 border-b-2 border-yellow-400"
                    : "text-red-300 hover:text-white"
                }`}
              >
                {MECHANIC_LABELS[ct.mechanic] ?? ct.mechanic}
              </button>
            ))}
          </div>
        )}

        {/* 內容區 */}
        <div className="px-5 py-4">
          {activeCardType.mechanic === "bingo" ? (
            <BingoStats cardType={activeCardType} />
          ) : (
            <PrizeTable cardType={activeCardType} />
          )}
        </div>
      </div>
    </div>
  );
}
