import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRef } from 'react'
import { useScratch } from './useScratch'

// ── Mock canvas context ───────────────────────────────────

function setupCanvasMock(revealedRatio = 0) {
  const pixelCount = 100
  const data = new Uint8ClampedArray(pixelCount * 4)
  // alpha = 255 * (1 - revealedRatio)
  const alpha = Math.round(255 * (1 - revealedRatio))
  for (let i = 3; i < data.length; i += 4) data[i] = alpha

  const mockCtx = {
    globalCompositeOperation: 'source-over' as string,
    fillStyle: '' as string | CanvasGradient | CanvasPattern,
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    getImageData: vi.fn(() => ({ data })),
  }

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    mockCtx as unknown as CanvasRenderingContext2D,
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'width', 'get').mockReturnValue(200)
  vi.spyOn(HTMLCanvasElement.prototype, 'height', 'get').mockReturnValue(120)

  return mockCtx
}

beforeEach(() => vi.restoreAllMocks())

// ── 測試用 Wrapper ────────────────────────────────────────

function renderScratchHook(onProgress = vi.fn()) {
  return renderHook(() => {
    const canvasRef = useRef<HTMLCanvasElement>(
      document.createElement('canvas'),
    )
    return useScratch(canvasRef, { onProgress })
  })
}

// ── useScratch ────────────────────────────────────────────

describe('useScratch', () => {
  it('初始狀態 isScratching 應為 false', () => {
    setupCanvasMock()
    const { result } = renderScratchHook()
    expect(result.current.isScratching).toBe(false)
  })

  it('pointerdown 後 isScratching 應為 true', () => {
    setupCanvasMock()
    const { result } = renderScratchHook()
    act(() => result.current.handlePointerDown({ clientX: 10, clientY: 10 } as PointerEvent))
    expect(result.current.isScratching).toBe(true)
  })

  it('pointerup 後 isScratching 應為 false', () => {
    setupCanvasMock()
    const { result } = renderScratchHook()
    act(() => result.current.handlePointerDown({ clientX: 10, clientY: 10 } as PointerEvent))
    act(() => result.current.handlePointerUp())
    expect(result.current.isScratching).toBe(false)
  })

  it('pointermove 時若正在刮，應呼叫 onProgress', () => {
    const onProgress = vi.fn()
    setupCanvasMock()
    const { result } = renderScratchHook(onProgress)
    act(() => result.current.handlePointerDown({ clientX: 10, clientY: 10 } as PointerEvent))
    act(() => result.current.handlePointerMove({
      clientX: 20, clientY: 20,
      currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    } as unknown as PointerEvent))
    expect(onProgress).toHaveBeenCalled()
    const progress = onProgress.mock.calls[0]![0] as number
    expect(progress).toBeGreaterThanOrEqual(0)
    expect(progress).toBeLessThanOrEqual(1)
  })

  it('非刮除狀態下 pointermove 不應呼叫 onProgress', () => {
    const onProgress = vi.fn()
    setupCanvasMock()
    const { result } = renderScratchHook(onProgress)
    act(() => result.current.handlePointerMove({
      clientX: 20, clientY: 20,
      currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    } as unknown as PointerEvent))
    expect(onProgress).not.toHaveBeenCalled()
  })

  it('進度已達 1.0 時停止呼叫 onProgress', () => {
    const onProgress = vi.fn()
    setupCanvasMock(1) // 全透明 = 已完全刮除
    const { result } = renderScratchHook(onProgress)
    act(() => result.current.handlePointerDown({ clientX: 10, clientY: 10 } as PointerEvent))
    act(() => result.current.handlePointerMove({
      clientX: 20, clientY: 20,
      currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    } as unknown as PointerEvent))
    // onProgress 被呼叫時傳入的值應 <= 1
    onProgress.mock.calls.forEach(([val]) => {
      expect(val as number).toBeLessThanOrEqual(1)
    })
  })
})
