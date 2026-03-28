import { describe, it, expect } from "vitest";
import { calcBingoLineProbabilities, calculateRTP } from "./game-math";

// ── calcBingoLineProbabilities ─────────────────────────────

describe("calcBingoLineProbabilities", () => {
  it("機率總和應為 1", () => {
    const probs = calcBingoLineProbabilities(3, 6);
    const sum = Object.values(probs).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it("所有機率值 >= 0", () => {
    const probs = calcBingoLineProbabilities(3, 6);
    for (const p of Object.values(probs)) {
      expect(p).toBeGreaterThanOrEqual(0);
    }
  });

  it("3×3：key 範圍為 0..8（2×3+2 條線）", () => {
    const probs = calcBingoLineProbabilities(3, 6);
    expect(probs[0]).toBeDefined();
    expect(probs[8]).toBeDefined();
    expect(probs[9]).toBeUndefined();
  });

  it("4×4：key 範圍為 0..10（2×4+2 條線）", () => {
    const probs = calcBingoLineProbabilities(4, 10);
    expect(probs[0]).toBeDefined();
    expect(probs[10]).toBeDefined();
    expect(probs[11]).toBeUndefined();
  });

  it("6×6：key 範圍為 0..14（2×6+2 條線）", () => {
    const probs = calcBingoLineProbabilities(6, 22);
    expect(probs[0]).toBeDefined();
    expect(probs[14]).toBeDefined();
    expect(probs[15]).toBeUndefined();
  });

  it("3×3 標準參數：P(0 條線) 為最高機率（最常見結果）", () => {
    const probs = calcBingoLineProbabilities(3, 6);
    const maxProb = Math.max(...Object.values(probs));
    expect(probs[0]).toBe(maxProb);
  });

  it("drawnCount=0：P(0 條線) = 1，其餘 = 0", () => {
    const probs = calcBingoLineProbabilities(3, 0);
    expect(probs[0]).toBeCloseTo(1, 5);
    for (let k = 1; k <= 8; k++) {
      expect(probs[k]).toBeCloseTo(0, 5);
    }
  });

  it("期望連線數 ≈ totalLines × (drawnCount/poolSize)^gridSize", () => {
    const gridSize = 3;
    const drawnCount = 6;
    const poolSize = Math.ceil(gridSize * gridSize * 2); // 18
    const totalLines = 2 * gridSize + 2; // 8
    const expectedLines =
      totalLines * Math.pow(drawnCount / poolSize, gridSize);

    const probs = calcBingoLineProbabilities(gridSize, drawnCount);
    const actualExpected = Object.entries(probs).reduce(
      (sum, [k, p]) => sum + Number(k) * p,
      0,
    );
    expect(actualExpected).toBeCloseTo(expectedLines, 1);
  });

  it("不可變：多次呼叫相同參數回傳相同結果（deterministic）", () => {
    const a = calcBingoLineProbabilities(3, 6);
    const b = calcBingoLineProbabilities(3, 6);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ── calculateRTP ───────────────────────────────────────────

describe("calculateRTP", () => {
  const stdPrizes = [
    { uid: "a", label: "謝謝參與", amount: "0", weight: "45" },
    { uid: "b", label: "$100", amount: "100", weight: "45" },
    { uid: "c", label: "$500", amount: "500", weight: "10" },
  ];

  it("cellCount 預設 1 時等同舊行為，per-cell EV / ticketPrice", () => {
    expect(calculateRTP(stdPrizes, 100)).toBeCloseTo(0.95, 5);
  });

  it("cellCount=4 時回傳 per-card RTP = 0.95 * 4 = 3.80", () => {
    expect(calculateRTP(stdPrizes, 100, 4)).toBeCloseTo(3.8, 5);
  });

  it("cellCount=1 明確傳入時與預設相同", () => {
    expect(calculateRTP(stdPrizes, 100, 1)).toBeCloseTo(0.95, 5);
  });

  it("ticketPrice <= 0 → null（cellCount 不影響）", () => {
    expect(calculateRTP(stdPrizes, 0, 4)).toBeNull();
  });

  it("空 prizes → null", () => {
    expect(calculateRTP([], 100, 4)).toBeNull();
  });
});
