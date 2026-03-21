import { useRef, useEffect, useCallback } from "react";
import { useScratch } from "@/hooks/useScratch";
import { useParticles } from "@/hooks/useParticles";
import { useGameStore } from "@/stores/gameStore";
import { getSymbolByCode } from "@/utils/symbol-pool";
import type { ScratchCell } from "@/types";

function formatAmountAbbr(amount: number): string {
  if (amount <= 0) return "---";
  if (amount >= 1000000) {
    const n = Math.round(amount / 1000000);
    const s = String(n);
    return s + "MILLI".slice(0, 6 - s.length);
  }
  if (amount >= 1000) {
    const n = Math.round(amount / 1000);
    const s = String(n);
    return s + "THOUS".slice(0, 6 - s.length);
  }
  if (amount >= 100) {
    const n = Math.round(amount / 100);
    const s = String(n);
    return s + "HUNDR".slice(0, 6 - s.length);
  }
  return String(amount);
}

interface Props {
  cell: ScratchCell;
  cardId: string;
  maxPrize: number;
  alwaysShowAmount?: boolean;
  width?: number;
  height?: number;
}

function CellContent({ isNumberCell, cell }: { isNumberCell: boolean; cell: ScratchCell }) {
  // compare 玩法：數字格（保持不變）
  if (isNumberCell) {
    return (
      <span className="font-semibold leading-none text-3xl text-black">
        {cell.compareValue}
      </span>
    );
  }

  const symbol = cell.prize.symbolCode ? getSymbolByCode(cell.prize.symbolCode) : undefined;
  const abbr = symbol?.abbr ?? "";
  const amount = cell.prize.amount;
  const dashDeg = (cell.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 5) + 1;

  const spriteEl = symbol?.spriteFile ? (
    <img
      src={symbol.spriteFile}
      alt={cell.isRevealed ? (symbol.spriteLabel ?? symbol.label) : ""}
      aria-hidden={!cell.isRevealed || undefined}
      width={14}
      height={14}
      className="object-contain shrink-0"
      style={{ filter: "brightness(0)" }}
    />
  ) : null;

  const spriteLgEl = symbol?.spriteFile ? (
    <img
      src={symbol.spriteFile}
      alt=""
      aria-hidden="true"
      width={20}
      height={20}
      className="object-contain shrink-0"
      style={{ filter: "brightness(0)" }}
    />
  ) : null;

  return (
    <div className="flex flex-col w-full h-full">
      {/* 幸運符號區（上，留空間給未來多符號） */}
      <div
        className="flex flex-row items-center justify-center gap-1 px-1"
        style={{ flex: "0 0 33%", minHeight: 0 }}
      >
        {spriteEl}
        <span style={{ fontSize: 8, fontFamily: "monospace", fontWeight: 500, color: "#000", letterSpacing: "0.05em" }}>
          {abbr}
        </span>
      </div>

      {/* 虛線分隔 */}
      <div
        style={{
          borderTop: "1.5px dashed rgba(0,0,0,0.28)",
          transform: `rotate(${dashDeg}deg)`,
          margin: "0 -6px",
          flexShrink: 0,
        }}
      />

      {/* 您的符號區（下，留空間給未來多符號） */}
      <div
        className="flex flex-col items-center justify-center gap-0.5 px-1"
        style={{ flex: "1 1 0", minHeight: 0 }}
      >
        {spriteLgEl}
        <span style={{ fontSize: 8, fontFamily: "monospace", fontWeight: 500, color: "#000", letterSpacing: "0.05em" }}>
          {abbr}
        </span>
        <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 600, color: "#000", lineHeight: 1.1 }}>
          ${amount.toLocaleString()}
        </span>
        <span style={{ fontSize: 8, fontFamily: "monospace", fontWeight: 400, color: "#333", letterSpacing: "0.05em" }}>
          {formatAmountAbbr(amount)}
        </span>
      </div>
    </div>
  );
}

export default function ScratchCellCanvas({
  cell,
  cardId,
  maxPrize: _maxPrize,
  alwaysShowAmount: _alwaysShowAmount,
  width = 130,
  height = 80,
}: Props) {
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

  // compare 玩法：compareValue 定義時為數字格（玩家/莊家），否則為一般獎項格
  const isNumberCell = cell.compareValue !== undefined;

  return (
    <div
      data-testid={`scratch-cell-${cell.id}`}
      className="relative rounded-lg overflow-hidden select-none"
      style={{ width, height }}
    >
      {/* 底層：獎項內容 */}
      <div
        className="absolute inset-0 rounded-lg bg-amber-50 flex"
        style={{ alignItems: "stretch" }}
      >
        <div className="flex-1">
          <CellContent isNumberCell={isNumberCell} cell={cell} />
        </div>
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
    </div>
  );
}
