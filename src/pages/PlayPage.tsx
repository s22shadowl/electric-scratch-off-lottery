import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { decodeConfig } from "@/utils/config-codec";
import { useGameStore } from "@/stores/gameStore";
import CardPile from "@/components/play/CardPile";
import type { GameConfig } from "@/types";

export default function PlayPage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const initGame = useGameStore((s) => s.initGame);
  const phase = useGameStore((s) => s.phase);

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
        <div className="text-center py-20 text-red-300">（刮除介面開發中）</div>
      )}
    </main>
  );
}
