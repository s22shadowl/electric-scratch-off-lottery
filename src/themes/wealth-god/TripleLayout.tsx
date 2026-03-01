import ScratchCellCanvas from "@/components/play/ScratchCellCanvas";
import caishenUrl from "@/assets/mascot/caishen.png";
import type { ThemeLayoutProps } from "@/types";
import { ZoneBlob } from "./shared";

export default function TripleLayout({ card, maxPrize }: ThemeLayoutProps) {
  const cardId = card.id;
  return (
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
  );
}
