import { describe, it, expect, vi } from "vitest";
import {
  BRUSH_RADIUS,
  TOUCH_BRUSH_RADIUS,
  drawErase,
  drawSilverMask,
  calculateRevealedRatio,
} from "./canvas-utils";

// ── Mock Canvas Context 工廠 ───────────────────────────────

function makeMockCtx(alphaValues?: number[]) {
  const pixelCount = 16; // 4×4 grid for testing
  const data = new Uint8ClampedArray(pixelCount * 4);
  // 預設全不透明（alpha = 255）
  for (let i = 3; i < data.length; i += 4) data[i] = 255;
  // 若有指定，覆蓋 alpha 值
  alphaValues?.forEach((a, idx) => {
    data[idx * 4 + 3] = a;
  });

  return {
    globalCompositeOperation: "source-over" as string,
    fillStyle: "" as string | CanvasGradient | CanvasPattern,
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })) as unknown as CanvasRenderingContext2D["createLinearGradient"],
    getImageData: vi.fn(() => ({
      data,
    })) as unknown as CanvasRenderingContext2D["getImageData"],
  };
}

// ── 常數 ──────────────────────────────────────────────────

describe("constants", () => {
  it("TOUCH_BRUSH_RADIUS 應為數字且大於 BRUSH_RADIUS", () => {
    expect(typeof TOUCH_BRUSH_RADIUS).toBe("number");
    expect(TOUCH_BRUSH_RADIUS).toBeGreaterThan(BRUSH_RADIUS);
  });
});

// ── drawErase ─────────────────────────────────────────────

describe("drawErase", () => {
  it("應將 globalCompositeOperation 設為 destination-out", () => {
    const ctx = makeMockCtx();
    drawErase(ctx as unknown as CanvasRenderingContext2D, 50, 50, 24);
    expect(ctx.globalCompositeOperation).toBe("destination-out");
  });

  it("應呼叫 beginPath、arc、fill", () => {
    const ctx = makeMockCtx();
    drawErase(ctx as unknown as CanvasRenderingContext2D, 50, 50, 24);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalledWith(50, 50, 24, 0, Math.PI * 2);
    expect(ctx.fill).toHaveBeenCalled();
  });
});

// ── drawSilverMask ────────────────────────────────────────

describe("drawSilverMask", () => {
  it("應呼叫 createLinearGradient", () => {
    const ctx = makeMockCtx();
    drawSilverMask(ctx as unknown as CanvasRenderingContext2D, 200, 120);
    expect(ctx.createLinearGradient).toHaveBeenCalled();
  });

  it("應呼叫 fillRect 填滿整個 canvas", () => {
    const ctx = makeMockCtx();
    drawSilverMask(ctx as unknown as CanvasRenderingContext2D, 200, 120);
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 200, 120);
  });

  it("應將 globalCompositeOperation 重設為 source-over", () => {
    const ctx = makeMockCtx();
    drawSilverMask(ctx as unknown as CanvasRenderingContext2D, 200, 120);
    expect(ctx.globalCompositeOperation).toBe("source-over");
  });
});

// ── calculateRevealedRatio ────────────────────────────────

describe("calculateRevealedRatio", () => {
  it("全不透明時應回傳 0", () => {
    const ctx = makeMockCtx(); // 全 alpha=255
    const ratio = calculateRevealedRatio(
      ctx as unknown as CanvasRenderingContext2D,
      4,
      4,
    );
    expect(ratio).toBe(0);
  });

  it("全透明時應回傳 1", () => {
    const ctx = makeMockCtx(Array(16).fill(0)); // 全 alpha=0
    const ratio = calculateRevealedRatio(
      ctx as unknown as CanvasRenderingContext2D,
      4,
      4,
    );
    expect(ratio).toBe(1);
  });

  it("半透明時應回傳約 0.5（容差 ±0.1）", () => {
    // 16 個 pixel，前 8 個 alpha=0，後 8 個 alpha=255
    const alphas = [...Array(8).fill(0), ...Array(8).fill(255)];
    const ctx = makeMockCtx(alphas);
    const ratio = calculateRevealedRatio(
      ctx as unknown as CanvasRenderingContext2D,
      4,
      4,
    );
    expect(ratio).toBeCloseTo(0.5, 1);
  });

  it("空 canvas（width=0）應回傳 0", () => {
    const ctx = makeMockCtx();
    const ratio = calculateRevealedRatio(
      ctx as unknown as CanvasRenderingContext2D,
      0,
      0,
    );
    expect(ratio).toBe(0);
  });
});
