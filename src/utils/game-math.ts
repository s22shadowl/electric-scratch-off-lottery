// ── game-math.ts ──────────────────────────────────────────
// 遊戲數學計算函式集中模組

// ── 輔助：階乘（最多 14!，足以覆蓋 gridSize=6 的 14 條線） ──

const FACTORIALS = [
  1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600,
  6227020800, 87178291200,
];

function factorial(n: number): number {
  return FACTORIALS[n] ?? FACTORIALS[FACTORIALS.length - 1]!;
}

function poissonPMF(k: number, lambda: number): number {
  if (lambda === 0) return k === 0 ? 1 : 0;
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

// ── calculateRTP ───────────────────────────────────────────

import type { PrizeDraft } from "@/hooks/useHostForm";
import type { DifficultyPreset } from "@/types";

/**
 * 依目前獎項草稿 + 票面計算 RTP（期望值 / ticketPrice）。
 * 無效輸入（ticketPrice <= 0 或無有效 prizes）回傳 null。
 *
 * ⚠️  已知 Bug（待修）：此函式計算的是「每格」期望值，不是「每張卡」期望值。
 *
 * 問題：symbol / triple 等玩法每張卡有 N 格，每格獨立抽獎結算。
 * 實際每卡期望值 = per-cell EV × cellCount，實際 RTP = (per-cell EV × cellCount) / ticketPrice。
 *
 * 範例（standard 預設，ticketPrice=100，cellsPerZone=6）：
 *   per-cell EV = 0×0.45 + 100×0.45 + 500×0.10 = $95
 *   此函式回傳：95 / 100 = 0.95（看似正確）
 *   實際每卡 EV：$95 × 6 = $570，實際 RTP = 5.7（570%）← 嚴重高估
 *
 * 修正方向：加入 cellCount 參數，回傳值改為 (ev * cellCount) / ticketPrice。
 * 同時需調整 DIFFICULTY_PRESETS 的獎項金額，使 per-cell EV 降至
 * ticketPrice × targetRTP / cellCount。
 * 主持人頁的 EVDisplay 也需傳入對應格數。
 */
export function calculateRTP(
  prizes: PrizeDraft[],
  ticketPrice: number,
): number | null {
  if (ticketPrice <= 0) return null;

  const valid = prizes.filter((p) => parseFloat(p.weight) > 0);
  if (valid.length === 0) return null;

  const totalWeight = valid.reduce((sum, p) => sum + parseFloat(p.weight), 0);
  if (totalWeight <= 0) return null;

  const ev = valid.reduce((sum, p) => {
    const amount = parseFloat(p.amount) || 0;
    const weight = parseFloat(p.weight);
    return sum + (amount * weight) / totalWeight;
  }, 0);

  return ev / ticketPrice;
}

// ── classifyDifficulty ─────────────────────────────────────

/**
 * 將 RTP 分類為難度標籤。
 *
 * rtp > 1.05           → 'generous'
 * 0.85 <= rtp <= 1.05  → 'standard'
 * 0.70 <= rtp < 0.85   → 'conservative'
 * 0.55 <= rtp < 0.70   → 'realistic'
 * 其他                  → 'custom'
 */
export function classifyDifficulty(rtp: number): DifficultyPreset | "custom" {
  if (rtp > 1.05) return "generous";
  if (rtp >= 0.85) return "standard";
  if (rtp >= 0.7) return "conservative";
  if (rtp >= 0.55) return "realistic";
  return "custom";
}

// ── calcBingoLineProbabilities ─────────────────────────────

/**
 * 計算賓果卡完成 k 條線的機率分布（Poisson 近似）。
 *
 * - poolSize = ceil(gridSize² × 2)
 * - p        = drawnCount / poolSize（每格被開獎到的機率）
 * - λ        = totalLines × p^gridSize（期望完成線數）
 * - maxLines = 2 × gridSize + 2
 *
 * 回傳 Record<k, probability>，k 從 0 到 maxLines，機率總和 = 1。
 */
export function calcBingoLineProbabilities(
  gridSize: number,
  drawnCount: number,
): Record<number, number> {
  const poolSize = Math.ceil(gridSize * gridSize * 2);
  const p = drawnCount / poolSize;
  const totalLines = 2 * gridSize + 2;
  const lambda = totalLines * Math.pow(p, gridSize);

  const raw: number[] = [];
  for (let k = 0; k <= totalLines; k++) {
    raw.push(poissonPMF(k, lambda));
  }

  // 正規化（截斷至 maxLines 的 Poisson 尾巴）
  const sum = raw.reduce((a, b) => a + b, 0);
  const result: Record<number, number> = {};
  for (let k = 0; k <= totalLines; k++) {
    result[k] = sum > 0 ? raw[k]! / sum : k === 0 ? 1 : 0;
  }
  return result;
}
