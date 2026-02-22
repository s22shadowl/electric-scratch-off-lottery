import { useRef, useEffect, useCallback } from "react";
import { useScratch } from "@/hooks/useScratch";
import { useParticles } from "@/hooks/useParticles";
import { useGameStore } from "@/stores/gameStore";
import type { ScratchCell } from "@/types";

interface Props {
  cell: ScratchCell;
  cardId: string;
  maxPrize: number;
}

function getWinLevel(amount: number, maxPrize: number): 0 | 1 | 2 | 3 {
  if (amount === 0 || maxPrize === 0) return 0;
  const ratio = amount / maxPrize;
  if (ratio > 0.5) return 3;
  if (ratio > 0.1) return 2;
  return 1;
}

export default function ScratchCellCanvas({ cell, cardId, maxPrize }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const updateCellProgress = useGameStore((s) => s.updateCellProgress);
  const effectsEnabled = useGameStore((s) => s.effectsEnabled);

  const { emit } = useParticles(particleCanvasRef, effectsEnabled);

  const handleProgress = useCallback(
    (progress: number) => {
      updateCellProgress(cardId, cell.id, progress);
    },
    [cardId, cell.id, updateCellProgress],
  );

  const { handlePointerDown, handlePointerMove, handlePointerUp, initCanvas } =
    useScratch(canvasRef, { onProgress: handleProgress, onScratch: emit });

  // 元件掛載後繪製銀色遮罩
  useEffect(() => {
    if (!cell.isRevealed) initCanvas();
  }, [cell.isRevealed, initCanvas]);

  const isWin = cell.prize.isWin;
  const winLevel =
    cell.isRevealed && isWin ? getWinLevel(cell.prize.amount, maxPrize) : 0;

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
            winLevel === 3 && cell.isRevealed ? "animate-bounce" : "",
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

      {/* 粒子特效層（始終存在供動畫播放，pointer-events-none 不攔截操作） */}
      <canvas
        ref={particleCanvasRef}
        data-testid={`particle-canvas-${cell.id}`}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* 揭曉動畫：依等級分級閃光 */}
      {cell.isRevealed && (
        <>
          {winLevel === 1 && (
            <div
              data-testid="win-flash"
              className="absolute inset-0 animate-ping rounded-lg bg-yellow-400/20 pointer-events-none"
              style={{ animationIterationCount: 1 }}
            />
          )}
          {winLevel === 2 && (
            <>
              <div
                data-testid="win-flash"
                className="absolute inset-0 animate-ping rounded-lg bg-yellow-400/40 pointer-events-none"
                style={{ animationIterationCount: 2 }}
              />
              <div
                className="absolute inset-[-3px] animate-ping rounded-lg bg-yellow-300/20 pointer-events-none"
                style={{ animationIterationCount: 1, animationDelay: "200ms" }}
              />
            </>
          )}
          {winLevel === 3 && (
            <>
              <div
                data-testid="win-flash"
                className="absolute inset-0 animate-ping rounded-lg bg-yellow-400/60 pointer-events-none"
                style={{ animationIterationCount: 3 }}
              />
              <div
                className="absolute inset-[-4px] animate-ping rounded-lg bg-yellow-300/40 pointer-events-none"
                style={{ animationIterationCount: 2, animationDelay: "150ms" }}
              />
              <div
                className="absolute inset-[-8px] animate-ping rounded-lg bg-yellow-200/20 pointer-events-none"
                style={{ animationIterationCount: 1, animationDelay: "300ms" }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
