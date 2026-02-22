import { describe, it, expect } from 'vitest'
import { encodeConfig, decodeConfig, buildPlayUrl, generateQRCode } from './config-codec'
import type { GameConfig } from '@/types'

// ── 測試資料 ──────────────────────────────────────────────

const config: GameConfig = {
  sessionTitle: '年終抽獎',
  cardCount: 10,
  prizes: [
    { id: 'p1', label: '謝謝', amount: 0,   probability: 0.6, isWin: false },
    { id: 'p2', label: '$100', amount: 100, probability: 0.3, isWin: true  },
    { id: 'p3', label: '$500', amount: 500, probability: 0.1, isWin: true  },
  ],
  cellsPerZone: 6,
  themeId: 'wealth-god',
  effectsEnabled: true,
}

const BASE_URL = 'https://example.com'

// ── encodeConfig ──────────────────────────────────────────

describe('encodeConfig', () => {
  it('應回傳非空字串', () => {
    expect(encodeConfig(config)).toBeTruthy()
  })

  it('編碼結果應只包含 URL 安全字元（base64url）', () => {
    const encoded = encodeConfig(config)
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+=*$/)
  })

  it('同一份 config 多次編碼應得相同結果（確定性）', () => {
    expect(encodeConfig(config)).toBe(encodeConfig(config))
  })
})

// ── decodeConfig ──────────────────────────────────────────

describe('decodeConfig', () => {
  it('encode → decode 應還原原始 config（round-trip）', () => {
    const encoded = encodeConfig(config)
    const decoded = decodeConfig(encoded)
    expect(decoded).toEqual(config)
  })

  it('傳入空字串應拋出錯誤', () => {
    expect(() => decodeConfig('')).toThrow()
  })

  it('傳入非 base64 字串應拋出錯誤', () => {
    expect(() => decodeConfig('!!!not-valid!!!')).toThrow()
  })

  it('傳入結構不符的 JSON 應拋出錯誤（缺少 sessionTitle）', () => {
    const broken = encodeConfig({ ...config, sessionTitle: undefined as unknown as string })
    expect(() => decodeConfig(broken)).toThrow(/sessionTitle/)
  })

  it('prizes 為空陣列應拋出錯誤', () => {
    const broken = encodeConfig({ ...config, prizes: [] })
    expect(() => decodeConfig(broken)).toThrow(/prizes/)
  })

  it('cardCount 為 0 應拋出錯誤', () => {
    const broken = encodeConfig({ ...config, cardCount: 0 })
    expect(() => decodeConfig(broken)).toThrow(/cardCount/)
  })

  it('cellsPerZone 小於 1 應拋出錯誤', () => {
    const broken = encodeConfig({ ...config, cellsPerZone: 0 })
    expect(() => decodeConfig(broken)).toThrow(/cellsPerZone/)
  })
})

// ── buildPlayUrl ──────────────────────────────────────────

describe('buildPlayUrl', () => {
  it('應回傳包含 base URL 的字串', () => {
    const url = buildPlayUrl(config, BASE_URL)
    expect(url).toContain(BASE_URL)
  })

  it('URL 應包含 config query 參數', () => {
    const url = buildPlayUrl(config, BASE_URL)
    expect(url).toContain('config=')
  })

  it('從 URL 解析出的 config 應等於原始 config（end-to-end）', () => {
    const url = buildPlayUrl(config, BASE_URL)
    const { searchParams } = new URL(url)
    const encoded = searchParams.get('config')!
    expect(decodeConfig(encoded)).toEqual(config)
  })

  it('不同 config 應產生不同 URL', () => {
    const url1 = buildPlayUrl(config, BASE_URL)
    const url2 = buildPlayUrl({ ...config, sessionTitle: '其他活動' }, BASE_URL)
    expect(url1).not.toBe(url2)
  })
})

// ── generateQRCode ────────────────────────────────────────

describe('generateQRCode', () => {
  it('應回傳 data URL 字串（以 data:image 開頭）', async () => {
    const url = buildPlayUrl(config, BASE_URL)
    const qr = await generateQRCode(url)
    expect(qr).toMatch(/^data:image\//)
  })

  it('不同 URL 應產生不同 QR Code', async () => {
    const url1 = buildPlayUrl(config, BASE_URL)
    const url2 = buildPlayUrl({ ...config, sessionTitle: '其他活動' }, BASE_URL)
    const [qr1, qr2] = await Promise.all([generateQRCode(url1), generateQRCode(url2)])
    expect(qr1).not.toBe(qr2)
  })
})
