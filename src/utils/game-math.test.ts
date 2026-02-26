import { describe, it, expect } from "vitest";
import { calcBingoLineProbabilities } from "./game-math";

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
