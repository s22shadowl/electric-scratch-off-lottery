import { useRef, useState, useCallback } from 'react'
import type { RefObject } from 'react'
import { drawErase, drawSilverMask, calculateRevealedRatio, BRUSH_RADIUS } from '@/utils/canvas-utils'

interface UseScratchOptions {
  onProgress: (progress: number) => void
  brushRadius?: number
}

interface UseScratchReturn {
  isScratching: boolean
  handlePointerDown: (e: PointerEvent) => void
  handlePointerMove: (e: PointerEvent) => void
  handlePointerUp: () => void
  initCanvas: () => void
}

export function useScratch(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  { onProgress, brushRadius = BRUSH_RADIUS }: UseScratchOptions,
): UseScratchReturn {
  const [isScratching, setIsScratching] = useState(false)
  const scratchingRef = useRef(false) // ref 版本供事件處理器使用（避免閉包問題）

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.getContext('2d')
  }, [canvasRef])

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx) return
    drawSilverMask(ctx, canvas.width, canvas.height)
  }, [canvasRef, getCtx])

  const handlePointerDown = useCallback((e: PointerEvent) => {
    scratchingRef.current = true
    setIsScratching(true)
    // 立即繪製落點
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx) return
    const rect = canvas.getBoundingClientRect?.() ?? { left: 0, top: 0 }
    drawErase(ctx, e.clientX - rect.left, e.clientY - rect.top, brushRadius)
  }, [canvasRef, getCtx, brushRadius])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!scratchingRef.current) return
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx) return
    const target = e.currentTarget as Element | null
    const rect = target?.getBoundingClientRect?.() ?? canvas.getBoundingClientRect?.() ?? { left: 0, top: 0 }
    drawErase(ctx, e.clientX - rect.left, e.clientY - rect.top, brushRadius)
    const progress = calculateRevealedRatio(ctx, canvas.width, canvas.height)
    onProgress(Math.min(1, progress))
  }, [canvasRef, getCtx, brushRadius, onProgress])

  const handlePointerUp = useCallback(() => {
    scratchingRef.current = false
    setIsScratching(false)
  }, [])

  return { isScratching, handlePointerDown, handlePointerMove, handlePointerUp, initCanvas }
}
