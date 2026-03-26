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
  compareValue?: number; // compare 玩法專用：zone[0/1] 顯示的 30–60 數字
  bingoNumber?: number; // bingo 玩法專用：zone[1] 賓果格號碼；zone[0] 開獎號碼
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

// 玩法識別碼
export type Mechanic = "symbol" | "triple" | "compare" | "bingo";

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

// triple 玩法選項（3 zones × rowsPerCard cells，每 row 判斷三同）
export interface TripleOptions {
  rowsPerCard: number; // 幾組三同（1–9）
}

// compare 玩法選項（3 zones × roundsPerCard cells：你的 vs 莊家 vs 獎金）
export interface CompareOptions {
  roundsPerCard: number; // 幾回合比大小（1–9）
}

// bingo 玩法選項（2 zones：開獎號碼區 + gridSize×gridSize 賓果格）
export interface BingoOptions {
  gridSize: number; // 3–6，賓果格邊長
  drawnCount: number; // 開獎號碼顆數，= ceil(gridSize² × 0.6)
  prizePerLine: number; // 每條連線獎金（元）
}

export type MechanicOptions =
  | SymbolOptions
  | TripleOptions
  | CompareOptions
  | BingoOptions;

// 單一卡型設定（v1 只會有一個）
export interface CardTypeConfig {
  mechanic: Mechanic;
  prizes: Prize[];
  count: number;
  themeId: string;
  difficultyPreset: DifficultyPreset;
  mechanicOptions: MechanicOptions;
  ticketPrice?: number; // 虛擬票面價格，用於計算 RTP（解碼時補預設 100）
}

// 全局遊戲設定（breaking change：取代舊有的扁平欄位）
export interface GameConfig {
  sessionTitle: string;
  cardTypes: CardTypeConfig[]; // 取代舊有的扁平欄位
  effectsEnabled: boolean;
  allowReturnToPile?: boolean;
}

// Theme Layout 元件共用 props
export interface ThemeLayoutProps {
  card: ScratchCard;
  cardTypeConfig: CardTypeConfig;
  config: GameConfig;
  maxPrize: number;
  revealCard?: (cardId: string) => void;
}

// Theme registry entry — fullCard layouts render the entire card (header/footer included)
export interface ThemeLayoutEntry {
  component: import("react").ComponentType<ThemeLayoutProps>;
  fullCard?: boolean;
}

// 玩家端執行狀態（Zustand store）
export type GamePhase = "pile" | "scratching" | "results";

export interface GameState {
  config: GameConfig;
  cards: ScratchCard[];
  selectedCardIds: string[]; // 玩家從牌堆挑選的卡
  phase: GamePhase;
  effectsEnabled: boolean; // 玩家可覆蓋主持人預設值
  currentScratchIndex: number; // 逐張刮除的當前索引
}
