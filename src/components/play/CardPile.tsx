import { useGameStore } from '@/stores/gameStore'
import CardThumbnail from './CardThumbnail'

// 基於 index 產生確定性散落旋轉角度（-12 ~ +12 度）
function getRotation(index: number): number {
  const seed = ((index * 2654435761) >>> 0) % 1000
  return (seed / 1000) * 24 - 12
}

export default function CardPile() {
  const cards          = useGameStore(s => s.cards)
  const selectedIds    = useGameStore(s => s.selectedCardIds)
  const selectCard     = useGameStore(s => s.selectCard)
  const deselectCard   = useGameStore(s => s.deselectCard)
  const startScratching = useGameStore(s => s.startScratching)

  const selectedCount = selectedIds.length

  const handleToggle = (cardId: string) => {
    if (selectedIds.includes(cardId)) {
      deselectCard(cardId)
    } else {
      selectCard(cardId)
    }
  }

  return (
    <section className="flex flex-col items-center gap-8 py-8 px-4">
      {/* 標題提示 */}
      <div className="text-center">
        <p className="text-yellow-300 text-lg font-bold drop-shadow">
          從牌堆中選擇你的刮刮樂
        </p>
        <p className="text-red-300 text-sm mt-1">點擊卡片選取，可複選</p>
      </div>

      {/* 牌堆 */}
      <div className="flex flex-wrap justify-center gap-4">
        {cards.map((card, index) => (
          <CardThumbnail
            key={card.id}
            card={card}
            isSelected={selectedIds.includes(card.id)}
            onToggle={handleToggle}
            rotationDeg={getRotation(index)}
          />
        ))}
      </div>

      {/* 選牌狀態列 */}
      {selectedCount > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
          <span className="text-yellow-200 text-sm font-medium bg-red-900/80 backdrop-blur px-4 py-2 rounded-full border border-yellow-500/50">
            已選 {selectedCount} 張
          </span>
          <button
            type="button"
            onClick={startScratching}
            className="px-8 py-3 bg-yellow-400 text-red-900 font-black text-lg rounded-full shadow-xl
                       hover:bg-yellow-300 active:scale-95 transition-all
                       border-2 border-yellow-300"
          >
            開始刮！
          </button>
        </div>
      )}
    </section>
  )
}
