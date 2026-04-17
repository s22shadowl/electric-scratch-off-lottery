import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { decodeConfig } from "@/utils/config-codec";
import { useGameStore } from "@/stores/gameStore";
import CardPile from "@/components/play/CardPile";
import ScratchCard from "@/components/play/ScratchCard";
import ResultsPage from "@/components/play/ResultsPage";
import SplashOverlay from "@/components/play/SplashOverlay";
import { cardStackOffset } from "@/utils/card-stack-offset";
import type { GameConfig } from "@/types";

function ScratchingView() {
  const selectedCardIds = useGameStore((s) => s.selectedCardIds);
  const cards = useGameStore((s) => s.cards);
  const config = useGameStore((s) => s.config);
  const currentScratchIndex = useGameStore((s) => s.currentScratchIndex);
  const nextCard = useGameStore((s) => s.nextCard);

  const currentCardId = selectedCardIds[currentScratchIndex];
  const currentCard = cards.find((c) => c.id === currentCardId);
  const isCurrentCompleted = currentCard?.status === "completed";

  const totalInvested = selectedCardIds.reduce((sum, id) => {
    const card = cards.find((c) => c.id === id);
    const ct = card ? config.cardTypes[card.cardTypeIndex] : undefined;
    return sum + (ct?.ticketPrice ?? 0);
  }, 0);
  const completedCards = selectedCardIds
    .slice(0, currentScratchIndex + (isCurrentCompleted ? 1 : 0))
    .map((id) => cards.find((c) => c.id === id));
  const totalWon = completedCards.reduce(
    (s, c) => s + (c?.totalWinnings ?? 0),
    0,
  );

  if (!currentCardId) return null;

  const doneIds = selectedCardIds.slice(0, currentScratchIndex);
  const upcomingIds = selectedCardIds.slice(currentScratchIndex + 1);

  return (
    <section className="flex flex-col items-center min-h-[calc(100vh-2rem)] py-3 px-2">
      {/* 進度列（多張才顯示） */}
      {selectedCardIds.length > 1 && (
        <div
          data-testid="scratch-progress"
          className="text-center mb-2 text-sm text-yellow-200"
        >
          <span>第 {currentScratchIndex + 1}/{selectedCardIds.length} 張</span>
          <span> · 投入 ${totalInvested}</span>
          <span> · 累計中獎 ${totalWon}</span>
        </div>
      )}

      {/* 卡堆區 */}
      <div className="relative flex items-center justify-center flex-1 w-full">
        {/* 左側已刮完堆疊 */}
        {doneIds.map((id, i) => {
          const offset = cardStackOffset(id);
          return (
            <div
              key={id}
              data-testid={`done-card-${id}`}
              className="absolute left-0 w-[44px] h-[70%] rounded-lg border-2 border-yellow-600/50"
              style={{
                zIndex: i,
                marginLeft: i * 4,
                transform: `translateY(${offset.offsetY}px) rotate(${offset.rotation}deg)`,
                background:
                  "repeating-linear-gradient(45deg, #7f1d1d, #7f1d1d 4px, #991b1b 4px, #991b1b 8px)",
              }}
            >
              <div className="absolute inset-0 rounded-lg bg-black/25" />
            </div>
          );
        })}

        {/* 當前卡片 */}
        <div className="relative z-10">
          <ScratchCard cardId={currentCardId} />
        </div>

        {/* 右側未刮堆疊 */}
        {upcomingIds.map((id, i) => {
          const offset = cardStackOffset(id);
          const isNext = i === 0 && isCurrentCompleted;
          return (
            <div
              key={id}
              data-testid={`upcoming-card-${id}`}
              className={[
                "absolute right-0 w-[44px] h-[70%] rounded-lg border-2",
                isNext
                  ? "border-yellow-400/80 cursor-pointer"
                  : "border-yellow-600/50",
              ].join(" ")}
              style={{
                zIndex: upcomingIds.length - i,
                marginRight: i * 4,
                transform: `translateY(${offset.offsetY}px) rotate(${offset.rotation}deg)`,
                background:
                  "repeating-linear-gradient(45deg, #7f1d1d, #7f1d1d 4px, #991b1b 4px, #991b1b 8px)",
                ...(isNext
                  ? {
                      boxShadow:
                        "0 0 14px 3px rgba(250,204,21,0.5), 0 0 6px 2px rgba(250,204,21,0.3)",
                    }
                  : {}),
              }}
              onClick={isNext ? nextCard : undefined}
              {...(isNext
                ? { role: "button", "aria-label": "下一張卡片" }
                : { "aria-hidden": true })}
            >
              {!isNext && (
                <div className="absolute inset-0 rounded-lg bg-black/25" />
              )}
            </div>
          );
        })}
      </div>

      {/* 底部操作區 */}
      <div className="text-center mt-2 pb-4">
        {isCurrentCompleted && selectedCardIds.length > 1 && (
          <button
            data-testid="next-card-btn"
            onClick={nextCard}
            className="px-6 py-2 rounded-xl bg-yellow-400 text-red-900 font-bold text-sm hover:bg-yellow-300 transition-colors"
          >
            {currentScratchIndex < selectedCardIds.length - 1
              ? "下一張 →"
              : "查看結果 →"}
          </button>
        )}
      </div>
    </section>
  );
}

