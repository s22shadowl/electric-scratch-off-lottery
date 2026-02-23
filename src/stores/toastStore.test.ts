import { describe, it, expect, beforeEach } from 'vitest'
import { useToastStore } from './toastStore'

describe('toastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ message: null, type: 'info' })
  })

  it('初始狀態 message 應為 null', () => {
    expect(useToastStore.getState().message).toBeNull()
  })

  it('showToast 應設定 message 和 type', () => {
    useToastStore.getState().showToast('截圖失敗', 'error')
    expect(useToastStore.getState().message).toBe('截圖失敗')
    expect(useToastStore.getState().type).toBe('error')
  })

  it('showToast 預設 type 為 info', () => {
    useToastStore.getState().showToast('通知')
    expect(useToastStore.getState().type).toBe('info')
  })

  it('clearToast 應清除 message', () => {
    useToastStore.getState().showToast('測試')
    useToastStore.getState().clearToast()
    expect(useToastStore.getState().message).toBeNull()
  })
})
