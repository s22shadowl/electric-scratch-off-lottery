import { describe, it, expect, vi } from "vitest";
import {
  BRUSH_RADIUS,
  TOUCH_BRUSH_RADIUS,
  drawErase,
  drawSilverMask,
  drawAntiCounterfeitPattern,
  calculateRevealedRatio,
  seededRand,
  getCellPerturbation,
} from "./canvas-utils";

// ── Mock Canvas Context 工廠 ───────────────────────────────

function makeMockCtxFull() {
  return {
    globalCompositeOperation: "source-over" as string,
    globalAlpha: 1,
    strokeStyle: "" as string,
    lineWidth: 1,
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: "" as string | CanvasGradient | CanvasPattern,
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })) as unknown as CanvasRenderingContext2D["createLinearGradient"],
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(16 * 4),
    })) as unknown as CanvasRenderingContext2D["getImageData"],
    putImageData: vi.fn(),
  };
}

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
    putImageData: vi.fn(),
  };
}

// ── seededRand ────────────────────────────────────────────

describe("seededRand", () => {
  it("相同 seed 應產生相同序列", () => {
    const r1 = seededRand("cell-abc");
    const r2 = seededRand("cell-abc");
    expect(r1()).toBeCloseTo(r2(), 10);
    expect(r1()).toBeCloseTo(r2(), 10);
  });

  it("不同 seed 應產生不同值", () => {
    const v1 = seededRand("cell-1")();
    const v2 = seededRand("cell-2")();
    expect(v1).not.toBe(v2);
  });

  it("產生值應在 0–1 範圍", () => {
    const rand = seededRand("test");
    for (let i = 0; i < 20; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

// ── getCellPerturbation ───────────────────────────────────

describe("getCellPerturbation", () => {
  it("相同 cellId 應回傳相同結果", () => {
    const p1 = getCellPerturbation("cell-xyz");
    const p2 = getCellPerturbation("cell-xyz");
    expect(p1).toEqual(p2);
  });

  it("rotation 應在 ±4° 範圍", () => {
    for (const id of ["a", "b", "c", "d", "e"]) {
      const { rotation } = getCellPerturbation(id);
      expect(rotation).toBeGreaterThanOrEqual(-4);
      expect(rotation).toBeLessThanOrEqual(4);
    }
  });

  it("scale 應在 0.70–1.00 範圍", () => {
    for (const id of ["a", "b", "c", "d", "e"]) {
      const { scale } = getCellPerturbation(id);
      expect(scale).toBeGreaterThanOrEqual(0.7);
      expect(scale).toBeLessThanOrEqual(1.0);
    }
  });

  it("alignH 應為 left/center/right 之一", () => {
    for (const id of ["a", "b", "c", "d", "e"]) {
      expect(["left", "center", "right"]).toContain(
        getCellPerturbation(id).alignH,
      );
    }
  });
});

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

// ── drawAntiCounterfeitPattern ────────────────────────────

describe("drawAntiCounterfeitPattern", () => {
  it("應呼叫 save 和 restore（狀態包裹）", () => {
    const ctx = makeMockCtxFull();
    drawAntiCounterfeitPattern(
      ctx as unknown as CanvasRenderingContext2D,
      200,
      120,
    );
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it("應呼叫 stroke 繪製波浪線", () => {
    const ctx = makeMockCtxFull();
    drawAntiCounterfeitPattern(
      ctx as unknown as CanvasRenderingContext2D,
      200,
      120,
    );
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("strokeStyle 應為粉紫色 #B06EC8", () => {
    const ctx = makeMockCtxFull();
    drawAntiCounterfeitPattern(
      ctx as unknown as CanvasRenderingContext2D,
      200,
      120,
    );
    expect(ctx.strokeStyle).toBe("#B06EC8");
  });

  it("globalAlpha 應設為 0.35", () => {
    const ctx = makeMockCtxFull();
    drawAntiCounterfeitPattern(
      ctx as unknown as CanvasRenderingContext2D,
      200,
      120,
    );
    expect(ctx.globalAlpha).toBe(0.35);
  });
});