export default function PlayPage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const splashDismissedRef = useRef(false);

  const initGame = useGameStore((s) => s.initGame);
  const phase = useGameStore((s) => s.phase);
  const selectedCardIds = useGameStore((s) => s.selectedCardIds);
  const cards = useGameStore((s) => s.cards);
  const effectsEnabled = useGameStore((s) => s.effectsEnabled);

  const selectedCards = selectedCardIds
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);
  const totalWinnings = selectedCards.reduce((s, c) => s + c.totalWinnings, 0);
  const winningCount = selectedCards.filter((c) => c.totalWinnings > 0).length;

  useEffect(() => {
    const encoded = searchParams.get("config");
    if (!encoded) {
      setError("缺少遊戲設定，請透過主持人提供的連結進入。");
      return;
    }
    try {
      const decoded = decodeConfig(encoded);
      setConfig(decoded);
      initGame(decoded);
    } catch (e) {
      setError(`設定解析失敗：${e instanceof Error ? e.message : "未知錯誤"}`);
    }
  }, [searchParams, initGame]);

  useEffect(() => {
    if (phase === "results" && !splashDismissedRef.current) {
      setShowSplash(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
        splashDismissedRef.current = true;
      }, 1500);
      return () => clearTimeout(timer);
    }
    if (phase !== "results") {
      splashDismissedRef.current = false;
    }
  }, [phase]);

  const handleDismiss = () => {
    setShowSplash(false);
    splashDismissedRef.current = true;
  };

  if (error) {
    return (
      <main data-testid="play-page-error">
        <p role="alert">{error}</p>
      </main>
    );
  }

  if (!config) return null;

  return (
    <main
      data-testid="play-page"
      className="min-h-screen bg-gradient-to-br from-red-800 to-red-950 text-white"
    >
      {/* 頁首（scratching 時隱藏，讓卡片佔滿空間） */}
      {phase !== "scratching" && (
        <header className="text-center pt-6 pb-2">
          <h1 className="text-2xl font-black text-yellow-400 drop-shadow-lg tracking-wide font-serif">
            {config.sessionTitle}
          </h1>
        </header>
      )}

      {/* 階段視圖 */}
      {phase === "pile" && <CardPile />}
      {phase === "scratching" && <ScratchingView />}
      {phase === "results" && showSplash && (
        <SplashOverlay
          totalWinnings={totalWinnings}
          winningCount={winningCount}
          totalCount={selectedCards.length}
          effectsEnabled={effectsEnabled}
          onDismiss={handleDismiss}
        />
      )}
      {phase === "results" && !showSplash && <ResultsPage />}
    </main>
  );
}
