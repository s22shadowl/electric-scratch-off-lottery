import { describe, it, expect } from "vitest";
import {
  DIFFICULTY_PRESETS,
  scalePrizesToTicketPrice,
  applyPresetKeepExtras,
  calculateRTP,
  classifyDifficulty,
  normalizeToHundred,
  autoLabel,
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
    expect(result.find((p) => p.amount === "100")).toBeTruthy();
    expect(result.find((p) => p.amount === "500")).toBeTruthy();
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

  it("$0 的獎項 label 為空字串，金額仍為 0", () => {
    const result = scalePrizesToTicketPrice("standard", 200);
    const loseItem = result.find((p) => p.amount === "0");
    expect(loseItem?.label).toBe("");
  });

  it("所有 label 皆為空字串（由 PrizeEditor auto-label 接管）", () => {
    const result = scalePrizesToTicketPrice("standard", 100);
    expect(result.every((p) => p.label === "")).toBe(true);
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

  it("realistic preset 有 7 層獎項且 RTP ≈ 0.63", () => {
    const result = scalePrizesToTicketPrice("realistic", 100, 1);
    expect(result.length).toBe(7);
    expect(result.some((p) => p.amount === "300000")).toBe(true);
    const rtp = calculateRTP(result, 100, 1);
    expect(rtp!).toBeCloseTo(0.63, 1);
  });

  it("realistic preset 頭獎權重 < 0.01", () => {
    const result = scalePrizesToTicketPrice("realistic", 100, 1);
    const jackpot = result.find((p) => p.amount === "300000");
    expect(jackpot).toBeDefined();
    expect(parseFloat(jackpot!.weight)).toBeLessThan(0.01);
    expect(parseFloat(jackpot!.weight)).toBeGreaterThan(0);
  });

  it("party preset 有 7 層獎項且 RTP ≈ 0.95", () => {
    const result = scalePrizesToTicketPrice("party", 100, 1);
    expect(result.length).toBe(7);
    expect(result.some((p) => p.amount === "50000")).toBe(true);
    const rtp = calculateRTP(result, 100, 1);
    expect(rtp!).toBeCloseTo(0.95, 1);
  });

  it("party preset ticketPrice=200 時金額等比縮放", () => {
    const result = scalePrizesToTicketPrice("party", 200, 1);
    expect(result.some((p) => p.amount === "100000")).toBe(true);
    expect(result.some((p) => p.amount === "400")).toBe(true);
    const rtp = calculateRTP(result, 200, 1);
    expect(rtp!).toBeCloseTo(0.95, 1);
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
  it("五個 preset 都存在", () => {
    expect(DIFFICULTY_PRESETS.generous).toBeDefined();
    expect(DIFFICULTY_PRESETS.standard).toBeDefined();
    expect(DIFFICULTY_PRESETS.conservative).toBeDefined();
    expect(DIFFICULTY_PRESETS.realistic).toBeDefined();
    expect(DIFFICULTY_PRESETS.party).toBeDefined();
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
        expect(rtp).not.toBeNull();
        // 7-tier presets have larger rounding drift from normalizeToHundred 2dp
        expect(Math.abs(rtp! - preset.targetRtp)).toBeLessThan(0.06);
      });
    }
  }
});

// ── normalizeToHundred ────────────────────────────────────

describe("normalizeToHundred", () => {
  it("一般權重四捨五入至 2 位小數", () => {
    const result = normalizeToHundred([70, 20, 10]);
    expect(result).toEqual([70, 20, 10]);
  });

  it("加總 = 100（含餘數修正）", () => {
    const result = normalizeToHundred([33, 33, 34]);
    expect(result.reduce((s, w) => s + w, 0)).toBeCloseTo(100, 4);
  });

  it("極小權重（< 0.01%）保留 4 位小數", () => {
    const result = normalizeToHundred([68, 19, 7, 3, 0.5, 0.05, 0.0001]);
    const headPrize = result[6];
    expect(headPrize).toBeGreaterThan(0);
    expect(headPrize).toBeLessThan(0.01);
    // 確認不被四捨五入為 0
    expect(headPrize.toString()).toMatch(/^0\.000/);
  });

  it("混合精度下加總仍接近 100", () => {
    const result = normalizeToHundred([68, 19, 7, 3, 0.5, 0.05, 0.0001]);
    const total = result.reduce((s, w) => s + w, 0);
    expect(total).toBeCloseTo(100, 2);
  });

  it("全部為 0 時回傳原陣列", () => {
    const result = normalizeToHundred([0, 0, 0]);
    expect(result).toEqual([0, 0, 0]);
  });

  it("單一元素回傳 [100]", () => {
    const result = normalizeToHundred([42]);
    expect(result).toEqual([100]);
  });
});

// ── autoLabel ──────────────────────────────────────────────

describe("autoLabel", () => {
  it("$0 → '$0'", () => {
    expect(autoLabel("0")).toBe("$0");
  });

  it("$100 → '$100'", () => {
    expect(autoLabel("100")).toBe("$100");
  });

  it("$300000 → '$300,000'", () => {
    expect(autoLabel("300000")).toBe("$300,000");
  });

  it("空字串 → '$0'", () => {
    expect(autoLabel("")).toBe("$0");
  });
});

// ── applyPresetKeepExtras ─────────────────────────────────

describe("applyPresetKeepExtras", () => {
  it("沒有額外獎項時行為與 scalePrizesToTicketPrice 一致", () => {
    const current: PrizeDraft[] = [
      { uid: "a", label: "謝謝參與", amount: "0", weight: "45" },
      { uid: "b", label: "$100", amount: "100", weight: "45" },
      { uid: "c", label: "$500", amount: "500", weight: "10" },
    ];
    const result = applyPresetKeepExtras("standard", current, 100, 1);
    expect(result).not.toBeNull();
    const rtp = calculateRTP(result!, 100, 1);
    expect(rtp!).toBeCloseTo(0.95, 1);
  });

  it("有額外獎項時保留它們並命中目標 RTP", () => {
    const current: PrizeDraft[] = [
      { uid: "a", label: "謝謝參與", amount: "0", weight: "45" },
      { uid: "b", label: "$100", amount: "100", weight: "45" },
      { uid: "c", label: "$500", amount: "500", weight: "10" },
      { uid: "d", label: "$1000", amount: "1000", weight: "5" },
    ];
    const result = applyPresetKeepExtras("standard", current, 100, 1);
    expect(result).not.toBeNull();
    expect(result!).toHaveLength(4);
    expect(result!.some((p) => p.label === "$1000")).toBe(true);
    const rtp = calculateRTP(result!, 100, 1);
    expect(rtp!).toBeCloseTo(0.95, 1);
  });

  it("權重加總 = 100", () => {
    const current: PrizeDraft[] = [
      { uid: "a", label: "謝謝參與", amount: "0", weight: "45" },
      { uid: "b", label: "$100", amount: "100", weight: "45" },
      { uid: "c", label: "$500", amount: "500", weight: "10" },
      { uid: "d", label: "$200", amount: "200", weight: "8" },
    ];
    const result = applyPresetKeepExtras("standard", current, 100, 1);
    expect(result).not.toBeNull();
    const total = result!.reduce((s, p) => s + parseFloat(p.weight), 0);
    expect(total).toBeCloseTo(100, 1);
  });

  it("額外獎項導致 EV 超標無解時回傳 null（低金額高權重）", () => {
    const current: PrizeDraft[] = [
      { uid: "a", label: "謝謝參與", amount: "0", weight: "45" },
      { uid: "b", label: "$100", amount: "100", weight: "45" },
      { uid: "c", label: "$500", amount: "500", weight: "10" },
      { uid: "d", label: "$10", amount: "10", weight: "5" },
    ];
    const result = applyPresetKeepExtras("standard", current, 100, 1);
    expect(result).toBeNull();
  });

  it("cellCount > 1 時仍命中目標 RTP", () => {
    const current: PrizeDraft[] = [
      { uid: "a", label: "謝謝參與", amount: "0", weight: "45" },
      { uid: "b", label: "$100", amount: "100", weight: "45" },
      { uid: "c", label: "$500", amount: "500", weight: "10" },
      { uid: "d", label: "$300", amount: "300", weight: "8" },
    ];
    const result = applyPresetKeepExtras("standard", current, 100, 4);
    expect(result).not.toBeNull();
    const rtp = calculateRTP(result!, 100, 4);
    expect(rtp!).toBeCloseTo(0.95, 1);
  });

  it("額外不中獎獎項（amount=0）視為 lose 組一起調節", () => {
    const current: PrizeDraft[] = [
      { uid: "a", label: "謝謝參與", amount: "0", weight: "45" },
      { uid: "b", label: "$100", amount: "100", weight: "45" },
      { uid: "c", label: "$500", amount: "500", weight: "10" },
      { uid: "d", label: "安慰獎", amount: "0", weight: "5" },
    ];
    const result = applyPresetKeepExtras("standard", current, 100, 1);
    expect(result).not.toBeNull();
    expect(result!).toHaveLength(4);
    const rtp = calculateRTP(result!, 100, 1);
    expect(rtp!).toBeCloseTo(0.95, 1);
  });

  it("排序後順序不同仍保留所有金額", () => {
    // 模擬 auto-sort 後額外獎項 $200 排到模板獎項之間
    const current: PrizeDraft[] = [
      { uid: "a", label: "謝謝參與", amount: "0", weight: "40" },
      { uid: "d", label: "$200", amount: "200", weight: "10" },
      { uid: "b", label: "$300", amount: "300", weight: "30" },
      { uid: "c", label: "$500", amount: "500", weight: "20" },
    ];
    const result = applyPresetKeepExtras("standard", current, 100, 1);
    expect(result).not.toBeNull();
    expect(result!.map((p) => p.amount)).toEqual(["0", "200", "300", "500"]);
    expect(result!.map((p) => p.uid)).toEqual(["a", "d", "b", "c"]);
    const rtp = calculateRTP(result!, 100, 1);
    expect(rtp!).toBeCloseTo(0.95, 1);
  });

  it("所有獎項金額保持不變，只調整權重", () => {
    const current: PrizeDraft[] = [
      { uid: "a", label: "謝謝參與", amount: "0", weight: "45" },
      { uid: "b", label: "$100", amount: "100", weight: "45" },
      { uid: "c", label: "$500", amount: "500", weight: "10" },
      { uid: "d", label: "$600", amount: "600", weight: "5" },
    ];
    const result = applyPresetKeepExtras("standard", current, 200, 1);
    expect(result).not.toBeNull();
    // 所有金額原封不動
    expect(result!.map((p) => p.amount)).toEqual(["0", "100", "500", "600"]);
    // uid 和 label 也不變
    expect(result!.map((p) => p.uid)).toEqual(["a", "b", "c", "d"]);
    expect(result!.map((p) => p.label)).toEqual(["謝謝參與", "$100", "$500", "$600"]);
    const rtp = calculateRTP(result!, 200, 1);
    expect(rtp!).toBeCloseTo(0.95, 1);
  });
});
