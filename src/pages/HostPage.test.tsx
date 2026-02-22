import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HostPage from './HostPage'

describe('HostPage', () => {
  it('應渲染主持人設定頁', () => {
    render(<MemoryRouter><HostPage /></MemoryRouter>)
    expect(screen.getByTestId('host-page')).toBeInTheDocument()
  })

  it('應包含頁面標題', () => {
    render(<MemoryRouter><HostPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: '主持人設定' })).toBeInTheDocument()
  })
})
