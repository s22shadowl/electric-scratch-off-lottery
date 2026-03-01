import { useRef, useState, useCallback } from "react";
import type { RefObject } from "react";
import {
  drawErase,
  drawSilverMask,
  calculateRevealedRatio,
  BRUSH_RADIUS,
  TOUCH_BRUSH_RADIUS,
} from "@/utils/canvas-utils";

interface UseScratchOptions {
  onProgress: (progress: number) => void;
  onScratch?: (x: number, y: number) => void;
  brushRadius?: number;
  touchBrushRadius?: number;
}

interface UseScratchReturn {
  isScratching: boolean;
  handlePointerDown: (e: PointerEvent) => void;
  handlePointerMove: (e: PointerEvent) => void;
  handlePointerUp: () => void;
  initCanvas: () => void;
}

export function useScratch(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  {
    onProgress,
    onScratch,
    brushRadius = BRUSH_RADIUS,
    touchBrushRadius = TOUCH_BRUSH_RADIUS,
  }: UseScratchOptions,
): UseScratchReturn {
  const [isScratching, setIsScratching] = useState(false);
  const scratchingRef = useRef(false); // ref 版本供事件處理器使用（避免閉包問題）

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d", { willReadFrequently: true });
  }, [canvasRef]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    // DPR-aware 設定：讓高密度螢幕渲染清晰
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.offsetWidth || 110;
    const cssH = canvas.offsetHeight || 70;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.scale(dpr, dpr);
    drawSilverMask(ctx, cssW, cssH); // CSS px 尺寸（非實體像素）
  }, [canvasRef, getCtx]);

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (!canvas || !ctx) return;
      canvas.setPointerCapture(e.pointerId); // 手指移出 canvas 仍繼續刮
      scratchingRef.current = true;
      setIsScratching(true);
      const r = e.pointerType === "touch" ? touchBrushRadius : brushRadius;
      const rect = canvas.getBoundingClientRect?.() ?? { left: 0, top: 0 };
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      drawErase(ctx, x, y, r);
      onScratch?.(x, y);
    },
    [canvasRef, getCtx, brushRadius, touchBrushRadius, onScratch],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!scratchingRef.current) return;
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (!canvas || !ctx) return;
      const r = e.pointerType === "touch" ? touchBrushRadius : brushRadius;
      const target = e.currentTarget as Element | null;
      const rect = target?.getBoundingClientRect?.() ??
        canvas.getBoundingClientRect?.() ?? { left: 0, top: 0 };
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      drawErase(ctx, x, y, r);
      const progress = calculateRevealedRatio(ctx, canvas.width, canvas.height);
      onProgress(Math.min(1, progress));
      onScratch?.(x, y);
    },
    [canvasRef, getCtx, brushRadius, touchBrushRadius, onProgress, onScratch],
  );

  const handlePointerUp = useCallback(() => {
    scratchingRef.current = false;
    setIsScratching(false);
  }, []);

  return {
    isScratching,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    initCanvas,
  };
}
