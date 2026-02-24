import type { Prize } from "@/types";

// ── 10 種視覺符號（v1 + v2a triple 共用）─────────────────────

export interface Symbol {
  code: string;
  emoji: string;
  label: string;
}

export const SYMBOL_POOL: Symbol[] = [
  { code: "STAR",    emoji: "⭐", label: "星星" },
  { code: "MONEY",   emoji: "💰", label: "金袋" },
  { code: "DIAMOND", emoji: "💎", label: "鑽石" },
  { code: "CLOVER",  emoji: "🍀", label: "幸運草" },
  { code: "BELL",    emoji: "🔔", label: "鈴鐺" },
  { code: "CHERRY",  emoji: "🍒", label: "櫻桃" },
  { code: "CROWN",   emoji: "👑", label: "皇冠" },
  { code: "SUN",     emoji: "☀️", label: "太陽" },
  { code: "DRAGON",  emoji: "🐉", label: "龍" },
  { code: "COIN",    emoji: "🪙", label: "金幣" },
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
