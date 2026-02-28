import { useGameStore } from "@/stores/gameStore";
import ScratchCellCanvas from "./ScratchCellCanvas";
import BingoCellCanvas from "./BingoCellCanvas";
import cloudTileUrl from "@/assets/decorations/cloud-tile.png";
import type { BingoOptions } from "@/types";

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

  // bingo：進度計算 zone[0] + zone[1] 全部格（兩個 zone 都需刮開）
  const scratchCells =
    mechanic === "bingo"
      ? [...(card.zones[0]?.cells ?? []), ...(card.zones[1]?.cells ?? [])]
      : (card.zones[0]?.cells ?? []);
  const revealedCount = scratchCells.filter((c) => c.isRevealed).length;
  const totalCount = scratchCells.length;

  return (
    <article
      data-testid={`scratch-card-${cardId}`}
      className={`relative bg-gradient-to-br from-red-700 to-red-900 rounded-2xl p-4 shadow-2xl border-2 border-yellow-500/70 card-emboss w-full sm:w-fit ${mechanic === "bingo" ? "max-w-xs" : "max-w-sm"}`}
    >
      {/* 祥雲紋路 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          backgroundImage: `url(${cloudTileUrl})`,
          backgroundRepeat: "repeat",
          backgroundSize: "64px 64px",
          mixBlendMode: "multiply",
          opacity: 0.35,
        }}
      />
      {/* 卡片標題 */}
      <header className="text-center mb-3">
        <h2 className="text-yellow-400 font-black text-sm tracking-widest drop-shadow font-serif">
          ✦ 電子刮刮樂 ✦
        </h2>
        <p className="text-yellow-300/60 text-[10px] font-mono mt-0.5">
          {card.serialNumber}
        </p>
      </header>

      {/* 刮除格：bingo=開獎區+格子 / triple/compare=row-first / symbol=flex-wrap */}
      {mechanic === "bingo" ? (
        (() => {
          const opts = cardTypeConfig?.mechanicOptions as
            | BingoOptions
            | undefined;
          const gridSize = opts?.gridSize ?? 3;
          const cellSize =
            ({ 3: 64, 4: 52, 5: 44, 6: 36 } as Record<number, number>)[
              gridSize
            ] ?? 48;
          // 只含已揭曉的 zone[0] 格（D1：刮開後即時更新 drawnSet）
          const drawnSet = new Set(
            card.zones[0]?.cells
              .filter((c) => c.isRevealed)
              .map((c) => c.bingoNumber!) ?? [],
          );
          return (
            <div className="flex flex-col gap-3">
              {/* zone[0]：開獎號碼（scratch-off，逐格刮開） */}
              <div>
                <p className="text-yellow-400/70 text-[10px] text-center mb-1 tracking-widest">
                  開獎號碼
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {card.zones[0]?.cells.map((cell) => (
                    <BingoCellCanvas
                      key={cell.id}
                      cell={cell}
                      cardId={cardId}
                      isMatched={cell.isRevealed}
                      size={36}
                    />
                  ))}
                </div>
              </div>
              {/* zone[1]：賓果格 */}
              <div
                className="grid gap-1.5 justify-center"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                }}
              >
                {card.zones[1]?.cells.map((cell) => (
                  <BingoCellCanvas
                    key={cell.id}
                    cell={cell}
                    cardId={cardId}
                    isMatched={drawnSet.has(cell.bingoNumber!)}
                    size={cellSize}
                  />
                ))}
              </div>
            </div>
          );
        })()
      ) : mechanic === "triple" ? (
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
      ) : mechanic === "compare" ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: card.zones[0]!.cells.length }, (_, row) => (
            <div
              key={row}
              className="flex gap-1.5 items-center justify-center rounded-lg border border-yellow-500/30 bg-red-950/40 px-2 py-1.5"
            >
              {/* 你的 */}
              <ScratchCellCanvas
                cell={card.zones[0]!.cells[row]!}
                cardId={cardId}
                maxPrize={maxPrize}
              />
              {/* VS */}
              <span className="text-yellow-400/70 font-black text-xs shrink-0">
                VS
              </span>
              {/* 莊家 */}
              <ScratchCellCanvas
                cell={card.zones[1]!.cells[row]!}
                cardId={cardId}
                maxPrize={maxPrize}
              />
              {/* 獎金 */}
              <ScratchCellCanvas
                cell={card.zones[2]!.cells[row]!}
                cardId={cardId}
                maxPrize={maxPrize}
              />
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
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-red-300 text-xs">
              已刮開 {revealedCount} / {totalCount} 格
            </p>
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
