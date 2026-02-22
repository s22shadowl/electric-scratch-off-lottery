import { describe, it, expect } from 'vitest'
import {
  normalizeProbabilities,
  drawPrize,
  buildCard,
  buildDeck,
} from './lottery'
import type { Prize, GameConfig } from '@/types'

// ── 測試資料 ──────────────────────────────────────────────

const makePrize = (overrides: Partial<Prize> & Pick<Prize, 'id' | 'amount' | 'probability'>): Prize => ({
  label: `$${overrides.amount}`,
  symbolCode: undefined,
  isWin: overrides.amount > 0,
  ...overrides,
})

const prizes: Prize[] = [
  makePrize({ id: 'p1', amount: 0,   probability: 2, label: '謝謝' }),
  makePrize({ id: 'p2', amount: 100, probability: 1 }),
  makePrize({ id: 'p3', amount: 500, probability: 1 }),
]

const config: GameConfig = {
  sessionTitle: '測試活動',
  cardCount: 5,
  prizes,
  cellsPerZone: 6,
  themeId: 'wealth-god',
  effectsEnabled: true,
}

// ── normalizeProbabilities ────────────────────────────────

describe('normalizeProbabilities', () => {
  it('正規化後所有機率總和應等於 1', () => {
    const result = normalizeProbabilities(prizes)
    const sum = result.reduce((acc, p) => acc + p.probability, 0)
    expect(sum).toBeCloseTo(1, 10)
  })

  it('各獎項機率比例應符合輸入的相對權重', () => {
    const result = normalizeProbabilities(prizes)
    // 權重 [2, 1, 1]，正規化後應為 [0.5, 0.25, 0.25]
    expect(result[0]!.probability).toBeCloseTo(0.5)
    expect(result[1]!.probability).toBeCloseTo(0.25)
    expect(result[2]!.probability).toBeCloseTo(0.25)
  })

  it('不應修改原始陣列（不可變）', () => {
    const original = prizes.map(p => p.probability)
    normalizeProbabilities(prizes)
    prizes.forEach((p, i) => {
      expect(p.probability).toBe(original[i])
    })
  })

  it('所有權重相同時，每個機率應相等', () => {
    const equal = [
      makePrize({ id: 'a', amount: 0,   probability: 1, label: '謝謝' }),
      makePrize({ id: 'b', amount: 100, probability: 1 }),
      makePrize({ id: 'c', amount: 200, probability: 1 }),
    ]
    const result = normalizeProbabilities(equal)
    result.forEach(p => expect(p.probability).toBeCloseTo(1 / 3))
  })
})

// ── drawPrize ─────────────────────────────────────────────

describe('drawPrize', () => {
  it('回傳的獎項應來自輸入的獎項池', () => {
    const normalized = normalizeProbabilities(prizes)
    const ids = normalized.map(p => p.id)
    for (let i = 0; i < 50; i++) {
      const drawn = drawPrize(normalized)
      expect(ids).toContain(drawn.id)
    }
  })

  it('機率為 0 的獎項永遠不應被抽中', () => {
    const pool = [
      makePrize({ id: 'never', amount: 9999, probability: 0 }),
      makePrize({ id: 'always', amount: 100, probability: 1 }),
    ]
    // 不需正規化，機率已明確
    for (let i = 0; i < 100; i++) {
      const drawn = drawPrize(pool)
      expect(drawn.id).not.toBe('never')
    }
  })

  it('大量抽樣後，分佈應接近預期機率（容差 ±5%）', () => {
    const normalized = normalizeProbabilities(prizes)
    const counts: Record<string, number> = { p1: 0, p2: 0, p3: 0 }
    const total = 10_000

    for (let i = 0; i < total; i++) {
      const drawn = drawPrize(normalized)
      counts[drawn.id]!++
    }

    expect(counts['p1']! / total).toBeCloseTo(0.5,  1)
    expect(counts['p2']! / total).toBeCloseTo(0.25, 1)
    expect(counts['p3']! / total).toBeCloseTo(0.25, 1)
  })
})

// ── buildCard ─────────────────────────────────────────────

describe('buildCard', () => {
  it('卡片格數應等於 config.cellsPerZone', () => {
    const card = buildCard(config, 'card-1')
    expect(card.zone.cells).toHaveLength(config.cellsPerZone)
  })

  it('每個 cell 初始狀態：scratchProgress 為 0、isRevealed 為 false', () => {
    const card = buildCard(config, 'card-1')
    card.zone.cells.forEach(cell => {
      expect(cell.scratchProgress).toBe(0)
      expect(cell.isRevealed).toBe(false)
    })
  })

  it('卡片初始狀態應為 in-pile，totalWinnings 為 0', () => {
    const card = buildCard(config, 'card-1')
    expect(card.status).toBe('in-pile')
    expect(card.totalWinnings).toBe(0)
  })

  it('每個 cell 的 prize 應來自 config.prizes 的獎項池', () => {
    const card = buildCard(config, 'card-1')
    const prizeIds = config.prizes.map(p => p.id)
    card.zone.cells.forEach(cell => {
      expect(prizeIds).toContain(cell.prize.id)
    })
  })

  it('所有 cell.id 應唯一', () => {
    const card = buildCard(config, 'card-1')
    const ids = card.zone.cells.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ── buildDeck ─────────────────────────────────────────────

describe('buildDeck', () => {
  it('牌堆數量應等於 config.cardCount', () => {
    const deck = buildDeck(config)
    expect(deck).toHaveLength(config.cardCount)
  })

  it('每張卡的 id 應唯一', () => {
    const deck = buildDeck(config)
    const ids = deck.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('每張卡應有完整的 zone 與 cells', () => {
    const deck = buildDeck(config)
    deck.forEach(card => {
      expect(card.zone).toBeDefined()
      expect(card.zone.cells).toHaveLength(config.cellsPerZone)
    })
  })
})
