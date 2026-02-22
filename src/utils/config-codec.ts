import QRCode from 'qrcode'
import type { GameConfig, Prize } from '@/types'

// ── base64url 編解碼（URL 安全，不含 + / =） ──────────────────

function toBase64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function fromBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  return decodeURIComponent(escape(atob(base64)))
}

// ── 驗證邏輯 ──────────────────────────────────────────────

function isValidPrize(p: unknown): p is Prize {
  if (typeof p !== 'object' || p === null) return false
  const prize = p as Record<string, unknown>
  return (
    typeof prize['id'] === 'string' &&
    typeof prize['label'] === 'string' &&
    typeof prize['amount'] === 'number' &&
    typeof prize['probability'] === 'number' &&
    typeof prize['isWin'] === 'boolean'
  )
}

function validateConfig(raw: unknown): GameConfig {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('config 格式無效')
  }
  const obj = raw as Record<string, unknown>

  if (typeof obj['sessionTitle'] !== 'string' || !obj['sessionTitle']) {
    throw new Error('sessionTitle 為必填字串')
  }
  if (typeof obj['cardCount'] !== 'number' || obj['cardCount'] < 1) {
    throw new Error('cardCount 必須為正整數')
  }
  if (!Array.isArray(obj['prizes']) || obj['prizes'].length === 0) {
    throw new Error('prizes 不得為空陣列')
  }
  if (!(obj['prizes'] as unknown[]).every(isValidPrize)) {
    throw new Error('prizes 內含無效獎項')
  }
  if (typeof obj['cellsPerZone'] !== 'number' || obj['cellsPerZone'] < 1) {
    throw new Error('cellsPerZone 必須為正整數')
  }
  if (typeof obj['themeId'] !== 'string') {
    throw new Error('themeId 為必填字串')
  }
  if (typeof obj['effectsEnabled'] !== 'boolean') {
    throw new Error('effectsEnabled 必須為布林值')
  }

  return obj as unknown as GameConfig
}

// ── 公開 API ──────────────────────────────────────────────

export function encodeConfig(config: GameConfig): string {
  return toBase64Url(JSON.stringify(config))
}

export function decodeConfig(encoded: string): GameConfig {
  if (!encoded) throw new Error('encoded 字串不得為空')
  let json: string
  try {
    json = fromBase64Url(encoded)
  } catch {
    throw new Error('base64 解碼失敗：字串格式無效')
  }
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new Error('JSON 解析失敗')
  }
  return validateConfig(raw)
}

export function buildPlayUrl(config: GameConfig, baseUrl: string): string {
  const url = new URL('/play', baseUrl)
  url.searchParams.set('config', encodeConfig(config))
  return url.toString()
}

export async function generateQRCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, { errorCorrectionLevel: 'M', width: 300 })
}
