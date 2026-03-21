import type { Prize } from "@/types";
import symCoinUrl from "@/assets/symbols/sym-coin.png";
import symYuanbaoUrl from "@/assets/symbols/sym-yuanbao.png";
import symRuyiUrl from "@/assets/symbols/sym-ruyi.png";
import symFuUrl from "@/assets/symbols/sym-fu.png";
import symFirecrackersUrl from "@/assets/symbols/sym-firecrackers.png";
import symHongbaoUrl from "@/assets/symbols/sym-hongbao.png";

// ── 10 種視覺符號（v1 + v2a triple 共用）─────────────────────

export interface Symbol {
  code: string;
  emoji: string;
  label: string;
  abbr?: string; // short abbreviation for cell display (≤5 chars)
  spriteFile?: string;
  spriteLabel?: string; // alt text，描述實際圖片內容（與 label 遊戲名稱區分）
}

export const SYMBOL_POOL: Symbol[] = [
  {
    code: "STAR",
    emoji: "⭐",
    label: "星星",
    abbr: "COIN",
    spriteFile: symCoinUrl,
    spriteLabel: "金幣",
  },
  {
    code: "MONEY",
    emoji: "💰",
    label: "金袋",
    abbr: "YUAN",
    spriteFile: symYuanbaoUrl,
    spriteLabel: "元寶",
  },
  {
    code: "DIAMOND",
    emoji: "💎",
    label: "鑽石",
    abbr: "RUYI",
    spriteFile: symRuyiUrl,
    spriteLabel: "如意",
  },
  {
    code: "CLOVER",
    emoji: "🍀",
    label: "幸運草",
    abbr: "FU",
    spriteFile: symFuUrl,
    spriteLabel: "福字",
  },
  {
    code: "BELL",
    emoji: "🔔",
    label: "鈴鐺",
    abbr: "BANG",
    spriteFile: symFirecrackersUrl,
    spriteLabel: "鞭炮",
  },
  {
    code: "CHERRY",
    emoji: "🍒",
    label: "櫻桃",
    abbr: "HONG",
    spriteFile: symHongbaoUrl,
    spriteLabel: "紅包",
  },
  { code: "CROWN", emoji: "👑", label: "皇冠", abbr: "CROWN" },
  { code: "SUN", emoji: "☀️", label: "太陽", abbr: "SUN" },
  { code: "DRAGON", emoji: "🐉", label: "龍", abbr: "DRAGO" },
  { code: "COIN", emoji: "🪙", label: "金幣", abbr: "GOLD" },
];

// ── 查詢 ─────────────────────────────────────────────────────

export function getSymbolByCode(code: string): Symbol | undefined {
  return SYMBOL_POOL.find((s) => s.code === code);
}

// ── 自動分配符號到獎項（依 index 循環） ──────────────────────

export function assignSymbolsToPrizes(prizes: Prize[]): Prize[] {
  return prizes.map((prize, i) => ({
    ...prize,
    symbolCode: SYMBOL_POOL[i % SYMBOL_POOL.length]!.code,
  }));
}
