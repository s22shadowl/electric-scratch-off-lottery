import BingoCellCanvas from "@/components/play/BingoCellCanvas";
import caishenUrl from "@/assets/mascot/caishen.png";
import type { ThemeLayoutProps, BingoOptions } from "@/types";
import { ZoneBlob } from "./shared";

export default function BingoLayout({
  card,
  cardTypeConfig,
}: ThemeLayoutProps) {
  const cardId = card.id;
  const opts = cardTypeConfig?.mechanicOptions as BingoOptions | undefined;
  const gridSize = opts?.gridSize ?? 3;
  const cellSize =
    ({ 3: 64, 4: 52, 5: 44, 6: 36 } as Record<number, number>)[gridSize] ?? 48;
  // zone[0] 永遠可見，drawnSet 直接取全部號碼
  const drawnSet = new Set(
    card.zones[0]?.cells.map((c) => c.bingoNumber!) ?? [],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* zone[0]：開獎號碼（永遠可見，預先印刷） */}
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-yellow-400/70 text-[10px] text-center mb-1 tracking-widest">
            開獎號碼
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {card.zones[0]?.cells.map((cell) => (
              <div
                key={cell.id}
                data-testid={`zone0-num-${cell.id}`}
                className="w-9 h-9 rounded-full bg-yellow-400 border-2 border-red-600 flex items-center justify-center"
              >
                <span className="font-black text-red-900 text-sm leading-none">
                  {cell.bingoNumber}
                </span>
              </div>
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
      {/* zone[1]：賓果格（scratch-off，主遊戲區） */}
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
}
