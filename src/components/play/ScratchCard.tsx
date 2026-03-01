import type { ReactNode } from "react";
import { useGameStore } from "@/stores/gameStore";
import ScratchCellCanvas from "./ScratchCellCanvas";
import BingoCellCanvas from "./BingoCellCanvas";
import cloudTileUrl from "@/assets/decorations/cloud-tile.png";
import caishenUrl from "@/assets/mascot/caishen.png";
import type { BingoOptions } from "@/types";

// ── Zone blob 形狀（0-100 坐標，等同百分比） ───────────────────────────────
const BLOB: Record<string, { css: string; svg: string }> = {
  triple: {
    css: "3% 8%,15% 2%,30% 6%,48% 0%,65% 4%,80% 1%,95% 6%,99% 15%,96% 35%,100% 55%,97% 75%,99% 92%,90% 100%,72% 96%,55% 100%,38% 97%,22% 100%,8% 97%,2% 88%,5% 70%,0% 52%,4% 34%,0% 18%",
    svg: "3,8 15,2 30,6 48,0 65,4 80,1 95,6 99,15 96,35 100,55 97,75 99,92 90,100 72,96 55,100 38,97 22,100 8,97 2,88 5,70 0,52 4,34 0,18",
  },
  compare: {
    css: "6% 4%,18% 1%,33% 5%,50% 2%,67% 5%,82% 1%,97% 7%,100% 18%,97% 37%,100% 56%,98% 74%,100% 91%,93% 100%,76% 97%,60% 100%,44% 97%,28% 100%,14% 97%,4% 92%,1% 78%,5% 63%,0% 47%,3% 32%,0% 17%",
    svg: "6,4 18,1 33,5 50,2 67,5 82,1 97,7 100,18 97,37 100,56 98,74 100,91 93,100 76,97 60,100 44,97 28,100 14,97 4,92 1,78 5,63 0,47 3,32 0,17",
  },
  "bingo-0": {
    css: "4% 10%,15% 3%,28% 8%,42% 1%,57% 6%,72% 2%,86% 7%,97% 4%,100% 25%,97% 55%,100% 80%,90% 98%,74% 94%,58% 100%,43% 95%,28% 100%,15% 95%,3% 85%,0% 60%,4% 35%",
    svg: "4,10 15,3 28,8 42,1 57,6 72,2 86,7 97,4 100,25 97,55 100,80 90,98 74,94 58,100 43,95 28,100 15,95 3,85 0,60 4,35",
  },
  "bingo-1": {
    css: "5% 6%,16% 1%,28% 5%,40% 2%,52% 6%,64% 2%,76% 5%,88% 1%,97% 7%,100% 18%,97% 32%,100% 46%,97% 60%,100% 74%,97% 88%,92% 100%,78% 97%,64% 100%,50% 97%,36% 100%,22% 97%,10% 100%,3% 92%,0% 78%,4% 64%,0% 50%,4% 36%,0% 22%,3% 10%",
    svg: "5,6 16,1 28,5 40,2 52,6 64,2 76,5 88,1 97,7 100,18 97,32 100,46 97,60 100,74 97,88 92,100 78,97 64,100 50,97 36,100 22,97 10,100 3,92 0,78 4,64 0,50 4,36 0,22 3,10",
  },
};

function ZoneBlob({
  blobKey,
  children,
}: {
  blobKey: string;
  children: ReactNode;
}) {
  const blob = BLOB[blobKey];
  if (!blob) return <>{children}</>;
  return (
    <div className="relative">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ overflow: "visible" }}
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <polygon
          points={blob.svg}
          fill="none"
          stroke="#CC1111"
          strokeWidth="3.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div style={{ clipPath: `polygon(${blob.css})` }}>{children}</div>
    </div>
  );
}

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
                <ZoneBlob blobKey="bingo-0">
                  <div className="p-1">
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
                </ZoneBlob>
                <img
                  src={caishenUrl}
                  alt=""
                  aria-hidden="true"
                  className="w-10 h-10 object-contain shrink-0"
                />
              </div>
              {/* zone[1]：賓果格 */}
              <ZoneBlob blobKey="bingo-1">
                <div
                  className="grid gap-1.5 justify-center p-1"
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
              </ZoneBlob>
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
          <ZoneBlob blobKey="triple">
            <div className="flex flex-col gap-2 p-1.5">
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
          </ZoneBlob>
        </div>
      ) : mechanic === "compare" ? (
        <div className="flex flex-col gap-2">
          <img
            src={caishenUrl}
            alt=""
            aria-hidden="true"
            className="w-10 h-10 object-contain self-start"
          />
          <ZoneBlob blobKey="compare">
            <div className="flex flex-col gap-2 p-1.5">
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
          </ZoneBlob>
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
