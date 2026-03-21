import ScratchCellCanvas from "@/components/play/ScratchCellCanvas";
import caishenUrl from "@/assets/mascot/caishen.png";
import type { ThemeLayoutProps, SymbolOptions } from "@/types";
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

function clipPathToSvgPoints(clipPath: string, w: number, h: number): string {
  const match = clipPath.match(/polygon\((.+)\)/);
  if (!match) return "";
  return match[1]
    .split(",")
    .map((pair) => {
      const parts = pair.trim().split(/\s+/);
      const x = (parseFloat(parts[0]) / 100) * w;
      const y = (parseFloat(parts[1]) / 100) * h;
      return `${x},${y}`;
    })
    .join(" ");
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
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
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
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent ${L.stripe.gap}px, rgba(255,255,255,0.06) ${L.stripe.gap}px, rgba(255,255,255,0.06) ${L.stripe.width}px), ${L.background}`,
        border: `${L.border}px solid #e8b828`,
        position: "relative",
        overflow: "hidden",
        boxShadow: L.boxShadow,
        fontFamily: "'Dela Gothic One', sans-serif",
      }}
    >
      {/* ===== 菱形閃光紋理 overlay ===== */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: L.backgroundOverlay,
          pointerEvents: "none",
        }}
      />

      {/* ===== 序號（右上角貼邊） ===== */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          background: "#b91c1c",
          borderLeft: `${L.border}px solid #e8b828`,
          borderBottom: `${L.border}px solid #e8b828`,
          borderBottomLeftRadius: L.serial.borderRadius + 2,
          padding: L.serial.padding,
          fontSize: L.serial.fontSize,
          color: "#facc15",
          fontFamily: "monospace",
          lineHeight: 1.3,
          zIndex: 3,
        }}
      >
        {card.serialNumber}
      </div>

      {/* ===== 標題區 ===== */}
      <div
        style={{
          padding: L.titleArea.padding,
          borderBottom: `${L.titleArea.borderBottom}px solid #e8b828`,
        }}
      >
        {/* 上排：價格貼紙 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            className="inline-block bg-yellow-300 font-black"
            style={
              {
                fontSize: L.price.fontSize,
                padding: L.price.padding,
                transform: "rotate(-8deg)",
                display: "inline-block",
                color: "#dc2626",
                marginTop: 5,
              } as React.CSSProperties
            }
          >
            NT${ticketPrice.toLocaleString()}
          </span>
        </div>
        {/* 下排：僅財神報到大字 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={
              {
                color: "#facc15",
                fontSize: L.title.caishen,
                letterSpacing: L.title.letterSpacing,
                lineHeight: 1,
                WebkitTextStroke: `${L.textStroke} #991b1b`,
                textShadow: L.titleShadow,
                paintOrder: "stroke fill",
                position: "relative",
                top: -6,
              } as React.CSSProperties
            }
          >
            財神報到
          </span>
        </div>
      </div>

      {/* ===== 頭獎 Badge（標題分隔線下方） ===== */}
      <div
        style={{
          position: "absolute",
          top: L.prizeBadge.top,
          left: L.prizeBadge.left,
          zIndex: 2,
          fontSize: L.prizeBadge.fontSize,
          color: "#facc15",
          fontFamily: "'Dela Gothic One', sans-serif",
          fontWeight: 900,
          minWidth: isDesktop ? 232 : 155,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          textAlign: "center",
          width: isDesktop ? 240 : 156,
          paddingLeft: 12,
        }}
      >
        頭獎 {formatMaxPrize(maxPrize)} 元
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
          return [
            <div key={`c-${cell.id}`} style={cellStyle(slot)}>
              <ScratchCellCanvas
                cell={cell}
                cardId={cardId}
                maxPrize={maxPrize}
                width={slot.w}
                height={slot.h}
                contentInset={slot.contentInset}
              />
            </div>,
            <svg
              key={`b-${cell.id}`}
              style={{
                position: "absolute",
                ...(slot.top != null && { top: slot.top }),
                ...(slot.bottom != null && { bottom: slot.bottom }),
                ...(slot.left != null && { left: slot.left }),
                ...(slot.right != null && { right: slot.right }),
                width: slot.w,
                height: slot.h,
                overflow: "visible",
                zIndex: 10,
                pointerEvents: "none" as const,
                transform: `rotate(${slot.rotation})`,
              }}
            >
              <polygon
                points={clipPathToSvgPoints(slot.clipPath, slot.w, slot.h)}
                fill="none"
                stroke="#dc2626"
                strokeWidth="4"
              />
            </svg>,
          ];
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
        }}
      >
        <img
          src={caishenUrl}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: "auto",
          }}
        />
      </div>

      {/* ===== 底部說明 ===== */}
      <div
        style={{
          position: "absolute",
          bottom: L.helpText.bottom,
          left: L.helpText.left,
        }}
      >
        <p
          style={{
            fontSize: L.helpText.fontSize,
            fontFamily: "monospace",
            color: "rgba(255,255,200,0.85)",
            letterSpacing: L.helpText.letterSpacing,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          刮出相同符號即中獎 ▲
        </p>
        <p
          style={{
            fontSize: L.helpText.fontSize,
            fontFamily: "monospace",
            color: "rgba(255,255,200,0.85)",
            letterSpacing: L.helpText.letterSpacing,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          高達{" "}
          {(cardTypeConfig.mechanicOptions as SymbolOptions).cellsPerZone ?? 4}{" "}
          次機會
        </p>
      </div>
    </article>
  );
}
