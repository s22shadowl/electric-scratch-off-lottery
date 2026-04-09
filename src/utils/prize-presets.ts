import type { DifficultyPreset } from "@/types"
import type { PrizeDraft } from "@/hooks/useHostForm"

// ── 難度預設定義 ───────────────────────────────────────────

export interface PresetTemplate {
  label: string // 中文名稱
  emoji: string
  targetRtp: number
  description: string
  // 模板獎項（以 ticketPrice=100 為基準）
  prizes: Array<{ label: string; amount: number; weight: number }>
}

export const DIFFICULTY_PRESETS: Record<DifficultyPreset, PresetTemplate> = {
  generous: {
    label: "慷慨",
    emoji: "🎁",
    targetRtp: 1.2,
    description: "兒童活動、暖場用",
    prizes: [
      { label: "謝謝參與", amount: 0, weight: 40 },
      { label: "$100", amount: 100, weight: 45 },
      { label: "$500", amount: 500, weight: 15 },
    ],
  },
  standard: {
    label: "標準",
    emoji: "🎯",
    targetRtp: 0.95,
    description: "一般聚會用",
    prizes: [
      { label: "謝謝參與", amount: 0, weight: 45 },
      { label: "$100", amount: 100, weight: 45 },
      { label: "$500", amount: 500, weight: 10 },
    ],
  },
  conservative: {
    label: "保守",
    emoji: "🏆",
    targetRtp: 0.8,
    description: "競爭感更強",
    prizes: [
      { label: "謝謝參與", amount: 0, weight: 60 },
      { label: "$100", amount: 100, weight: 30 },
      { label: "$500", amount: 500, weight: 10 },
    ],
  },
  realistic: {
    label: "真實",
    emoji: "🎰",
    targetRtp: 0.63,
    description: "仿台彩 $100 面額水準",
    prizes: [
      { label: "$0", amount: 0, weight: 68 },
      { label: "$100", amount: 100, weight: 19 },
      { label: "$200", amount: 200, weight: 7 },
      { label: "$500", amount: 500, weight: 3 },
      { label: "$2,000", amount: 2000, weight: 0.5 },
      { label: "$10,000", amount: 10000, weight: 0.05 },
      { label: "$300,000", amount: 300000, weight: 0.0001 },
    ],
  },
  party: {
    label: "派對",
    emoji: "🎉",
    targetRtp: 0.95,
    description: "多層獎項、頭獎可中",
    prizes: [
      { label: "$0", amount: 0, weight: 50 },
      { label: "$100", amount: 100, weight: 14 },
      { label: "$200", amount: 200, weight: 6 },
      { label: "$500", amount: 500, weight: 3 },
      { label: "$2,000", amount: 2000, weight: 0.6 },
      { label: "$10,000", amount: 10000, weight: 0.15 },
      { label: "$50,000", amount: 50000, weight: 0.05 },
    ],
  },
}

// ── normalizeToHundred ────────────────────────────────────

/**
 * 將 raw weights 正規化至加總 = 100。
 * - 權重 ≥ 0.01%：四捨五入至 2 位小數
 * - 權重 < 0.01%：四捨五入至 4 位小數（避免歸零）
 * - 餘數修正加到最大權重項
 */
export function normalizeToHundred(rawWeights: number[]): number[] {
  const rawTotal = rawWeights.reduce((s, w) => s + w, 0)
  if (rawTotal <= 0) return rawWeights

  const percentages = rawWeights.map((w) => (w / rawTotal) * 100)

  const rounded = percentages.map((p) =>
    p >= 0.01
      ? Math.round(p * 100) / 100      // 2dp
      : Math.round(p * 10000) / 10000   // 4dp
  )

  // Guarantee: original weight > 0 → normalized >= 0.0001
  for (let i = 0; i < rounded.length; i++) {
    if (rawWeights[i] > 0 && rounded[i] === 0) {
      rounded[i] = 0.0001
    }
  }

  // Adjust largest item to keep sum ≈ 100 (2dp precision — micro residual ≤0.001 is acceptable)
  const sum = rounded.reduce((s, w) => s + w, 0)
  const diff = Math.round((100 - sum) * 100) / 100
  if (diff !== 0) {
    let maxIdx = 0
    for (let i = 1; i < rounded.length; i++) {
      if (rounded[i] > rounded[maxIdx]) maxIdx = i
    }
    rounded[maxIdx] = Math.round((rounded[maxIdx] + diff) * 100) / 100
  }

  return rounded
}

// ── autoLabel ──────────────────────────────────────────────

/** 從金額字串自動生成標籤。 */
export function autoLabel(amount: string): string {
  const n = parseInt(amount, 10) || 0
  return `$${n.toLocaleString("en-US")}`
}

// ── scalePrizesToTicketPrice ───────────────────────────────

let uidCounter = 1000

/**
 * 依票面價格與格數縮放模板獎項，回傳新的 PrizeDraft 陣列。
 *
 * 金額：依 ticketPrice/100 等比縮放（不除以 cellCount）。
 * 中獎率：透過膨脹 $0 的 weight 來壓低 per-cell EV，使
 *   per-card RTP = targetRtp（金額 × cellCount / ticketPrice）。
 *
 * 數學推導：
 *   S = Σ(scaledAmount_i × weight_i)  // 中獎項的加權金額和
 *   W = Σ(weight_i)                    // 中獎項的權重和
 *   requiredTotalWeight = S × cellCount / (targetRtp × ticketPrice)
 *   loseWeight = requiredTotalWeight − W
 */
