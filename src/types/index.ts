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
  cardTypeIndex: number; // 對應 config.cardTypes[i]
  zones: ScratchZone[]; // 刮除區陣列（v1 固定只有一個）
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

// 玩法識別碼（v1 只有 symbol，v2+ 擴充）
export type Mechanic = "symbol";

// 難度預設（v1 先加欄位，UI 選擇器 v2 再實作）
export type DifficultyPreset =
  | "generous"
  | "standard"
  | "conservative"
  | "realistic";

// symbol 玩法選項
export interface SymbolOptions {
  cellsPerZone: number;
}

export type MechanicOptions = SymbolOptions; // v2+ union 擴充

// 單一卡型設定（v1 只會有一個）
export interface CardTypeConfig {
  mechanic: Mechanic;
  prizes: Prize[];
  count: number;
  themeId: string;
  difficultyPreset: DifficultyPreset;
  mechanicOptions: MechanicOptions;
}

// 全局遊戲設定（breaking change：取代舊有的扁平欄位）
export interface GameConfig {
  sessionTitle: string;
  cardTypes: CardTypeConfig[]; // 取代舊有的扁平欄位
  effectsEnabled: boolean;
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
