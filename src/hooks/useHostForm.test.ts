import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { draftToConfig, useHostForm } from './useHostForm'
import type { HostFormState } from './useHostForm'

// ── 測試資料 ──────────────────────────────────────────────

const validForm: HostFormState = {
  sessionTitle: '年終抽獎',
  prizes: [
    { uid: 'a', label: '謝謝', amount: '0',   weight: '60' },
    { uid: 'b', label: '$100', amount: '100', weight: '30' },
    { uid: 'c', label: '$500', amount: '500', weight: '10' },
  ],
  cardCount: '10',
  cellsPerZone: '6',
  effectsEnabled: true,
}

// ── draftToConfig ─────────────────────────────────────────

describe('draftToConfig', () => {
  it('合法表單應回傳 GameConfig', () => {
    const config = draftToConfig(validForm)
    expect(config).not.toBeNull()
    expect(config?.sessionTitle).toBe('年終抽獎')
    expect(config?.cardCount).toBe(10)
    expect(config?.cellsPerZone).toBe(6)
    expect(config?.prizes).toHaveLength(3)
  })

  it('sessionTitle 為空應回傳 null', () => {
    expect(draftToConfig({ ...validForm, sessionTitle: '' })).toBeNull()
  })

  it('cardCount 為 0 應回傳 null', () => {
    expect(draftToConfig({ ...validForm, cardCount: '0' })).toBeNull()
  })

  it('cellsPerZone 超過 9 應回傳 null', () => {
    expect(draftToConfig({ ...validForm, cellsPerZone: '10' })).toBeNull()
  })

  it('所有 prizes 過濾後為空應回傳 null', () => {
    const form: HostFormState = {
      ...validForm,
      prizes: [{ uid: 'x', label: '', amount: '0', weight: '0' }],
    }
    expect(draftToConfig(form)).toBeNull()
  })

  it('weight 為 0 的獎項應被過濾掉', () => {
    const form: HostFormState = {
      ...validForm,
      prizes: [
        { uid: 'a', label: '謝謝', amount: '0',   weight: '0' },  // 過濾
        { uid: 'b', label: '$100', amount: '100', weight: '30' },
      ],
    }
    const config = draftToConfig(form)
    expect(config?.prizes).toHaveLength(1)
    expect(config?.prizes[0]?.label).toBe('$100')
  })

  it('amount > 0 的獎項 isWin 應為 true', () => {
    const config = draftToConfig(validForm)
    const winPrize = config?.prizes.find(p => p.amount > 0)
    expect(winPrize?.isWin).toBe(true)
  })

  it('amount 為 0 的獎項 isWin 應為 false', () => {
    const config = draftToConfig(validForm)
    const losePrize = config?.prizes.find(p => p.amount === 0)
    expect(losePrize?.isWin).toBe(false)
  })
})

// ── useHostForm hook ──────────────────────────────────────

describe('useHostForm', () => {
  const BASE = 'https://example.com'

  it('初始狀態應有預設獎項', () => {
    const { result } = renderHook(() => useHostForm(BASE))
    expect(result.current.form.prizes.length).toBeGreaterThan(0)
  })

  it('setTitle 應更新 sessionTitle', () => {
    const { result } = renderHook(() => useHostForm(BASE))
    act(() => result.current.setTitle('新活動'))
    expect(result.current.form.sessionTitle).toBe('新活動')
  })

  it('addPrize 應新增一個獎項', () => {
    const { result } = renderHook(() => useHostForm(BASE))
    const before = result.current.form.prizes.length
    act(() => result.current.addPrize())
    expect(result.current.form.prizes.length).toBe(before + 1)
  })

  it('removePrize 應移除對應獎項', () => {
    const { result } = renderHook(() => useHostForm(BASE))
    const uid = result.current.form.prizes[0]!.uid
    const before = result.current.form.prizes.length
    act(() => result.current.removePrize(uid))
    expect(result.current.form.prizes.length).toBe(before - 1)
    expect(result.current.form.prizes.find(p => p.uid === uid)).toBeUndefined()
  })

  it('updatePrize 應更新指定欄位', () => {
    const { result } = renderHook(() => useHostForm(BASE))
    const uid = result.current.form.prizes[0]!.uid
    act(() => result.current.updatePrize(uid, 'label', '大獎'))
    expect(result.current.form.prizes.find(p => p.uid === uid)?.label).toBe('大獎')
  })

  it('toggleEffects 應切換 effectsEnabled', () => {
    const { result } = renderHook(() => useHostForm(BASE))
    const before = result.current.form.effectsEnabled
    act(() => result.current.toggleEffects())
    expect(result.current.form.effectsEnabled).toBe(!before)
  })

  it('表單合法時 isValid 應為 true', async () => {
    const { result } = renderHook(() => useHostForm(BASE))
    act(() => result.current.setTitle('測試活動'))
    expect(result.current.isValid).toBe(true)
  })
})
