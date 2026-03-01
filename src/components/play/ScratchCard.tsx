import { useGameStore } from "@/stores/gameStore";
import { getThemeLayout } from "@/themes";

const ruleText: Record<string, string> = {
  symbol: "▼ 刮出相同符號即中獎",
  triple: "▼ 三格相同即中獎",
  compare: "▼ 你的號碼大於莊家即中該行獎金",
  bingo: "▼ 連線數 × 每線獎金",
};

interface Props {
  cardId: string;
}

export default function ScratchCard({ cardId }: Props) {
  const card = useGameStore((s) => s.cards.find((c) => c.id === cardId));
  const config = useGameStore((s) => s.config);
  const revealCard = useGameStore((s) => s.revealCard);

  if (!card) return null;

  const cardTypeConfig = config.cardTypes[card.cardTypeIndex];
  const mechanic = cardTypeConfig?.mechanic ?? "symbol";
  const hasWinnings = card.totalWinnings > 0;
  const isCompleted = card.status === "completed";
  const maxPrize = Math.max(
    ...(cardTypeConfig?.prizes.map((p) => p.amount) ?? [0]),
    0,
  );

  const Layout = getThemeLayout(cardTypeConfig.themeId, mechanic);

  return (
    <article
      data-testid={`scratch-card-${cardId}`}
      className={`relative bg-gradient-to-br from-red-700 to-red-900 rounded-2xl p-2 shadow-2xl border-2 border-yellow-500/70 card-emboss w-full sm:w-fit ${mechanic === "bingo" ? "max-w-xs" : "max-w-sm"}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.04) 10px, rgba(255,255,255,0.04) 12px)",
      }}
    >
      {/* 卡片標題 */}
      <header className="flex justify-between items-center mb-3 gap-2">
        <span className="text-yellow-300/80 text-[10px] font-mono shrink-0">
          NT${cardTypeConfig?.ticketPrice.toLocaleString() ?? "—"}
        </span>
        <h2 className="text-yellow-400 font-black text-sm tracking-widest drop-shadow font-serif text-center">
          ✦ {config.sessionTitle} ✦
        </h2>
        <span className="text-yellow-300/60 text-[10px] font-mono shrink-0">
          {card.serialNumber}
        </span>
      </header>

      {/* 玩法區域（由 theme layout 負責） */}
      <Layout
        card={card}
        cardTypeConfig={cardTypeConfig}
        config={config}
        maxPrize={maxPrize}
      />

      {/* 規則提示 */}
      <p className="text-yellow-400/60 text-[10px] text-center mt-2 tracking-wide">
        {ruleText[mechanic]}
      </p>

      <footer className="mt-2 text-center">
        {!isCompleted && (
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => revealCard(cardId)}
              className="px-4 py-1.5 rounded-lg bg-yellow-400 text-red-900 text-xs font-bold hover:bg-yellow-300 transition-colors"
            >
              ⚡ 一鍵刮開
            </button>
          </div>
        )}

        {/* 中獎金額 */}
        {isCompleted && (
          <div
            data-testid="card-result"
            className={[
              "py-2 px-4 rounded-xl font-black text-sm",
              hasWinnings
                ? "bg-yellow-400 text-red-900"
                : "bg-red-900 text-red-400",
            ].join(" ")}
          >
            {hasWinnings
              ? `🎉 恭喜中獎 $${card.totalWinnings} 元！`
              : "謝謝參與"}
          </div>
        )}
      </footer>
    </article>
  );
}
