import { useState, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useToastStore } from "@/stores/toastStore";
import { captureAndShare } from "@/utils/screenshot";
import ScratchCard from "./ScratchCard";

export default function ResultsPage() {
  const selectedCardIds = useGameStore((s) => s.selectedCardIds);
  const cards = useGameStore((s) => s.cards);
  const config = useGameStore((s) => s.config);
  const returnToPile = useGameStore((s) => s.returnToPile);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const [summaryCapturing, setSummaryCapturing] = useState(false);
  const [cardCapturing, setCardCapturing] = useState(false);

  const summaryRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToastStore();

  const selectedCards = selectedCardIds
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  const winningCards = selectedCards.filter((c) => c.totalWinnings > 0);
  const totalWinnings = selectedCards.reduce(
    (sum, c) => sum + c.totalWinnings,
    0,
  );

  const handleCaptureSummary = async () => {
    if (!summaryRef.current || summaryCapturing) return;
    setSummaryCapturing(true);
    try {
      await captureAndShare(summaryRef.current, "scratch-results.png");
    } catch (err) {
      console.error("[截圖 summary 失敗]", err);
      showToast("截圖失敗，請再試一次", "error");
    } finally {
      setSummaryCapturing(false);
    }
  };

  const handleCaptureCard = async () => {
    if (!cardRef.current || cardCapturing) return;
    setCardCapturing(true);
    try {
      await captureAndShare(
        cardRef.current,
        `scratch-card-${detailCardId}.png`,
      );
    } catch (err) {
      console.error("[截圖 card 失敗]", err);
      showToast("截圖失敗，請再試一次", "error");
    } finally {
      setCardCapturing(false);
    }
  };

  return (
    <div
      data-testid="results-page"
      className="min-h-screen bg-gradient-to-br from-red-800 to-red-950 text-white py-8 px-4"
    >
      {/* 截圖範圍：結果匯總 + 卡片摘要格 */}
      <div ref={summaryRef} className="pb-4">
        {/* 結果匯總標題 */}
        <section data-testid="results-summary" className="text-center mb-8">
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
          {selectedCards.map((card, index) => (
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
              style={{
                animation: "fade-in-up 300ms ease-out forwards",
                animationDelay: `${index * 80}ms`,
              }}
            >
              <div className="text-xs font-mono opacity-70 mb-0.5">
                {card.serialNumber}
              </div>
              {card.totalWinnings > 0
                ? `🎉 $${card.totalWinnings} 元`
                : "謝謝參與"}
            </button>
          ))}
        </div>
      </div>

      {/* 截圖結果按鈕 */}
      <div className="text-center mb-8 flex flex-col items-center gap-3">
        <button
          data-testid="capture-summary-btn"
          onClick={handleCaptureSummary}
          disabled={summaryCapturing}
          className={[
            "px-6 py-2 rounded-xl font-bold text-sm border transition-all",
            summaryCapturing
              ? "bg-red-700/50 text-red-400 border-red-600/50 cursor-wait"
              : "bg-yellow-400/10 text-yellow-300 border-yellow-500/50 hover:bg-yellow-400/20 cursor-pointer",
          ].join(" ")}
        >
          {summaryCapturing ? "截圖中…" : "📷 截圖結果"}
        </button>
        {config.allowReturnToPile && (
          <button
            data-testid="return-to-pile-btn"
            onClick={returnToPile}
            className="px-6 py-2 rounded-xl font-bold text-sm border transition-all bg-transparent text-red-300 border-red-600/50 hover:bg-red-900/30 cursor-pointer"
          >
            ↩ 返回牌堆
          </button>
        )}
      </div>

      {/* 卡片詳細 Modal */}
      {detailCardId !== null && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setDetailCardId(null)}
        >
          <div
            data-testid="card-detail-modal"
            className="relative max-w-sm w-full flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 關閉按鈕 */}
            <button
              aria-label="關閉"
              onClick={() => setDetailCardId(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-red-700 hover:bg-red-600 rounded-full text-white font-black text-sm flex items-center justify-center shadow-lg"
            >
              ✕
            </button>

            {/* 截圖範圍：單張卡片 */}
            <div ref={cardRef}>
              <ScratchCard cardId={detailCardId} />
            </div>

            {/* 截圖此張按鈕 */}
            <button
              data-testid="capture-card-btn"
              onClick={handleCaptureCard}
              disabled={cardCapturing}
              className={[
                "px-5 py-2 rounded-xl font-bold text-sm border transition-all",
                cardCapturing
                  ? "bg-red-700/50 text-red-400 border-red-600/50 cursor-wait"
                  : "bg-yellow-400/10 text-yellow-300 border-yellow-500/50 hover:bg-yellow-400/20 cursor-pointer",
              ].join(" ")}
            >
              {cardCapturing ? "截圖中…" : "📷 截圖此張"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
