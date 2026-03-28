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
      { label: "謝謝參與", amount: 0, weight: 65 },
      { label: "$100", amount: 100, weight: 28 },
      { label: "$500", amount: 500, weight: 7 },
    ],
  },
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
  const totalLoseWeight = Math.max(0, Math.round(requiredTotalWeight - W))

  // 4. 原始不中獎 weight 總和（用於按比例分配）
  const originalLoseWeightSum = template.prizes
    .filter((p) => p.amount === 0)
    .reduce((sum, p) => sum + p.weight, 0)

  // 5. 組裝結果（raw weights）
  const rawDrafts = scaled.map((p) => {
    const isLose = p.scaledAmount === 0
    const weight = isLose
      ? originalLoseWeightSum > 0
        ? Math.round((p.weight / originalLoseWeightSum) * totalLoseWeight)
        : totalLoseWeight
      : p.weight

    return {
      uid: `preset-uid-${++uidCounter}`,
      label: isLose ? "謝謝參與" : `$${p.scaledAmount}`,
      amount: String(p.scaledAmount),
      weight,
    }
  })

  // 6. 正規化 weights 使加總 = 100（2 位小數）
  const rawTotal = rawDrafts.reduce((s, p) => s + p.weight, 0)
  if (rawTotal <= 0) return rawDrafts.map((p) => ({ ...p, weight: "0" }))

  const normalized = rawDrafts.map(
    (p) => Math.round((p.weight / rawTotal) * 10000) / 100,
  )
  const sum = normalized.reduce((s, w) => s + w, 0)
  const diff = Math.round((100 - sum) * 100) / 100
  if (diff !== 0) {
    let maxIdx = 0
    for (let i = 1; i < normalized.length; i++) {
      if (normalized[i] > normalized[maxIdx]) maxIdx = i
    }
    normalized[maxIdx] = Math.round((normalized[maxIdx] + diff) * 100) / 100
  }

  return rawDrafts.map((p, i) => ({
    uid: p.uid,
    label: p.label,
    amount: String(p.amount),
    weight: String(normalized[i]),
  }))
}

// ── re-export from game-math（正式實作已移至 game-math.ts）──
export { calculateRTP, classifyDifficulty, calculateWinRate } from "./game-math"
