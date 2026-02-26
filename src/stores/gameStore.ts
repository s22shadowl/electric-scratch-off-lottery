import { create } from "zustand";
import type {
  GameConfig,
  GameState,
  GamePhase,
  ScratchCard,
  Mechanic,
  BingoOptions,
} from "@/types";
import { buildDeck } from "@/utils/lottery";

// 刮除覆蓋比例達此門檻後自動揭曉格子
export const REVEAL_THRESHOLD = 0.7;

// ── Store 動作介面 ─────────────────────────────────────────

interface GameActions {
  initGame: (config: GameConfig) => void;
  selectCard: (cardId: string) => void;
  deselectCard: (cardId: string) => void;
  startScratching: () => void;
  updateCellProgress: (
    cardId: string,
    cellId: string,
    progress: number,
  ) => void;
  setPhase: (phase: GamePhase) => void;
  toggleEffects: () => void;
}

// ── 初始狀態 ──────────────────────────────────────────────

const initialState: GameState = {
  config: {
    sessionTitle: "",
    cardTypes: [],
    effectsEnabled: true,
  },
  cards: [],
  selectedCardIds: [],
  phase: "pile",
  effectsEnabled: true,
};

// ── 純函式：三同玩法的完成獎金計算（列對列比對）──────────────

function resolveTripleWinnings(card: ScratchCard): number {
  const [zone0, zone1, zone2] = card.zones;
  if (!zone0 || !zone1 || !zone2) return 0;
  return zone0.cells.reduce((sum, _, row) => {
    const p0 = zone0.cells[row]?.prize;
    const p1 = zone1.cells[row]?.prize;
    const p2 = zone2.cells[row]?.prize;
    if (p0 && p1 && p2 && p0.id === p1.id && p1.id === p2.id) {
      return sum + p0.amount;
    }
    return sum;
  }, 0);
}

// ── 純函式：比大小玩法的完成獎金計算（compareValue 列對列比對）──

function resolveCompareWinnings(card: ScratchCard): number {
  const [zone0, zone1, zone2] = card.zones;
  if (!zone0 || !zone1 || !zone2) return 0;
  return zone0.cells.reduce((sum, _, row) => {
    const playerVal = zone0.cells[row]?.compareValue;
    const dealerVal = zone1.cells[row]?.compareValue;
    const prize = zone2.cells[row]?.prize;
    if (
      playerVal !== undefined &&
      dealerVal !== undefined &&
      prize &&
      playerVal > dealerVal
    ) {
      return sum + prize.amount;
    }
    return sum;
  }, 0);
}

// ── 純函式：賓果玩法的完成獎金計算（完成線數 × prizePerLine）──

function resolveBingoWinnings(card: ScratchCard, prizePerLine: number): number {
  const [zone0, zone1] = card.zones;
  if (!zone0 || !zone1) return 0;

  const drawnSet = new Set(zone0.cells.map((c) => c.bingoNumber!));
  const gridSize = Math.round(Math.sqrt(zone1.cells.length));
  const matched = zone1.cells.map((c) => drawnSet.has(c.bingoNumber!));

  let lines = 0;
  for (let r = 0; r < gridSize; r++) {
    if (
      Array.from(
        { length: gridSize },
        (_, c) => matched[r * gridSize + c],
      ).every(Boolean)
    )
      lines++;
  }
  for (let c = 0; c < gridSize; c++) {
    if (
      Array.from(
        { length: gridSize },
        (_, r) => matched[r * gridSize + c],
      ).every(Boolean)
    )
      lines++;
  }
  if (
    Array.from({ length: gridSize }, (_, i) => matched[i * gridSize + i]).every(
      Boolean,
    )
  )
    lines++;
  if (
    Array.from(
      { length: gridSize },
      (_, i) => matched[i * gridSize + (gridSize - 1 - i)],
    ).every(Boolean)
  )
    lines++;

  return lines * prizePerLine;
}

// ── 純函式：更新單張卡片（不可變）────────────────────────────

