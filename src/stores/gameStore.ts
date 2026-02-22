import { create } from 'zustand'
import type { GameConfig, GameState, GamePhase, ScratchCard } from '@/types'
import { buildDeck } from '@/utils/lottery'

// 刮除覆蓋比例達此門檻後自動揭曉格子
export const REVEAL_THRESHOLD = 0.7

// ── Store 動作介面 ─────────────────────────────────────────

interface GameActions {
  initGame: (config: GameConfig) => void
  selectCard: (cardId: string) => void
  deselectCard: (cardId: string) => void
  startScratching: () => void
  updateCellProgress: (cardId: string, cellId: string, progress: number) => void
  setPhase: (phase: GamePhase) => void
  toggleEffects: () => void
}

// ── 初始狀態 ──────────────────────────────────────────────

const initialState: GameState = {
  config: {
    sessionTitle: '',
    cardCount: 0,
    prizes: [],
    cellsPerZone: 6,
    themeId: 'wealth-god',
    effectsEnabled: true,
  },
  cards: [],
  selectedCardIds: [],
  phase: 'pile',
  effectsEnabled: true,
}

// ── 純函式：更新單張卡片（不可變）────────────────────────────

function applyProgressToCard(card: ScratchCard, cellId: string, progress: number): ScratchCard {
  const updatedCells = card.zone.cells.map(cell => {
    if (cell.id !== cellId) return cell
    const isRevealed = progress >= REVEAL_THRESHOLD
    return { ...cell, scratchProgress: progress, isRevealed }
  })

  const allRevealed = updatedCells.every(c => c.isRevealed)
  const totalWinnings = updatedCells
    .filter(c => c.isRevealed && c.prize.isWin)
    .reduce((sum, c) => sum + c.prize.amount, 0)

  return {
    ...card,
    zone: { ...card.zone, cells: updatedCells },
    status: allRevealed ? 'completed' : card.status,
    totalWinnings,
  }
}

// ── Store ─────────────────────────────────────────────────

type GameStore = GameState & GameActions & { getInitialState: () => GameState }

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  getInitialState: () => initialState,

  initGame: (config) => set({
    config,
    cards: buildDeck(config),
    selectedCardIds: [],
    phase: 'pile',
    effectsEnabled: config.effectsEnabled,
  }),

  selectCard: (cardId) => set((state) => {
    if (state.selectedCardIds.includes(cardId)) return state
    return {
      selectedCardIds: [...state.selectedCardIds, cardId],
      cards: state.cards.map(c =>
        c.id === cardId ? { ...c, status: 'selected' } : c
      ),
    }
  }),

  deselectCard: (cardId) => set((state) => ({
    selectedCardIds: state.selectedCardIds.filter(id => id !== cardId),
    cards: state.cards.map(c =>
      c.id === cardId ? { ...c, status: 'in-pile' } : c
    ),
  })),

  startScratching: () => set((state) => ({
    phase: 'scratching',
    cards: state.cards.map(c =>
      state.selectedCardIds.includes(c.id) ? { ...c, status: 'scratching' } : c
    ),
  })),

  updateCellProgress: (cardId, cellId, progress) => set((state) => ({
    cards: state.cards.map(c =>
      c.id === cardId ? applyProgressToCard(c, cellId, progress) : c
    ),
  })),

  setPhase: (phase) => set({ phase }),

  toggleEffects: () => set((state) => ({ effectsEnabled: !state.effectsEnabled })),
}))
