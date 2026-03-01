import ScratchCellCanvas from "@/components/play/ScratchCellCanvas";
import caishenUrl from "@/assets/mascot/caishen.png";
import type { ThemeLayoutProps } from "@/types";
import { symbolCellSize } from "./shared";

export default function SymbolLayout({ card, maxPrize }: ThemeLayoutProps) {
  const cells = card.zones[0]!.cells;
  const cardId = card.id;

  if (cells.length === 4) {
    return (
      <div className="flex flex-col gap-2 items-center">
        <div className="flex items-center gap-3">
          <ScratchCellCanvas
            cell={cells[0]!}
            cardId={cardId}
            maxPrize={maxPrize}
            {...symbolCellSize(cells[0]!.id)}
          />
          <img
            src={caishenUrl}
            alt=""
            aria-hidden="true"
            className="w-24 h-24 object-contain"
          />
          <ScratchCellCanvas
            cell={cells[1]!}
            cardId={cardId}
            maxPrize={maxPrize}
            {...symbolCellSize(cells[1]!.id)}
          />
        </div>
        <div className="flex gap-2 self-end pr-2">
          <ScratchCellCanvas
            cell={cells[2]!}
            cardId={cardId}
            maxPrize={maxPrize}
            {...symbolCellSize(cells[2]!.id)}
          />
          <ScratchCellCanvas
            cell={cells[3]!}
            cardId={cardId}
            maxPrize={maxPrize}
            {...symbolCellSize(cells[3]!.id)}
          />
        </div>
      </div>
    );
  }

  // fallback：非 4 格時維持 flex-wrap
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {cells.map((cell) => (
        <ScratchCellCanvas
          key={cell.id}
          cell={cell}
          cardId={cardId}
          maxPrize={maxPrize}
          {...symbolCellSize(cell.id)}
        />
      ))}
    </div>
  );
}
