import ScratchCellCanvas from "@/components/play/ScratchCellCanvas";
import caishenUrl from "@/assets/mascot/caishen.png";
import type { ThemeLayoutProps } from "@/types";
import { ZoneBlob } from "./shared";

export default function CompareLayout({ card, maxPrize }: ThemeLayoutProps) {
  const cardId = card.id;
  return (
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
                alwaysShowAmount={true}
              />
            </div>
          ))}
        </div>
      </ZoneBlob>
    </div>
  );
}
