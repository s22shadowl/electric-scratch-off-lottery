import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useGameStore } from '@/stores/gameStore'
import CardPile from './CardPile'
import type { GameConfig } from '@/types'

const config: GameConfig = {
  sessionTitle: '測試活動',
  cardTypes: [
    {
      mechanic: 'symbol',
      prizes: [
        { id: 'p1', label: '謝謝', amount: 0,   probability: 0.7, isWin: false },
        { id: 'p2', label: '$100', amount: 100, probability: 0.3, isWin: true  },
      ],
      count: 4,
      themeId: 'wealth-god',
      difficultyPreset: 'standard',
      mechanicOptions: { cellsPerZone: 3 },
    },
  ],
  effectsEnabled: true,
}

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState())
  useGameStore.getState().initGame(config)
})

describe('CardPile', () => {
  it('應渲染所有卡片', () => {
    render(<CardPile />)
    expect(screen.getAllByRole('button')).toHaveLength(config.cardTypes[0]!.count)
  })

  it('點擊卡片應選取該卡', async () => {
    render(<CardPile />)
    const buttons = screen.getAllByRole('button', { name: /刮刮樂/ })
    await userEvent.click(buttons[0]!)
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
  })

  it('再次點擊已選取的卡片應取消選取', async () => {
    render(<CardPile />)
    const btn = screen.getAllByRole('button', { name: /刮刮樂/ })[0]!
    await userEvent.click(btn)
    await userEvent.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('未選任何卡片時不應顯示「開始刮」按鈕', () => {
    render(<CardPile />)
    expect(screen.queryByRole('button', { name: /開始刮/ })).not.toBeInTheDocument()
  })

  it('選取卡片後應顯示「開始刮」按鈕', async () => {
    render(<CardPile />)
    await userEvent.click(screen.getAllByRole('button', { name: /刮刮樂/ })[0]!)
    expect(screen.getByRole('button', { name: /開始刮/ })).toBeInTheDocument()
  })

  it('應顯示目前選取數量', async () => {
    render(<CardPile />)
    await userEvent.click(screen.getAllByRole('button', { name: /刮刮樂/ })[0]!)
    await userEvent.click(screen.getAllByRole('button', { name: /刮刮樂/ })[1]!)
    expect(screen.getByText(/已選 2 張/)).toBeInTheDocument()
  })

  it('點擊「開始刮」後 phase 應切換為 scratching', async () => {
    render(<CardPile />)
    await userEvent.click(screen.getAllByRole('button', { name: /刮刮樂/ })[0]!)
    await userEvent.click(screen.getByRole('button', { name: /開始刮/ }))
    expect(useGameStore.getState().phase).toBe('scratching')
  })
})
