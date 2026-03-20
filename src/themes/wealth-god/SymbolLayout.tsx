import ScratchCellCanvas from "@/components/play/ScratchCellCanvas";
import caishenUrl from "@/assets/mascot/caishen.png";
import type { ThemeLayoutProps } from "@/types";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import {
  SYMBOL_MOBILE,
  SYMBOL_DESKTOP,
  type CellSlot,
  type DecorationItem,
} from "./shared";

function formatMaxPrize(amount: number): string {
  if (amount >= 10000) return `${amount / 10000}萬`;
  return String(amount);
}

function cellStyle(slot: CellSlot): React.CSSProperties {
  return {
    position: "absolute",
    width: slot.w,
    height: slot.h,
    ...(slot.top != null && { top: slot.top }),
    ...(slot.bottom != null && { bottom: slot.bottom }),
    ...(slot.left != null && { left: slot.left }),
    ...(slot.right != null && { right: slot.right }),
    transform: `rotate(${slot.rotation})`,
    clipPath: slot.clipPath,
  };
}

function decoStyle(d: DecorationItem): React.CSSProperties {
  return {
    position: "absolute",
    ...(d.top != null && { top: d.top }),
    ...(d.bottom != null && { bottom: d.bottom }),
    ...(d.left != null && { left: d.left }),
    ...(d.right != null && { right: d.right }),
    fontSize: d.fontSize,
    opacity: d.opacity,
    transform: d.rotation,
    ...(d.filter && { filter: d.filter }),
    ...(d.type !== "金磚" && { color: "rgba(253,224,71,1)" }),
  };
}

// NOTE: SymbolLayout 硬寫 4 格 absolute 定位。目前 FIXED_CARD_SIZES=true 下 cellsPerZone 固定為 4。
// TODO(low): 若未來開放 cellsPerZone != 4，需新增動態排列或 fallback 至通用渲染。
export default function SymbolLayout({
  card,
  cardTypeConfig,
  config,
  maxPrize,
}: ThemeLayoutProps) {
  const isDesktop = useIsDesktop();
  const L = isDesktop ? SYMBOL_DESKTOP : SYMBOL_MOBILE;
  const cells = card.zones[0]!.cells;
  const cardId = card.id;
  const ticketPrice = cardTypeConfig.ticketPrice ?? 100;

  return (
    <article
      data-testid={`scratch-card-${cardId}`}
      style={{
        width: L.card.w,
        height: L.card.h,
        background: "linear-gradient(135deg, #b91c1c, #7f1d1d)",
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent ${L.stripe.gap}px, rgba(255,255,255,0.04) ${L.stripe.gap}px, rgba(255,255,255,0.04) ${L.stripe.width}px)`,
        border: `${L.border}px solid #e8b828`,
        position: "relative",
        overflow: "hidden",
        boxShadow: L.boxShadow,
        fontFamily: "'Dela Gothic One', sans-serif",
      }}
    >
      {/* ===== 標題區 ===== */}
      <div
        style={{
          background: "linear-gradient(180deg, #991b1b, #7f1d1d)",
          padding: L.titleArea.padding,
          borderBottom: `${L.titleArea.borderBottom}px solid rgba(234,179,8,0.3)`,
        }}
      >
        {/* 上排：價格 + 序號 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={
              {
                color: "#facc15",
                fontSize: L.price.fontSize,
                WebkitTextStroke: `${L.textStroke} rgba(120,30,10,0.5)`,
                textShadow: "1px 1px 3px rgba(0,0,0,0.6)",
                border: `${L.price.border}px solid #e8b828`,
                padding: L.price.padding,
              } as React.CSSProperties
            }
          >
            NT${ticketPrice.toLocaleString()}
          </span>
          <span
            style={{
              color: "rgba(250,204,21,0.7)",
              fontSize: L.serial.fontSize,
              fontFamily: "monospace",
              background: "rgba(0,0,0,0.2)",
              padding: L.serial.padding,
              borderRadius: L.serial.borderRadius,
            }}
          >
            {card.serialNumber}
          </span>
        </div>
        {/* 下排：財神報到 + 頭獎N萬 */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <span
            style={
              {
                color: "#facc15",
                fontSize: L.title.caishen,
                letterSpacing: L.title.letterSpacing,
                lineHeight: 1,
                WebkitTextStroke: `${L.textStroke} rgba(120,30,10,0.4)`,
                textShadow: L.titleShadow,
              } as React.CSSProperties
            }
          >
            財神報到
          </span>
          <div
            style={{ lineHeight: 1, display: "flex", alignItems: "baseline" }}
          >
            <span
              style={
                {
                  color: "#facc15",
                  fontSize: L.title.prize,
                  WebkitTextStroke: `${L.textStroke} rgba(120,30,10,0.4)`,
                  textShadow: L.prizeShadow,
                } as React.CSSProperties
              }
            >
              頭獎
            </span>
            <span
              style={
                {
                  color: "#facc15",
                  fontSize: L.title.prize,
                  WebkitTextStroke: `${L.textStroke} rgba(120,30,10,0.4)`,
                  textShadow: L.prizeShadow,
                  margin: isDesktop ? "0 6px" : "0 4px",
                } as React.CSSProperties
              }
            >
              {formatMaxPrize(maxPrize)}
            </span>
          </div>
        </div>
      </div>

      {/* ===== 裝飾 ===== */}
      {L.decorations.map((d, i) =>
        d.type === "金磚" ? (
          <div
            key={i}
            style={{
              position: "absolute",
              top: d.top,
              left: d.left,
              width: d.w,
              height: d.h,
              background: "linear-gradient(180deg,#fcd34d,#b45309)",
              borderRadius: isDesktop ? 4 : 3,
              transform: d.rotation,
              opacity: d.opacity,
              border: `${isDesktop ? 1.5 : 1}px solid #92400e`,
            }}
          />
        ) : (
          <div key={i} style={decoStyle(d)}>
            {d.type}
          </div>
        ),
      )}

      {/* ===== 格子 container ===== */}
      <div
        style={{
          position: "absolute",
          top: L.container.top,
          left: 0,
          right: 0,
          bottom: L.container.bottom,
        }}
      >
        {L.cells.map((slot, i) => {
          const cell = cells[i];
          if (!cell) return null;
          return (
            <div key={cell.id} style={cellStyle(slot)}>
              <ScratchCellCanvas
                cell={cell}
                cardId={cardId}
                maxPrize={maxPrize}
                width={slot.w}
                height={slot.h}
              />
            </div>
          );
        })}
      </div>

      {/* ===== 財神 ===== */}
      <div
        style={{
          position: "absolute",
          bottom: L.caishen.bottom,
          right: L.caishen.right,
          width: L.caishen.w,
          height: L.caishen.h,
          overflow: "hidden",
        }}
      >
        <img
          src={caishenUrl}
          alt=""
          aria-hidden="true"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>

      {/* ===== 底部：說明 + 按鈕/結果 ===== */}
      <div
        style={{
          position: "absolute",
          bottom: L.helpText.bottom,
          left: L.helpText.left,
        }}
      >
        <span
          style={{
            color: "rgba(250,204,21,0.7)",
            fontSize: L.helpText.fontSize,
            letterSpacing: L.helpText.letterSpacing,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          ▼ 刮出相同符號即中獎
        </span>
      </div>
    </article>
  );
}
