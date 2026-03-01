import type { ScratchCard } from "@/types"
import caishenUrl from "@/assets/mascot/caishen.png"
import cloudTileUrl from "@/assets/decorations/cloud-tile.png"

interface Props {
  card: ScratchCard
  isSelected: boolean
  onToggle: (cardId: string) => void
}

export default function CardThumbnail({ card, isSelected, onToggle }: Props) {
  const isDisabled = card.status === "completed" || card.status === "scratching"

  const handleClick = () => {
    if (!isDisabled) onToggle(card.id)
  }

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-label="刮刮樂卡片"
      onClick={handleClick}
      disabled={isDisabled}
      className={[
        "relative w-40 h-24 rounded-xl transition-all duration-200 cursor-pointer select-none",
        "bg-gradient-to-br from-red-600 to-red-800",
        "border-2 card-emboss",
        isSelected
          ? "border-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.7)] scale-105 -translate-y-2"
          : "border-red-500 hover:border-yellow-300 hover:scale-102 hover:-translate-y-1",
        isDisabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {/* 祥雲紋路 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          backgroundImage: `url(${cloudTileUrl})`,
          backgroundRepeat: "repeat",
          backgroundSize: "64px 64px",
          // mixBlendMode: "multiply",
          opacity: 0.9,
        }}
      />
      {/* 閃光裝飾 */}
      <span className="absolute top-1.5 left-2 text-yellow-300 text-xs opacity-70">
        ✦
      </span>
      <span className="absolute top-1.5 right-2 text-yellow-300 text-xs opacity-70">
        ✦
      </span>

      {/* 財神圖示 */}
      <div className="flex flex-col items-center justify-center h-full gap-0.5">
        <img
          src={caishenUrl}
          alt=""
          aria-hidden={true}
          width={40}
          height={40}
          className="object-contain"
        />
        <span className="text-yellow-300 text-xs font-bold tracking-widest drop-shadow">
          刮刮樂
        </span>
        <span className="text-yellow-200/70 text-[10px] font-mono tracking-wider">
          {card.serialNumber}
        </span>
      </div>

      {/* 選取光暈遮罩 */}
      {isSelected && (
        <div className="absolute inset-0 rounded-xl bg-yellow-400/10 pointer-events-none" />
      )}
    </button>
  )
}
