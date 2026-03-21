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

// 安全底紋 SVG — 波浪紋路兩組（紅/粉）+ e-lottery 文字
const CELL_BG_WAVE_A = btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="10">' +
    '<path d="M0 5 Q5 1 10 5 Q15 9 20 5 Q25 1 30 5 Q35 9 40 5" fill="none" stroke="rgba(160,20,50,0.28)" stroke-width="1.5"/>' +
    "</svg>",
);
const CELL_BG_WAVE_B = btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="10">' +
    '<path d="M0 5 Q5 9 10 5 Q15 1 20 5 Q25 9 30 5 Q35 1 40 5" fill="none" stroke="rgba(240,140,160,0.18)" stroke-width="1.5"/>' +
    "</svg>",
);
const CELL_BG_TEXT = btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32">' +
    '<text x="2" y="22" font-size="7" fill="rgba(180,60,80,0.5)" font-family="monospace" transform="rotate(-20 32 16)">e-lottery</text>' +
    "</svg>",
);
const CELL_BG_STYLE: React.CSSProperties = {
  backgroundColor: "#fdf0f4",
  backgroundImage: [
    `url("data:image/svg+xml;base64,${CELL_BG_TEXT}")`,
    `url("data:image/svg+xml;base64,${CELL_BG_WAVE_A}")`,
    `url("data:image/svg+xml;base64,${CELL_BG_WAVE_B}")`,
  ].join(", "),
  backgroundSize: "64px 32px, 40px 10px, 40px 10px",
  backgroundPosition: "0 0, 0 0, 20px 5px",
};

interface Props {
  cell: ScratchCell;
  cardId: string;
  maxPrize: number;
  alwaysShowAmount?: boolean;
  width?: number;
  height?: number;
  contentInset?: { top: string; right: string; bottom: string; left: string };
}

function CellContent({
  isNumberCell,
  cell,
  contentInset,
}: {
  isNumberCell: boolean;
  cell: ScratchCell;
  contentInset?: { top: string; right: string; bottom: string; left: string };
}) {
  // compare 玩法：數字格（保持不變）
  if (isNumberCell) {
    return (
      <span className="font-semibold leading-none text-3xl text-black">
        {cell.compareValue}
      </span>
    );
  }

  const symbol = cell.prize.symbolCode
    ? getSymbolByCode(cell.prize.symbolCode)
    : undefined;
  const abbr = symbol?.abbr ?? "";
  const amount = cell.prize.amount;
  const dashDeg =
    (cell.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 5) + 1;

  return (
    <div className="flex flex-row w-full h-full">
      {/* 幸運符號區（左 38%） */}
      <div
        className="flex flex-col items-center justify-center gap-0.5"
        style={{
          flex: "0 0 38%",
          minWidth: 0,
          paddingTop: contentInset?.top,
          paddingBottom: contentInset?.bottom,
          paddingLeft: contentInset?.left,
        }}
      >
        {symbol?.spriteFile && (
          <img
            src={symbol.spriteFile}
            alt={cell.isRevealed ? (symbol.spriteLabel ?? symbol.label) : ""}
            aria-hidden={!cell.isRevealed || undefined}
            width={38}
            height={38}
            className="object-contain shrink-0"
            style={{ filter: "brightness(0)" }}
          />
        )}
        <span
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            fontWeight: 500,
            color: "#000",
            letterSpacing: "0.04em",
            lineHeight: 1,
            fontStyle: "italic",
            transform: "scaleX(0.78)",
            display: "inline-block",
            marginTop: -2,
          }}
        >
          {abbr}
        </span>
      </div>

      {/* 垂直虛線 */}
      <div
        style={{
          borderLeft: "1.5px dashed rgba(0,0,0,0.28)",
          transform: `rotate(${dashDeg}deg)`,
          margin: "-4px 0",
          flexShrink: 0,
          alignSelf: "stretch",
        }}
      />

      {/* 您的符號區（右 62%） */}
      <div
        className="flex flex-col items-center justify-center"
        style={{
          flex: "1 1 0",
          minWidth: 0,
          gap: 1,
          paddingTop: contentInset?.top,
          paddingBottom: contentInset?.bottom,
          paddingRight: contentInset?.right,
        }}
      >
        {symbol?.spriteFile && (
          <img
            src={symbol.spriteFile}
            alt=""
            aria-hidden="true"
            width={41}
            height={41}
            className="object-contain shrink-0"
            style={{ filter: "brightness(0)" }}
          />
        )}
        <span
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            fontWeight: 500,
            color: "#000",
            letterSpacing: "0.04em",
            lineHeight: 1,
            fontStyle: "italic",
            transform: "scaleX(0.78)",
            display: "inline-block",
            marginTop: -2,
          }}
        >
          {abbr}
        </span>
        <span
          style={{
            fontSize: 18,
            fontFamily: "monospace",
            fontWeight: 600,
            color: "#000",
            lineHeight: 1.1,
            fontStyle: "italic",
            transform: "scaleX(0.78)",
            display: "inline-block",
          }}
        >
          ${amount.toLocaleString()}
        </span>
        <span
          style={{
            fontSize: 10,
            fontFamily: "monospace",
            fontWeight: 400,
            color: "#444",
            letterSpacing: "0.04em",
            lineHeight: 1,
          }}
        >
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
  contentInset,
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
        className="absolute inset-0 rounded-lg flex"
        style={{
          ...CELL_BG_STYLE,
          alignItems: "stretch",
        }}
      >
        <div className="flex-1 min-w-0 min-h-0">
          <CellContent
            isNumberCell={isNumberCell}
            cell={cell}
            contentInset={contentInset}
          />
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
