import { useRef, useEffect, useCallback } from "react";
import { useScratch } from "@/hooks/useScratch";
import { useGameStore } from "@/stores/gameStore";
import type { ScratchCell } from "@/types";

interface Props {
  cell: ScratchCell;
  cardId: string;
  isMatched: boolean; // bingoNumber 是否在開獎號碼集合內
  size?: number; // 格子尺寸（px），預設 60
}

export default function BingoCellCanvas({
  cell,
  cardId,
  isMatched,
  size = 60,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const updateCellProgress = useGameStore((s) => s.updateCellProgress);

  const handleProgress = useCallback(
    (progress: number) => {
      updateCellProgress(cardId, cell.id, progress);
    },
    [cardId, cell.id, updateCellProgress],
  );

  const { handlePointerDown, handlePointerMove, handlePointerUp, initCanvas } =
    useScratch(canvasRef, { onProgress: handleProgress });

  useEffect(() => {
    if (!cell.isRevealed) initCanvas();
  }, [cell.isRevealed, initCanvas]);

  const num = cell.bingoNumber ?? 0;

  return (
    <div
      data-testid={`bingo-cell-${cell.id}`}
      data-matched={String(isMatched)}
      className="relative rounded-lg overflow-hidden select-none"
      style={{ width: size, height: size }}
    >
      {/* 底層：號碼內容 */}
      <div
        className={[
          "absolute inset-0 flex items-center justify-center rounded-lg",
          isMatched
            ? "bg-gradient-to-br from-yellow-500 to-yellow-700"
            : "bg-gradient-to-br from-slate-700 to-slate-900",
        ].join(" ")}
      >
        <span
          className={[
            size >= 52 ? "text-2xl" : "text-xl",
            "font-black leading-none",
            isMatched ? "text-white" : "text-slate-300",
          ].join(" ")}
        >
          {num}
        </span>
      </div>

      {/* 頂層：Canvas 刮除遮罩 */}
      {!cell.isRevealed && (
        <canvas
          ref={canvasRef}
          aria-label={`刮除格 ${cell.id}`}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
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

      {/* 配對成功閃光 */}
      {cell.isRevealed && isMatched && (
        <div
          data-testid="bingo-match-flash"
          className="absolute inset-0 animate-ping rounded-lg bg-yellow-400/30 pointer-events-none"
          style={{ animationIterationCount: 1 }}
        />
      )}
    </div>
  );
}
