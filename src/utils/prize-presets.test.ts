import { describe, it, expect } from "vitest";
import {
  DIFFICULTY_PRESETS,
  scalePrizesToTicketPrice,
  calculateRTP,
  classifyDifficulty,
} from "./prize-presets";
import type { PrizeDraft } from "@/hooks/useHostForm";
import type { DifficultyPreset } from "@/types";

// ── calculateRTP ───────────────────────────────────────────

describe("calculateRTP", () => {
  it("標準三獎項 RTP 接近 0.95", () => {
    const prizes: PrizeDraft[] = [
      { uid: "a", label: "謝謝參與", amount: "0", weight: "45" },
      { uid: "b", label: "$100", amount: "100", weight: "45" },
      { uid: "c", label: "$500", amount: "500", weight: "10" },
    ];
    const rtp = calculateRTP(prizes, 100);
    expect(rtp).not.toBeNull();
    expect(rtp!).toBeCloseTo(0.95, 1);
  });

  it("全部輸（amount=0）→ RTP = 0", () => {
    const prizes: PrizeDraft[] = [
      { uid: "a", label: "謝謝", amount: "0", weight: "100" },
    ];
    const rtp = calculateRTP(prizes, 100);
    expect(rtp).toBe(0);
  });

  it("ticketPrice = 0 → 回傳 null", () => {
    const prizes: PrizeDraft[] = [
      { uid: "a", label: "謝謝", amount: "0", weight: "45" },
      { uid: "b", label: "$100", amount: "100", weight: "45" },
    ];
    expect(calculateRTP(prizes, 0)).toBeNull();
  });

  it("無有效 prizes（全部 weight ≤ 0）→ 回傳 null", () => {
    const prizes: PrizeDraft[] = [
      { uid: "a", label: "謝謝", amount: "0", weight: "0" },
    ];
    expect(calculateRTP(prizes, 100)).toBeNull();
  });

  it("空 prizes 陣列 → 回傳 null", () => {
    expect(calculateRTP([], 100)).toBeNull();
  });

  it("不可變：原陣列不被修改", () => {
    const prizes: PrizeDraft[] = [
      { uid: "a", label: "謝謝", amount: "0", weight: "60" },
      { uid: "b", label: "$100", amount: "100", weight: "30" },
      { uid: "c", label: "$500", amount: "500", weight: "10" },
    ];
    const original = JSON.stringify(prizes);
    calculateRTP(prizes, 100);
    expect(JSON.stringify(prizes)).toBe(original);
  });
});

// ── classifyDifficulty ─────────────────────────────────────

describe("classifyDifficulty", () => {
  // generous: rtp > 1.05
  it("rtp=1.20 → generous", () =>
    expect(classifyDifficulty(1.2)).toBe("generous"));
  it("rtp=1.06 → generous", () =>
    expect(classifyDifficulty(1.06)).toBe("generous"));
  it("rtp=1.05 → standard（邊界不含）", () =>
    expect(classifyDifficulty(1.05)).toBe("standard"));

  // standard: 0.85 <= rtp <= 1.05
  it("rtp=0.95 → standard", () =>
    expect(classifyDifficulty(0.95)).toBe("standard"));
  it("rtp=0.85 → standard（下邊界）", () =>
    expect(classifyDifficulty(0.85)).toBe("standard"));
  it("rtp=1.05 → standard（上邊界）", () =>
    expect(classifyDifficulty(1.05)).toBe("standard"));

  // conservative: 0.70 <= rtp < 0.85
  it("rtp=0.80 → conservative", () =>
    expect(classifyDifficulty(0.8)).toBe("conservative"));
  it("rtp=0.70 → conservative（下邊界）", () =>
    expect(classifyDifficulty(0.7)).toBe("conservative"));
  it("rtp=0.849 → conservative（接近上邊界）", () =>
    expect(classifyDifficulty(0.849)).toBe("conservative"));

  // realistic: 0.55 <= rtp < 0.70
  it("rtp=0.63 → realistic", () =>
    expect(classifyDifficulty(0.63)).toBe("realistic"));
  it("rtp=0.55 → realistic（下邊界）", () =>
    expect(classifyDifficulty(0.55)).toBe("realistic"));
  it("rtp=0.699 → realistic（接近上邊界）", () =>
    expect(classifyDifficulty(0.699)).toBe("realistic"));

  // custom
  it("rtp=0.54 → custom（低於 realistic）", () =>
    expect(classifyDifficulty(0.54)).toBe("custom"));
  it("rtp=0.10 → custom", () => expect(classifyDifficulty(0.1)).toBe("custom"));
});

// ── scalePrizesToTicketPrice ───────────────────────────────

