import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import CardThumbnail from "./CardThumbnail";
import PrizePoolModal from "@/components/common/PrizePoolModal";
import RulesModal from "@/components/common/RulesModal";
import caishenUrl from "@/assets/mascot/caishen.png";

export default function CardPile() {
  const cards = useGameStore((s) => s.cards);
  const selectedIds = useGameStore((s) => s.selectedCardIds);
  const selectCard = useGameStore((s) => s.selectCard);
  const deselectCard = useGameStore((s) => s.deselectCard);
  const startScratching = useGameStore((s) => s.startScratching);
  const config = useGameStore((s) => s.config);

  const [showPrizePool, setShowPrizePool] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const selectedCount = selectedIds.length;

  const handleToggle = (cardId: string) => {
    if (selectedIds.includes(cardId)) {
      deselectCard(cardId);
    } else {
      selectCard(cardId);
    }
  };

  return (
    <section className="flex flex-col items-center gap-8 py-8 px-4">
      {/* 標題提示 */}
      <div className="text-center">
        <img
          src={caishenUrl}
          alt="財神"
          width={80}
          height={80}
          className="mx-auto mb-2 drop-shadow-lg"
        />
        <p className="text-yellow-300 text-lg font-bold drop-shadow">
          從牌堆中選擇你的刮刮樂
        </p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <p className="text-red-300 text-sm">點擊卡片選取，可複選</p>
          <button
            type="button"
            aria-label="查看獎池"
            onClick={() => setShowPrizePool(true)}
            className="text-red-300 hover:text-yellow-300 transition-colors text-base leading-none"
          >
            ⓘ
          </button>
          <button
            type="button"
            aria-label="玩法說明"
            onClick={() => setShowRules(true)}
            className="text-red-300 hover:text-yellow-300 transition-colors text-sm"
          >
            ？玩法說明
          </button>
        </div>
      </div>

      {showPrizePool && (
        <PrizePoolModal
          cardTypes={config.cardTypes}
          onClose={() => setShowPrizePool(false)}
        />
      )}

      {showRules && (
        <RulesModal
          cardTypes={config.cardTypes}
          onClose={() => setShowRules(false)}
        />
      )}

      {/* 牌堆 */}
      <div className="flex flex-wrap justify-center gap-4">
        {cards.map((card) => (
          <CardThumbnail
            key={card.id}
            card={card}
            isSelected={selectedIds.includes(card.id)}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {/* 選牌狀態列 */}
      {selectedCount > 0 && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
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
  );
}