export function scalePrizesToTicketPrice(
  preset: DifficultyPreset,
  ticketPrice: number,
  cellCount = 1,
): PrizeDraft[] {
  const template = DIFFICULTY_PRESETS[preset]

  // 1. 縮放金額（只依 ticketPrice，不除以 cellCount）
  const scaled = template.prizes.map((p) => ({
    ...p,
    scaledAmount: Math.round((p.amount * ticketPrice) / 100),
  }))

  // 2. 計算中獎項的加權金額和 & 權重和
  const winPrizes = scaled.filter((p) => p.scaledAmount > 0)
  const S = winPrizes.reduce((sum, p) => sum + p.scaledAmount * p.weight, 0)
  const W = winPrizes.reduce((sum, p) => sum + p.weight, 0)

  // 3. 解出不中獎總 weight
  const targetEV = (template.targetRtp * ticketPrice) / cellCount
  const requiredTotalWeight = targetEV > 0 ? S / targetEV : W
  const totalLoseWeight = Math.max(0, requiredTotalWeight - W)

  // 4. 原始不中獎 weight 總和（用於按比例分配）
  const originalLoseWeightSum = template.prizes
    .filter((p) => p.amount === 0)
    .reduce((sum, p) => sum + p.weight, 0)

  // 5. 組裝結果（raw weights）
  const rawDrafts = scaled.map((p) => {
    const isLose = p.scaledAmount === 0
    const weight = isLose
      ? originalLoseWeightSum > 0
        ? (p.weight / originalLoseWeightSum) * totalLoseWeight
        : totalLoseWeight
      : p.weight

    return {
      uid: `preset-uid-${++uidCounter}`,
      label: "",
      amount: String(p.scaledAmount),
      weight,
    }
  })

  // 6. 正規化 weights 使加總 = 100（混合精度）
  const rawTotal = rawDrafts.reduce((s, p) => s + p.weight, 0)
  if (rawTotal <= 0) return rawDrafts.map((p) => ({ ...p, weight: "0" }))

  const normalized = normalizeToHundred(rawDrafts.map((p) => p.weight))

  return rawDrafts.map((p, i) => ({
    uid: p.uid,
    label: p.label,
    amount: String(p.amount),
    weight: String(normalized[i]),
  }))
}

// ── applyPresetKeepExtras ─────────────────────────────────

/**
 * 套用難度預設，保留所有現有獎項（含額外新增的），只重算權重命中目標 RTP。
 *
 * 演算法：
 * - 保留所有 currentPrizes 的 uid / label / amount 不變。
 * - Win 組（amount > 0）初始權重 w_i = 1 / amount_i（金額反比）。
 * - Lose 組（amount = 0）初始權重 w_j = k（待求縮放因子）。
 * - 解 k 使 EV = targetRtp × ticketPrice / cellCount。
 * - 若 k < 0（獎項金額組合無法命中目標 RTP）則回傳 null。
 */
export function applyPresetKeepExtras(
  preset: DifficultyPreset,
  currentPrizes: PrizeDraft[],
  ticketPrice: number,
  cellCount = 1,
): PrizeDraft[] | null {
  const template = DIFFICULTY_PRESETS[preset]
  const templateCount = template.prizes.length

  // 沒有額外獎項 → 直接用原邏輯（全取代）
  if (currentPrizes.length <= templateCount) {
    return scalePrizesToTicketPrice(preset, ticketPrice, cellCount)
  }

  // 有額外獎項 → 保留所有獎項金額，只調整權重
  const amounts = currentPrizes.map((p) => parseInt(p.amount, 10) || 0)

  const winIndices = amounts
    .map((a, i) => (a > 0 ? i : -1))
    .filter((i) => i >= 0)
  const loseIndices = amounts
    .map((a, i) => (a === 0 ? i : -1))
    .filter((i) => i >= 0)

  const nWin = winIndices.length
  const winWSum = winIndices.reduce((s, i) => s + 1 / amounts[i], 0)

  // 目標 per-cell EV
  const targetEV = (template.targetRtp * ticketPrice) / cellCount

  // 無 lose 項可調節時，檢查 EV 是否已符合
  if (loseIndices.length === 0 && nWin > 0) {
    const fixedEV = winWSum > 0 ? nWin / winWSum : 0
    if (Math.abs(fixedEV - targetEV) > targetEV * 0.05) return null
  }

  // 解 k
  const k =
    loseIndices.length > 0
      ? (nWin - targetEV * winWSum) / (targetEV * loseIndices.length)
      : 0

  if (k < 0) return null // 無解

  // 組裝 raw weights
  const rawWeights = amounts.map((a) => (a > 0 ? 1 / a : k))

  // Normalize 至加總 = 100（混合精度）
  const rawTotal = rawWeights.reduce((s, w) => s + w, 0)
  if (rawTotal <= 0) return null

  const normalized = normalizeToHundred(rawWeights)

  return currentPrizes.map((p, i) => ({
    ...p,
    weight: String(normalized[i]),
  }))
}

// ── re-export from game-math（正式實作已移至 game-math.ts）──
export { calculateRTP, classifyDifficulty, calculateWinRate } from "./game-math"
