import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { decodeConfig } from '@/utils/config-codec'
import { useGameStore } from '@/stores/gameStore'
import type { GameConfig } from '@/types'

export default function PlayPage() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<GameConfig | null>(null)
  const initGame = useGameStore(s => s.initGame)

  useEffect(() => {
    const encoded = searchParams.get('config')
    if (!encoded) {
      setError('缺少遊戲設定，請透過主持人提供的連結進入。')
      return
    }
    try {
      const decoded = decodeConfig(encoded)
      setConfig(decoded)
      initGame(decoded)
    } catch (e) {
      setError(`設定解析失敗：${e instanceof Error ? e.message : '未知錯誤'}`)
    }
  }, [searchParams, initGame])

  if (error) {
    return (
      <main data-testid="play-page-error">
        <p role="alert">{error}</p>
      </main>
    )
  }

  if (!config) return null

  return (
    <main data-testid="play-page">
      <h1>{config.sessionTitle}</h1>
    </main>
  )
}
