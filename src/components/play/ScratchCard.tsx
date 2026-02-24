import { useGameStore } from "@/stores/gameStore";
import ScratchCellCanvas from "./ScratchCellCanvas";

interface Props {
  cardId: string;
}

export default function ScratchCard({ cardId }: Props) {
  const card = useGameStore((s) => s.cards.find((c) => c.id === cardId));
  const config = useGameStore((s) => s.config);

  if (!card) return null;

  const cardTypeConfig = config.cardTypes[card.cardTypeIndex];
  const mechanic = cardTypeConfig?.mechanic ?? "symbol";
  const allCells = card.zones.flatMap((z) => z.cells);
  const revealedCount = allCells.filter((c) => c.isRevealed).length;
  const hasWinnings = card.totalWinnings > 0;
  const isCompleted = card.status === "completed";
  const maxPrize = Math.max(
    ...(cardTypeConfig?.prizes.map((p) => p.amount) ?? [0]),
    0,
  );

  return (
    <article
      data-testid={`scratch-card-${cardId}`}
      className="relative bg-gradient-to-br from-red-700 to-red-900 rounded-2xl p-4 shadow-2xl border-2 border-red-600 w-full max-w-sm sm:w-fit"
    >
      {/* 卡片標題 */}
      <header className="text-center mb-3">
        <h2 className="text-yellow-400 font-black text-sm tracking-widest drop-shadow">
          ✦ 電子刮刮樂 ✦
        </h2>
        <p className="text-yellow-300/60 text-[10px] font-mono mt-0.5">
          {card.serialNumber}
        </p>
      </header>

      {/* 刮除格：symbol=flex-wrap，triple=row-first 每列加外框 */}
      {mechanic === "triple" ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: card.zones[0]!.cells.length }, (_, row) => (
            <div
              key={row}
              className="flex gap-2 items-center justify-center rounded-lg border border-yellow-500/30 bg-red-950/40 px-2 py-1.5"
            >
              {card.zones.map((zone) => (
                <ScratchCellCanvas
                  key={zone.cells[row]!.id}
                  cell={zone.cells[row]!}
                  cardId={cardId}
                  maxPrize={maxPrize}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div
          className="flex flex-wrap gap-2 justify-center"
          style={{
            maxWidth: `${Math.ceil(card.zones[0]!.cells.length / 2) * 138}px`,
          }}
        >
          {card.zones[0]!.cells.map((cell) => (
            <ScratchCellCanvas
              key={cell.id}
              cell={cell}
              cardId={cardId}
              maxPrize={maxPrize}
            />
          ))}
        </div>
      )}

      {/* 進度提示 */}
      <footer className="mt-3 text-center">
        {!isCompleted && (
          <p className="text-red-300 text-xs">
            已刮開 {revealedCount} / {allCells.length} 格
          </p>
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