describe("scalePrizesToTicketPrice", () => {
  it("ticketPrice=100 時獎項金額不變", () => {
    const result = scalePrizesToTicketPrice("standard", 100);
    expect(result.find((p) => p.label === "$100")?.amount).toBe("100");
    expect(result.find((p) => p.label === "$500")?.amount).toBe("500");
  });

  it("ticketPrice=200 時金額加倍", () => {
    const result = scalePrizesToTicketPrice("standard", 200);
    expect(result.find((p) => p.amount === "200")).toBeTruthy();
    expect(result.find((p) => p.amount === "1000")).toBeTruthy();
  });

  it("ticketPrice=50 時金額減半", () => {
    const result = scalePrizesToTicketPrice("standard", 50);
    expect(result.find((p) => p.amount === "50")).toBeTruthy();
    expect(result.find((p) => p.amount === "250")).toBeTruthy();
  });

  it("$0 的獎項 label 固定「謝謝參與」，金額仍為 0", () => {
    const result = scalePrizesToTicketPrice("standard", 200);
    const loseItem = result.find((p) => p.amount === "0");
    expect(loseItem?.label).toBe("謝謝參與");
  });

  it("回傳新陣列（不可變）", () => {
    const result1 = scalePrizesToTicketPrice("standard", 100);
    const result2 = scalePrizesToTicketPrice("standard", 100);
    expect(result1).not.toBe(result2);
  });

  it("generous 模板 RTP 接近 1.20", () => {
    const prizes = scalePrizesToTicketPrice("generous", 100);
    const rtp = calculateRTP(prizes, 100);
    expect(rtp).toBeCloseTo(DIFFICULTY_PRESETS.generous.targetRtp, 1);
  });

  it("conservative 模板 RTP 接近 0.80", () => {
    const prizes = scalePrizesToTicketPrice("conservative", 100);
    const rtp = calculateRTP(prizes, 100);
    expect(rtp).toBeCloseTo(DIFFICULTY_PRESETS.conservative.targetRtp, 1);
  });

  it("realistic 模板 RTP 接近 0.63", () => {
    const prizes = scalePrizesToTicketPrice("realistic", 100);
    const rtp = calculateRTP(prizes, 100);
    expect(rtp).toBeCloseTo(DIFFICULTY_PRESETS.realistic.targetRtp, 1);
  });

  it("cellCount=4 時 standard 金額不變（$100/$500），權重正規化加總=100", () => {
    const prizes = scalePrizesToTicketPrice("standard", 100, 4);
    expect(prizes.find((p) => p.amount === "100")?.weight).toBe("11.25");
    expect(prizes.find((p) => p.amount === "500")?.weight).toBe("2.5");
    expect(prizes.find((p) => p.amount === "0")?.weight).toBe("86.25");
    const total = prizes.reduce((s, p) => s + parseFloat(p.weight), 0);
    expect(total).toBeCloseTo(100, 1);
  });

  it("cellCount=4 時中獎率 = 55/400 = 13.75%", () => {
    const prizes = scalePrizesToTicketPrice("standard", 100, 4);
    const totalWeight = prizes.reduce((s, p) => s + parseFloat(p.weight), 0);
    const winWeight = prizes
      .filter((p) => parseFloat(p.amount) > 0)
      .reduce((s, p) => s + parseFloat(p.weight), 0);
    expect(winWeight / totalWeight).toBeCloseTo(0.1375, 4);
  });
});

// ── DIFFICULTY_PRESETS ─────────────────────────────────────

describe("DIFFICULTY_PRESETS", () => {
  it("四個 preset 都存在", () => {
    expect(DIFFICULTY_PRESETS.generous).toBeDefined();
    expect(DIFFICULTY_PRESETS.standard).toBeDefined();
    expect(DIFFICULTY_PRESETS.conservative).toBeDefined();
    expect(DIFFICULTY_PRESETS.realistic).toBeDefined();
  });

  it("每個 preset 的 calculateRTP(prizes, 100) 應接近 targetRtp（容差 ±0.02）", () => {
    for (const [key, preset] of Object.entries(DIFFICULTY_PRESETS)) {
      const prizes = scalePrizesToTicketPrice(key as DifficultyPreset, 100);
      const rtp = calculateRTP(prizes, 100);
      expect(rtp).not.toBeNull();
      expect(Math.abs(rtp! - preset.targetRtp)).toBeLessThan(0.02);
    }
  });
});

describe("scalePrizesToTicketPrice — 跨 cellCount RTP 恆等", () => {
  const CELL_COUNTS = [1, 2, 3, 4, 6, 9];
  for (const [key, preset] of Object.entries(DIFFICULTY_PRESETS)) {
    for (const cc of CELL_COUNTS) {
      it(`${key} cellCount=${cc} → RTP ≈ ${preset.targetRtp}`, () => {
        const prizes = scalePrizesToTicketPrice(key as DifficultyPreset, 100, cc);
        const rtp = calculateRTP(prizes, 100, cc);
        expect(rtp).toBeCloseTo(preset.targetRtp, 2);
      });
    }
  }
});
