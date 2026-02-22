import { useGameStore } from '@/stores/gameStore'
import ScratchCellCanvas from './ScratchCellCanvas'

interface Props {
  cardId: string
}

export default function ScratchCard({ cardId }: Props) {
  const card = useGameStore(s => s.cards.find(c => c.id === cardId))

  if (!card) return null

  const { cells } = card.zone
  const revealedCount  = cells.filter(c => c.isRevealed).length
  const hasWinnings    = card.totalWinnings > 0
  const isCompleted    = card.status === 'completed'

  return (
    <article
      data-testid={`scratch-card-${cardId}`}
      className="relative bg-gradient-to-br from-red-700 to-red-900 rounded-2xl p-4 shadow-2xl border-2 border-red-600 w-fit"
    >
      {/* 卡片標題 */}
      <header className="text-center mb-3">
        <h2 className="text-yellow-400 font-black text-sm tracking-widest drop-shadow">
          ✦ 電子刮刮樂 ✦
        </h2>
      </header>

      {/* 刮除格網格 */}
      <div
        className="flex flex-wrap gap-2 justify-center"
        style={{ maxWidth: `${Math.ceil(cells.length / 2) * 122}px` }}
      >
        {cells.map(cell => (
          <ScratchCellCanvas
            key={cell.id}
            cell={cell}
            cardId={cardId}
          />
        ))}
      </div>

      {/* 進度提示 */}
      <footer className="mt-3 text-center">
        {!isCompleted && (
          <p className="text-red-300 text-xs">
            已刮開 {revealedCount} / {cells.length} 格
          </p>
        )}

        {/* 中獎金額 */}
        {isCompleted && (
          <div
            data-testid="card-result"
            className={[
              'py-2 px-4 rounded-xl font-black text-sm',
              hasWinnings
                ? 'bg-yellow-400 text-red-900'
                : 'bg-red-900 text-red-400',
            ].join(' ')}
          >
            {hasWinnings
              ? `🎉 恭喜中獎 $${card.totalWinnings} 元！`
              : '謝謝參與'}
          </div>
        )}
      </footer>
    </article>
  )
}
