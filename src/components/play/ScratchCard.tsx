import { useGameStore } from "@/stores/gameStore";
import ScratchCellCanvas from "./ScratchCellCanvas";
import BingoCellCanvas from "./BingoCellCanvas";
import cloudTileUrl from "@/assets/decorations/cloud-tile.png";
import caishenUrl from "@/assets/mascot/caishen.png";
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

  const ruleText: Record<string, string> = {
    symbol: "▼ 刮出相同符號即中獎",
    triple: "▼ 三格相同即中獎",
    compare: "▼ 你的號碼大於莊家即中該行獎金",
    bingo: "▼ 連線數 × 每線獎金",
  };

  return (
    <article
      data-testid={`scratch-card-${cardId}`}
      className={`relative bg-gradient-to-br from-red-700 to-red-900 rounded-2xl p-2 shadow-2xl border-2 border-yellow-500/70 card-emboss w-full sm:w-fit ${mechanic === "bingo" ? "max-w-xs" : "max-w-sm"}`}
    >
      {/* 祥雲紋路 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          backgroundImage: `url(${cloudTileUrl})`,
          backgroundRepeat: "repeat",
          backgroundSize: "64px 64px",
          // mixBlendMode: "multiply",
          opacity: 0.9,
        }}
      />
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
              <div className="flex items-start gap-2">
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
                <img
                  src={caishenUrl}
                  alt=""
                  aria-hidden="true"
                  className="w-10 h-10 object-contain shrink-0"
                />
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
          <img
            src={caishenUrl}
            alt=""
            aria-hidden="true"
            className="w-10 h-10 object-contain self-start"
          />
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
          <img
            src={caishenUrl}
            alt=""
            aria-hidden="true"
            className="w-10 h-10 object-contain self-start"
          />
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
      ) : card.zones[0]!.cells.length === 4 ? (
        /* Symbol 4格：財神居中，上排左右各1、下排偏右非對稱 */
        <div className="flex flex-col gap-2 items-center">
          <div className="flex items-center gap-3">
            <ScratchCellCanvas
              cell={card.zones[0]!.cells[0]!}
              cardId={cardId}
              maxPrize={maxPrize}
            />
            <img
              src={caishenUrl}
              alt=""
              aria-hidden="true"
              className="w-24 h-24 object-contain"
            />
            <ScratchCellCanvas
              cell={card.zones[0]!.cells[1]!}
              cardId={cardId}
              maxPrize={maxPrize}
            />
          </div>
          <div className="flex gap-2 self-end pr-2">
            <ScratchCellCanvas
              cell={card.zones[0]!.cells[2]!}
              cardId={cardId}
              maxPrize={maxPrize}
            />
            <ScratchCellCanvas
              cell={card.zones[0]!.cells[3]!}
              cardId={cardId}
              maxPrize={maxPrize}
            />
          </div>
        </div>
      ) : (
        /* fallback：非 4 格時維持 flex-wrap */
        <div className="flex flex-wrap gap-2 justify-center">
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
