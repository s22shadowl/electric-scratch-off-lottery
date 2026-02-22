import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useGameStore } from '@/stores/gameStore'
import { encodeConfig } from '@/utils/config-codec'
import PlayPage from './PlayPage'
import type { GameConfig } from '@/types'

const config: GameConfig = {
  sessionTitle: '年終抽獎活動',
  cardCount: 5,
  prizes: [
    { id: 'p1', label: '謝謝', amount: 0,   probability: 0.7, isWin: false },
    { id: 'p2', label: '$100', amount: 100, probability: 0.3, isWin: true  },
  ],
  cellsPerZone: 6,
  themeId: 'wealth-god',
  effectsEnabled: true,
}

const renderWithRoute = (search: string) =>
  render(
    <MemoryRouter initialEntries={[`/play${search}`]}>
      <Routes>
        <Route path="/play" element={<PlayPage />} />
      </Routes>
    </MemoryRouter>
  )

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState())
})

describe('PlayPage', () => {
  it('有效 config 參數時應渲染遊玩頁', async () => {
    const encoded = encodeConfig(config)
    renderWithRoute(`?config=${encoded}`)
    await waitFor(() => {
      expect(screen.getByTestId('play-page')).toBeInTheDocument()
    })
  })

  it('有效 config 時應顯示活動名稱', async () => {
    const encoded = encodeConfig(config)
    renderWithRoute(`?config=${encoded}`)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '年終抽獎活動' })).toBeInTheDocument()
    })
  })

  it('有效 config 時應初始化 store（cards 數量正確）', async () => {
    const encoded = encodeConfig(config)
    renderWithRoute(`?config=${encoded}`)
    await waitFor(() => {
      expect(useGameStore.getState().cards).toHaveLength(config.cardCount)
    })
  })

  it('缺少 config 參數時應顯示錯誤訊息', async () => {
    renderWithRoute('')
    await waitFor(() => {
      expect(screen.getByTestId('play-page-error')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('config 參數無效時應顯示錯誤訊息', async () => {
    renderWithRoute('?config=invalid-garbage')
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
