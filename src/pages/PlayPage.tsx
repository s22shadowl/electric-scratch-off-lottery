import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { decodeConfig } from "@/utils/config-codec";
import { useGameStore } from "@/stores/gameStore";
import CardPile from "@/components/play/CardPile";
import ScratchCard from "@/components/play/ScratchCard";
import ResultsPage from "@/components/play/ResultsPage";
import SplashOverlay from "@/components/play/SplashOverlay";
import type { GameConfig } from "@/types";

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
      {/* 頁首 */}
      <header className="text-center pt-6 pb-2">
        <h1 className="text-2xl font-black text-yellow-400 drop-shadow-lg tracking-wide">
          {config.sessionTitle}
        </h1>
      </header>

      {/* 階段視圖 */}
      {phase === "pile" && <CardPile />}
      {phase === "scratching" && (
        <section className="flex flex-wrap justify-center gap-4 sm:gap-6 py-6 px-3 sm:py-8 sm:px-4">
          {selectedCardIds.map((id) => (
            <ScratchCard key={id} cardId={id} />
          ))}
        </section>
      )}
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
