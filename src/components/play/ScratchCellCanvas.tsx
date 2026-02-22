import { useRef, useEffect, useCallback } from "react";
import { useScratch } from "@/hooks/useScratch";
import { useGameStore } from "@/stores/gameStore";
import type { ScratchCell } from "@/types";

interface Props {
  cell: ScratchCell;
  cardId: string;
}

export default function ScratchCellCanvas({ cell, cardId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const updateCellProgress = useGameStore((s) => s.updateCellProgress);
  const effectsEnabled = useGameStore((s) => s.effectsEnabled);

  const handleProgress = useCallback(
    (progress: number) => {
      updateCellProgress(cardId, cell.id, progress);
    },
    [cardId, cell.id, updateCellProgress],
  );

  const { handlePointerDown, handlePointerMove, handlePointerUp, initCanvas } =
    useScratch(canvasRef, { onProgress: handleProgress });

  // 元件掛載後繪製銀色遮罩
  useEffect(() => {
    if (!cell.isRevealed) initCanvas();
  }, [cell.isRevealed, initCanvas]);

  const isWin = cell.prize.isWin;

  return (
    <div
      data-testid={`scratch-cell-${cell.id}`}
      className="relative w-[130px] h-[80px] rounded-lg overflow-hidden select-none"
    >
      {/* 底層：獎項內容 */}
      <div
        className={[
          "absolute inset-0 flex flex-col items-center justify-center rounded-lg",
          isWin
            ? "bg-gradient-to-br from-yellow-700 to-yellow-900"
            : "bg-gradient-to-br from-red-900 to-red-950",
        ].join(" ")}
      >
        <span
          className={[
            "text-lg font-black leading-none",
            isWin ? "text-yellow-300" : "text-red-400",
          ].join(" ")}
        >
          {cell.prize.label}
        </span>
        {cell.prize.symbolCode && (
          <span className="text-[9px] text-red-500 tracking-widest mt-0.5">
            {cell.prize.symbolCode}
          </span>
        )}
      </div>

      {/* 頂層：Canvas 刮除遮罩（揭曉後以 CSS 淡出） */}
      {!cell.isRevealed && (
        <canvas
          ref={canvasRef}
          aria-label={`刮除格 ${cell.id}`}
          className={[
            "absolute inset-0 w-full h-full touch-none transition-opacity duration-500",
            effectsEnabled
              ? "cursor-[url(/brush.png),crosshair]"
              : "cursor-crosshair",
          ].join(" ")}
          onPointerDown={
            handlePointerDown as unknown as React.PointerEventHandler
          }
          onPointerMove={
            handlePointerMove as unknown as React.PointerEventHandler
          }
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      )}

      {/* 揭曉動畫：中獎閃光 */}
      {cell.isRevealed && isWin && (
        <div
          data-testid="win-flash"
          className="absolute inset-0 animate-ping rounded-lg bg-yellow-400/20 pointer-events-none"
          style={{ animationIterationCount: 1 }}
        />
      )}
    </div>
  );
}
