import { useRef, useEffect, useCallback } from "react"
import { useScratch } from "@/hooks/useScratch"
import { useParticles } from "@/hooks/useParticles"
import { useGameStore } from "@/stores/gameStore"
import { getSymbolByCode } from "@/utils/symbol-pool"
import { getCellPerturbation } from "@/utils/canvas-utils"
import type { ScratchCell } from "@/types"

const ALIGN_H = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
} as const
const ALIGN_V = {
  top: "flex-start",
  center: "center",
  bottom: "flex-end",
} as const

interface Props {
  cell: ScratchCell
  cardId: string
  maxPrize: number
  alwaysShowAmount?: boolean
  width?: number
  height?: number
}

interface CellContentProps {
  isNumberCell: boolean
  cell: ScratchCell
  displayLabel: string
}

function CellContent({
  isNumberCell,
  cell,
  displayLabel,
}: CellContentProps) {
  // compare 玩法：數字格
  if (isNumberCell) {
    return (
      <span className="font-black leading-none text-3xl text-white">
        {displayLabel}
      </span>
    )
  }

  const symbol = cell.prize.symbolCode
    ? getSymbolByCode(cell.prize.symbolCode)
    : undefined

  // symbol 玩法：有 sprite 圖
  if (symbol?.spriteFile) {
    return (
      <>
        <img
          src={symbol.spriteFile}
          // 未揭曉時隱藏，避免 screen reader 在刮開前洩漏獎項內容
          alt={cell.isRevealed ? (symbol.spriteLabel ?? symbol.label) : ""}
          aria-hidden={!cell.isRevealed || undefined}
          width={48}
          height={48}
          className="object-contain"
        />
        {cell.isRevealed && cell.prize.amount > 0 && (
          <span className="text-[10px] text-red-800 font-bold mt-0.5">
            {cell.prize.label}
          </span>
        )}
      </>
    )
  }

  // fallback：無 sprite，顯示文字
  return (
    <span className="font-black leading-none text-2xl text-red-800">
      {displayLabel}
    </span>
  )
}

export default function ScratchCellCanvas({
  cell,
  cardId,
  maxPrize: _maxPrize,
  alwaysShowAmount,
  width = 130,
  height = 80,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particleCanvasRef = useRef<HTMLCanvasElement>(null)
  const updateCellProgress = useGameStore((s) => s.updateCellProgress)
  const effectsEnabled = useGameStore((s) => s.effectsEnabled)

  const { emit } = useParticles(particleCanvasRef, effectsEnabled)

  const handleProgress = useCallback(
    (progress: number) => {
      updateCellProgress(cardId, cell.id, progress)
    },
    [cardId, cell.id, updateCellProgress],
  )

  const { handlePointerDown, handlePointerMove, handlePointerUp, initCanvas } =
    useScratch(canvasRef, { onProgress: handleProgress, onScratch: emit })

  // 元件掛載後繪製銀色遮罩
  useEffect(() => {
    if (!cell.isRevealed) initCanvas()
  }, [cell.isRevealed, initCanvas])

  // compare 玩法：compareValue 定義時為數字格（玩家/莊家），否則為一般獎項格
  const isNumberCell = cell.compareValue !== undefined
  const displayLabel = isNumberCell
    ? String(cell.compareValue)
    : cell.prize.amount > 0 || alwaysShowAmount
      ? `$${cell.prize.amount.toLocaleString()}`
      : cell.prize.label

  const p = getCellPerturbation(cell.id)
  const contentTransform = `rotate(${p.rotation}deg) skewX(${p.skewX}deg) translate(${p.offsetX}px, ${p.offsetY}px) scale(${p.scale})`

  return (
    <div
      data-testid={`scratch-cell-${cell.id}`}
      className="relative rounded-lg overflow-hidden select-none"
      style={{ width, height }}
    >
      {/* 底層：獎項內容 */}
      <div
        className={[
          "absolute inset-0 flex flex-col rounded-lg border-2 border-red-600",
          isNumberCell ? "bg-slate-600" : "bg-pink-100",
        ].join(" ")}
        style={{
          alignItems: ALIGN_H[p.alignH],
          justifyContent: ALIGN_V[p.alignV],
        }}
      >
        <div style={{ transform: contentTransform, transformOrigin: "center" }}>
          <CellContent
            isNumberCell={isNumberCell}
            cell={cell}
            displayLabel={displayLabel}
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
  )
}
