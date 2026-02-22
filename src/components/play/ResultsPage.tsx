import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import ScratchCard from "./ScratchCard";

export default function ResultsPage() {
  const selectedCardIds = useGameStore((s) => s.selectedCardIds);
  const cards = useGameStore((s) => s.cards);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);

  const selectedCards = selectedCardIds
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  const winningCards = selectedCards.filter((c) => c.totalWinnings > 0);
  const totalWinnings = selectedCards.reduce(
    (sum, c) => sum + c.totalWinnings,
    0,
  );

  return (
    <div data-testid="results-page" className="min-h-screen bg-gradient-to-br from-red-800 to-red-950 text-white py-8 px-4">
      {/* 結果匯總標題 */}
      <section
        data-testid="results-summary"
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-black text-yellow-400 drop-shadow-lg mb-2">
          🎊 刮刮結果
        </h2>
        <p className="text-red-200 text-sm mb-1">
          中獎 {winningCards.length} / {selectedCards.length} 張
        </p>
        <div
          data-testid="total-winnings"
          className={[
            "inline-block px-6 py-2 rounded-xl font-black text-lg mt-2",
            totalWinnings > 0
              ? "bg-yellow-400 text-red-900"
              : "bg-red-900/60 text-red-300 border border-red-600",
          ].join(" ")}
        >
          {totalWinnings > 0
            ? `💰 總計中獎 $${totalWinnings} 元`
            : "謝謝參與，下次好運！"}
        </div>
      </section>

      {/* 卡片摘要格 */}
      <div className="flex flex-wrap justify-center gap-3 mb-8 max-w-2xl mx-auto">
        {selectedCards.map((card) => (
          <button
            key={card.id}
            data-testid={`result-card-${card.id}`}
            onClick={() => setDetailCardId(card.id)}
            className={[
              "px-4 py-3 rounded-xl text-sm font-bold border-2 transition-transform hover:scale-105 cursor-pointer",
              card.totalWinnings > 0
                ? "bg-yellow-400/20 border-yellow-400 text-yellow-300"
                : "bg-red-900/40 border-red-700 text-red-300",
            ].join(" ")}
          >
            <div className="text-xs opacity-70 mb-0.5">{card.id.slice(0, 8)}</div>
            {card.totalWinnings > 0
              ? `🎉 $${card.totalWinnings} 元`
              : "謝謝參與"}
          </button>
        ))}
      </div>

      {/* 截圖按鈕（placeholder） */}
      <div className="text-center">
        <button
          disabled
          className="px-6 py-2 rounded-xl bg-red-700/50 text-red-400 font-bold text-sm cursor-not-allowed border border-red-600/50"
        >
          📷 截圖分享（即將推出）
        </button>
      </div>

      {/* 卡片詳細 Modal */}
      {detailCardId !== null && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setDetailCardId(null)}
        >
          <div
            data-testid="card-detail-modal"
            className="relative max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="關閉"
              onClick={() => setDetailCardId(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-red-700 hover:bg-red-600 rounded-full text-white font-black text-sm flex items-center justify-center shadow-lg"
            >
              ✕
            </button>
            <ScratchCard cardId={detailCardId} />
          </div>
        </div>
      )}
    </div>
  );
}
