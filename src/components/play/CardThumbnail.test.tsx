import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CardThumbnail from './CardThumbnail'
import type { ScratchCard } from '@/types'

const makeCard = (status: ScratchCard['status'] = 'in-pile'): ScratchCard => ({
  id: 'card-1',
  zone: {
    id: 'card-1-zone',
    shapeVariant: 'single',
    cells: [],
  },
  status,
  totalWinnings: 0,
})

describe('CardThumbnail', () => {
  it('應渲染卡片元素', () => {
    render(<CardThumbnail card={makeCard()} isSelected={false} onToggle={vi.fn()} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('未選取時 aria-pressed 應為 false', () => {
    render(<CardThumbnail card={makeCard()} isSelected={false} onToggle={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('已選取時 aria-pressed 應為 true', () => {
    render(<CardThumbnail card={makeCard()} isSelected={true} onToggle={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('點擊應呼叫 onToggle 並傳入 card.id', async () => {
    const onToggle = vi.fn()
    render(<CardThumbnail card={makeCard()} isSelected={false} onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledWith('card-1')
  })

  it('completed 狀態的卡片應不可點擊', async () => {
    const onToggle = vi.fn()
    render(<CardThumbnail card={makeCard('completed')} isSelected={false} onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onToggle).not.toHaveBeenCalled()
  })
})
