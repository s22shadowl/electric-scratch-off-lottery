// ── Spec-01：核心資料模型 ─────────────────────────────────

// 獎項定義
export interface Prize {
  id: string;
  label: string; // 顯示文字，如「$300」、「謝謝」
  amount: number; // 金額（0 = 未中獎）
  symbolCode?: string; // 英文防偽碼，如「FIVHUND」（視覺用）
  probability: number; // 相對權重（系統正規化為實際機率）
  isWin: boolean; // amount > 0 的快捷旗標
}

// 單一刮除格
export interface ScratchCell {
  id: string;
  prize: Prize; // 格子底下藏的獎項（建卡時由抽獎邏輯決定）
  scratchProgress: number; // 0–1，Canvas 刮除覆蓋比例
  isRevealed: boolean; // scratchProgress 達門檻後設為 true
}

// 刮除區（v1 每張卡固定 1 個）
export type ZoneShapeVariant = "left" | "right" | "single";

export interface ScratchZone {
  id: string;
  shapeVariant: ZoneShapeVariant; // SVG clip-path 模板選擇
  cells: ScratchCell[];
}

// 一張刮刮樂卡
export type CardStatus = "in-pile" | "selected" | "scratching" | "completed";

export interface ScratchCard {
  id: string;
  serialNumber: string; // 顯示用序號，如 "AQWT-01"
  zone: ScratchZone;
  status: CardStatus;
  totalWinnings: number; // 所有已揭曉 isWin cell 的金額加總（即時計算）
}

// 視覺主題
export interface CardTheme {
  id: string;
  name: string;
  character: "wealth-god" | "none";
  bgGradient: [string, string]; // 漸層起迄色
  accentColor: string; // 金色等輔助色
}

// 主持人設定（URL 序列化後傳遞）
export interface GameConfig {
  sessionTitle: string; // 活動名稱
  cardCount: number; // 總發牌數
  prizes: Prize[]; // 獎項池（含相對權重）
  cellsPerZone: number; // 每刮區格數，建議 5–6
  themeId: string; // 對應 CardTheme.id
  effectsEnabled: boolean; // 粒子特效預設值
}

// 玩家端執行狀態（Zustand store）
export type GamePhase = "pile" | "scratching" | "results";

export interface GameState {
  config: GameConfig;
  cards: ScratchCard[];
  selectedCardIds: string[]; // 玩家從牌堆挑選的卡
  phase: GamePhase;
  effectsEnabled: boolean; // 玩家可覆蓋主持人預設值
}