function applyProgressToCard(
  card: ScratchCard,
  cellId: string,
  progress: number,
  mechanic: Mechanic,
  prizePerLine?: number,
): ScratchCard {
  const isRevealed = progress >= REVEAL_THRESHOLD;
  const updatedZones = card.zones.map((zone) => ({
    ...zone,
    cells: zone.cells.map((cell) =>
      cell.id === cellId
        ? { ...cell, scratchProgress: progress, isRevealed }
        : cell,
    ),
  }));

  const allRevealed = updatedZones.every((zone) =>
    zone.cells.every((c) => c.isRevealed),
  );

  let totalWinnings: number;
  if (mechanic === "triple") {
    // 三同：全部揭曉後計算列對列勝負；未完成時維持 0
    totalWinnings = allRevealed
      ? resolveTripleWinnings({ ...card, zones: updatedZones })
      : 0;
  } else if (mechanic === "compare") {
    // 比大小：全部揭曉後依 compareValue 列對列計算；未完成時維持 0
    totalWinnings = allRevealed
      ? resolveCompareWinnings({ ...card, zones: updatedZones })
      : 0;
  } else if (mechanic === "bingo") {
    // 賓果：zone[1] 全部揭曉後計算完成線數；未完成時維持 0
    totalWinnings = allRevealed
      ? resolveBingoWinnings(
          { ...card, zones: updatedZones },
          prizePerLine ?? 0,
        )
      : 0;
  } else {
    // symbol：即時加總已揭曉的中獎格
    totalWinnings = updatedZones
      .flatMap((z) => z.cells)
      .filter((c) => c.isRevealed && c.prize.isWin)
      .reduce((sum, c) => sum + c.prize.amount, 0);
  }

  return {
    ...card,
    zones: updatedZones,
    status: allRevealed ? "completed" : card.status,
    totalWinnings,
  };
}

// ── Store ─────────────────────────────────────────────────

type GameStore = GameState & GameActions & { getInitialState: () => GameState };

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  getInitialState: () => initialState,

  initGame: (config) =>
    set({
      config,
      cards: buildDeck(config),
      selectedCardIds: [],
      phase: "pile",
      effectsEnabled: config.effectsEnabled,
    }),

  selectCard: (cardId) =>
    set((state) => {
      if (state.selectedCardIds.includes(cardId)) return state;
      return {
        selectedCardIds: [...state.selectedCardIds, cardId],
        cards: state.cards.map((c) =>
          c.id === cardId ? { ...c, status: "selected" } : c,
        ),
      };
    }),

  deselectCard: (cardId) =>
    set((state) => ({
      selectedCardIds: state.selectedCardIds.filter((id) => id !== cardId),
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, status: "in-pile" } : c,
      ),
    })),

  startScratching: () =>
    set((state) => ({
      phase: "scratching",
      cards: state.cards.map((c) =>
        state.selectedCardIds.includes(c.id)
          ? { ...c, status: "scratching" }
          : c,
      ),
    })),

  updateCellProgress: (cardId, cellId, progress) =>
    set((state) => {
      const updatedCards = state.cards.map((c) => {
        if (c.id !== cardId) return c;
        const cardTypeConfig = state.config.cardTypes[c.cardTypeIndex];
        const mechanic = cardTypeConfig?.mechanic ?? "symbol";
        const prizePerLine =
          mechanic === "bingo"
            ? (cardTypeConfig?.mechanicOptions as BingoOptions).prizePerLine
            : undefined;
        return applyProgressToCard(c, cellId, progress, mechanic, prizePerLine);
      });
      const allCompleted =
        state.selectedCardIds.length > 0 &&
        state.selectedCardIds.every(
          (id) => updatedCards.find((c) => c.id === id)?.status === "completed",
        );
      return {
        cards: updatedCards,
        phase: allCompleted ? "results" : state.phase,
      };
    }),

  setPhase: (phase) => set({ phase }),

  toggleEffects: () =>
    set((state) => ({ effectsEnabled: !state.effectsEnabled })),
}));
