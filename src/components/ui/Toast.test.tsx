import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import Toast from './Toast'
import { useToastStore } from '@/stores/toastStore'

describe('Toast', () => {
  beforeEach(() => {
    useToastStore.setState({ message: null, type: 'info' })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('無 message 時不應渲染', () => {
    render(<Toast />)
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument()
  })

  it('有 message 時應渲染通知', () => {
    useToastStore.setState({ message: '截圖失敗，請再試一次', type: 'error' })
    render(<Toast />)
    expect(screen.getByTestId('toast')).toBeInTheDocument()
    expect(screen.getByText('截圖失敗，請再試一次')).toBeInTheDocument()
  })

  it('error type 應套用紅色樣式', () => {
    useToastStore.setState({ message: '錯誤', type: 'error' })
    render(<Toast />)
    expect(screen.getByTestId('toast').className).toContain('bg-red-900')
  })

  it('success type 應套用綠色樣式', () => {
    useToastStore.setState({ message: '成功', type: 'success' })
    render(<Toast />)
    expect(screen.getByTestId('toast').className).toContain('bg-green-900')
  })

  it('3 秒後應自動清除', () => {
    useToastStore.setState({ message: '截圖失敗，請再試一次', type: 'error' })
    render(<Toast />)
    expect(screen.getByTestId('toast')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(3000) })
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument()
  })

  it('role=alert 應存在（無障礙）', () => {
    useToastStore.setState({ message: '訊息', type: 'info' })
    render(<Toast />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
