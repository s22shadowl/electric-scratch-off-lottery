import type { DifficultyPreset } from "@/types";
import type { PrizeDraft } from "@/hooks/useHostForm";

// ── 難度預設定義 ───────────────────────────────────────────

export interface PresetTemplate {
  label: string; // 中文名稱
  emoji: string;
  targetRtp: number;
  description: string;
  // 模板獎項（以 ticketPrice=100 為基準）
  prizes: Array<{ label: string; amount: number; weight: number }>;
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
    label: "真實難度",
    emoji: "🎰",
    targetRtp: 0.63,
    description: "仿台彩 $100 面額水準",
    prizes: [
      { label: "謝謝參與", amount: 0, weight: 65 },
      { label: "$100", amount: 100, weight: 28 },
      { label: "$500", amount: 500, weight: 7 },
    ],
  },
};

// ── scalePrizesToTicketPrice ───────────────────────────────

let uidCounter = 1000;

/**
 * 依票面價格縮放模板獎項金額，回傳新的 PrizeDraft 陣列。
 * $0 的 label 固定「謝謝參與」；其他 label 更新為縮放後金額。
 */
export function scalePrizesToTicketPrice(
  preset: DifficultyPreset,
  ticketPrice: number,
): PrizeDraft[] {
  const template = DIFFICULTY_PRESETS[preset];
  return template.prizes.map((p) => {
    const scaled = Math.round((p.amount * ticketPrice) / 100);
    const label = scaled === 0 ? "謝謝參與" : `$${scaled}`;
    return {
      uid: `preset-uid-${++uidCounter}`,
      label,
      amount: String(scaled),
      weight: String(p.weight),
    };
  });
}

// ── re-export from game-math（正式實作已移至 game-math.ts）──
export { calculateRTP, classifyDifficulty } from "./game-math";
