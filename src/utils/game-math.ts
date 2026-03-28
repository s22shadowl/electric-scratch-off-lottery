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
 * 依目前獎項草稿 + 票面計算 RTP（期望值 × cellCount / ticketPrice）。
 * cellCount 為每張卡的格數（預設 1）。
 * 無效輸入（ticketPrice <= 0 或無有效 prizes）回傳 null。
 *
 * 搭配 scalePrizesToTicketPrice 使用時，該函式已透過膨脹 $0 weight
 * 來壓低 per-cell EV，使 per-card RTP = targetRtp。
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

/**
 * 計算中獎率：weight > 0 且 amount > 0 的權重佔總權重比例。
 * 回傳 0–1 的小數（0.1375 = 13.75%）。
 * 無有效 prizes 時回傳 null。
 */
export function calculateWinRate(
  prizes: PrizeDraft[],
): number | null {
  const valid = prizes.filter((p) => parseFloat(p.weight) > 0);
  if (valid.length === 0) return null;

  const totalWeight = valid.reduce((sum, p) => sum + parseFloat(p.weight), 0);
  if (totalWeight <= 0) return null;

  const winWeight = valid
    .filter((p) => (parseFloat(p.amount) || 0) > 0)
    .reduce((sum, p) => sum + parseFloat(p.weight), 0);

  return winWeight / totalWeight;
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
