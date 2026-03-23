import React from "react";
import ScratchCellCanvas from "@/components/play/ScratchCellCanvas";
import caishenUrl from "@/assets/mascot/caishen.png";
import yuanbaoUrl from "@/assets/symbols/sym-yuanbao.png";
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
  maxPrize,
}: ThemeLayoutProps) {
  const isDesktop = useIsDesktop();
  const L = isDesktop ? SYMBOL_DESKTOP : SYMBOL_MOBILE;
  const cells = card.zones[0]!.cells;
  const cardId = card.id;
  const ticketPrice = cardTypeConfig.ticketPrice ?? 100;

  return (
    // ── 外層 wrapper：持有 border + 外側陰影，作為 ribbon 的 positioning context ──
    <div
      data-testid={`scratch-card-${cardId}`}
      style={{
        width: L.card.w,
        height: L.card.h,
        position: "relative",
        border: `${L.border}px solid #e8b828`,
        boxShadow: L.boxShadow,
        fontFamily: "'Dela Gothic One', sans-serif",
      }}
    >
      {/* ── 內層 article：overflow:hidden + 三層 inset 邊框（金紅金）── */}
      <article
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent ${L.stripe.gap}px, rgba(255,255,255,0.06) ${L.stripe.gap}px, rgba(255,255,255,0.06) ${L.stripe.width}px), ${L.background}`,
          overflow: "hidden",
          boxShadow: "inset 0 0 0 7px #dc2626",
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
            top: isDesktop ? 6 : 4,
            right: isDesktop ? 3 : 1,
            zIndex: 3,
            lineHeight: 1,
          }}
        >
          <svg
            width={isDesktop ? 110 : 74}
            height={isDesktop ? 28 : 19}
            viewBox={isDesktop ? "0 0 110 28" : "0 0 74 19"}
          >
            {([
              { fill: "none",  stroke: "#d4a800", sw: isDesktop ? 7 : 5 },
              { fill: "none",  stroke: "white",   sw: isDesktop ? 4 : 3 },
              { fill: "#000",  stroke: undefined,  sw: 0 },
            ] as const).map((layer, i) => (
              <text
                key={i}
                x="50%"
                y={isDesktop ? 21 : 14}
                textAnchor="middle"
                fontFamily="monospace"
                fontSize={isDesktop ? 18 : 12}
                fontWeight="700"
                fill={layer.fill}
                stroke={layer.stroke}
                strokeWidth={layer.sw || undefined}
                strokeLinejoin="round"
                paintOrder="stroke fill"
              >
                {card.serialNumber}
              </text>
            ))}
          </svg>
        </div>

        {/* ===== 標題區 ===== */}
        <div
          style={{
            padding: L.titleArea.padding,
          }}
        >
          {/* 上排：價格貼紙（SVG 圓弧波浪鋸齒 + 金色放射條紋） */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            {(() => {
              const priceText = `★NT$${ticketPrice.toLocaleString()}`;
              const w = isDesktop ? 158 : 130;
              const h = isDesktop ? 62 : 56;
              const q = 6; // scallop depth
              const step = 10; // scallop spacing
              const patId = `price-sunburst-${cardId}`;

              // Build scalloped rectangle path
              const d: string[] = [];
              d.push(`M0,0`);
              for (let x = 0; x + step <= w; x += step) {
                d.push(`Q${x + step / 2},${q} ${x + step},0`);
              }
              for (let y = 0; y + step <= h; y += step) {
                d.push(`Q${w - q},${y + step / 2} ${w},${y + step}`);
              }
              for (let x = w; x - step >= 0; x -= step) {
                d.push(`Q${x - step / 2},${h - q} ${x - step},${h}`);
              }
              for (let y = h; y - step >= 0; y -= step) {
                d.push(`Q${q},${y - step / 2} 0,${y - step}`);
              }
              d.push("Z");

              const cx = w / 2;
              const cy = h / 2;
              const rayLen = Math.max(w, h);
              const rays = Array.from({ length: 15 }, (_, i) => i * 24);

              return (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 10,
                    marginLeft: 4,
                  }}
                >
                  <svg
                    width={w}
                    height={h}
                    viewBox={`-2 -2 ${w + 4} ${h + 4}`}
                    style={{ display: "block", overflow: "visible" }}
                  >
                    <defs>
                      <pattern
                        id={patId}
                        patternUnits="userSpaceOnUse"
                        width={w}
                        height={h}
                      >
                        <rect width={w} height={h} fill="#fbbf24" />
                        <g transform={`translate(${cx},${cy})`}>
                          {rays.map((angle) => (
                            <line
                              key={angle}
                              x1={0}
                              y1={0}
                              x2={rayLen}
                              y2={0}
                              stroke="#d4a800"
                              strokeWidth={isDesktop ? 5 : 4.5}
                              transform={`rotate(${angle})`}
                            />
                          ))}
                        </g>
                      </pattern>
                    </defs>
                    <g transform={`translate(${cx},${cy}) rotate(-9) skewX(-14) translate(${-cx},${-cy})`}>
                      <path
                        d={d.join(" ")}
                        fill={`url(#${patId})`}
                        stroke="#fff"
                        strokeWidth={2.5}
                      />
                      <text
                        x={w / 2}
                        y={h / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontFamily="'Noto Sans TC', 'PingFang TC', sans-serif"
                        fontWeight={900}
                        fontSize={isDesktop ? 32 : 25}
                        fill="#dc2626"
                      >
                        {priceText}
                      </text>
                    </g>
                  </svg>
                </div>
              );
            })()}
          </div>
          {/* 下排：財神報到大字 — 拱型 SVG textPath + 扇形匾額背景 */}
          <div
            style={{
              position: "relative",
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: -5,
            }}
          >
            <svg
              viewBox={isDesktop ? "0 0 330 80" : "0 0 230 55"}
              width={isDesktop ? 330 : 230}
              height={isDesktop ? 80 : 55}
              style={{ overflow: "visible" }}
            >
              <defs>
                <path
                  id={`arch-${cardId}`}
                  d={
                    isDesktop
                      ? "M 8,62 A 420,420 0 0,1 295,62"
                      : "M 8,40 A 280,280 0 0,1 202,40"
                  }
                />
                <linearGradient
                  id={`arch-bg-${cardId}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#c42222" />
                  <stop offset="50%" stopColor="#e53030" />
                  <stop offset="100%" stopColor="#c42222" />
                </linearGradient>
                {/* 財神報到文字漸層：radial gradient 沿拱型彎曲 */}
                {(() => {
                  const archR = isDesktop ? 420 : 280;
                  const halfChord = isDesktop ? 143.5 : 97;
                  const archStartY = isDesktop ? 62 : 40;
                  const archMidX = isDesktop ? 151.5 : 105;
                  const archCy = archStartY + Math.sqrt(archR ** 2 - halfChord ** 2);
                  const capH = L.title.caishen * 0.72;
                  const rMin = archR;
                  const rMax = archR + capH + 10;
                  const toP = (r: number) => `${((r / rMax) * 100).toFixed(2)}%`;
                  const step = capH / 6;
                  const w = capH * 0.06;  // ≈12% white half-width
                  const g = capH * 0.03;  // gold shrink: yellow starts/ends 3% sooner
                  return (
                    <radialGradient
                      id={`title-fill-${cardId}`}
                      gradientUnits="userSpaceOnUse"
                      cx={archMidX}
                      cy={archCy}
                      r={rMax}
                    >
                      <stop offset="0%"                         stopColor="#c89600" />
                      <stop offset={toP(rMin)}                  stopColor="#c89600" />
                      <stop offset={toP(rMin + step - g)}       stopColor="#ffe040" />
                      <stop offset={toP(rMin + 2*step - w)}     stopColor="#ffe040" />
                      <stop offset={toP(rMin + 2*step)}         stopColor="#ffffff" />
                      <stop offset={toP(rMin + 2*step + w)}     stopColor="#ffe040" />
                      <stop offset={toP(rMin + 3*step)}         stopColor="#ffe040" />
                      <stop offset={toP(rMin + 4*step - w)}     stopColor="#ffe040" />
                      <stop offset={toP(rMin + 4*step)}         stopColor="#ffffff" />
                      <stop offset={toP(rMin + 4*step + w)}     stopColor="#ffe040" />
                      <stop offset={toP(rMin + 5*step + g)}     stopColor="#ffe040" />
                      <stop offset={toP(rMin + capH)}           stopColor="#c89600" />
                      <stop offset="100%"                       stopColor="#c89600" />
                    </radialGradient>
                  );
                })()}
              </defs>
              {/* 扇形背景：紅色漸層帶 + 黑粗外框 */}
              <path
                d={
                  isDesktop
                    ? "M -13,17 A 475,475 0 0,1 310,17 L 284,81 A 406,406 0 0,0 13,81 Z"
                    : "M -7,10 A 318,318 0 0,1 215,10 L 197,53 A 271,271 0 0,0 12,53 Z"
                }
                fill={`url(#arch-bg-${cardId})`}
                stroke="rgba(0,0,0,0.4)"
                strokeWidth={isDesktop ? 6 : 4.5}
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(1px 2px 4px rgba(0,0,0,0.5))" }}
              />
              {/* 主字層：漸層填色（亮黃→深橘）+ 深紅描邊 + 立體陰影 */}
              <text
                fill={`url(#title-fill-${cardId})`}
                stroke="#991b1b"
                strokeWidth={isDesktop ? 4 : 2.5}
                paintOrder="stroke fill"
                fontFamily="'Dela Gothic One', sans-serif"
                fontSize={L.title.caishen}
                letterSpacing={isDesktop ? 10 : 8}
                textAnchor="middle"
                style={{ filter: "drop-shadow(2px 3px 0 rgba(0,0,0,0.8))" }}
              >
                <textPath href={`#arch-${cardId}`} startOffset="50%">
                  財神報到
                </textPath>
              </text>
            </svg>
          </div>
          {/* (price badge moved to 上排, before 財神報到) */}
        </div>

        {/* ===== 元寶裝飾（財神報到右側） ===== */}
        <img
          src={yuanbaoUrl}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            top: isDesktop ? 62 : 48,
            right: isDesktop ? 12 : 8,
            width: isDesktop ? 83 : 55,
            height: isDesktop ? 83 : 55,
            objectFit: "contain",
            transform: "rotate(20deg)",
            filter:
              "sepia(1) saturate(4) hue-rotate(10deg) brightness(1.05) drop-shadow(1px 2px 3px rgba(0,0,0,0.35))",
            opacity: 0.9,
            zIndex: 2,
          }}
        />

        {/* ===== 裝飾 ===== */}
        {L.decorations.map((d, i) =>
          d.type === "✦" || d.type === "✧" ? (
            // 白色四芒星：radial gradient（中心白實→外緣透明）+ 白色光暈
            <div
              key={i}
              style={{
                position: "absolute",
                ...(d.top != null && { top: d.top }),
                ...(d.bottom != null && { bottom: d.bottom }),
                ...(d.left != null && { left: d.left }),
                ...(d.right != null && { right: d.right }),
                transform: d.rotation,
                opacity: d.opacity,
                filter:
                  "drop-shadow(0 0 3px rgba(255,255,255,0.95)) drop-shadow(0 0 7px rgba(255,255,255,0.6))",
              }}
            >
              <svg
                width={d.fontSize}
                height={d.fontSize}
                viewBox="-1 -1 2 2"
                style={{ display: "block", overflow: "visible" }}
              >
                <defs>
                  <radialGradient
                    id={`spk-${cardId}-${i}`}
                    cx="50%"
                    cy="50%"
                    r="50%"
                  >
                    <stop
                      offset="0%"
                      stopColor="white"
                      stopOpacity={d.type === "✦" ? 1 : 0.7}
                    />
                    <stop
                      offset="55%"
                      stopColor="white"
                      stopOpacity={d.type === "✦" ? 0.55 : 0.3}
                    />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <path
                  d="M 0,-1 L 0.13,-0.13 L 1,0 L 0.13,0.13 L 0,1 L -0.13,0.13 L -1,0 L -0.13,-0.13 Z"
                  fill={`url(#spk-${cardId}-${i})`}
                />
              </svg>
            </div>
          ) : d.type === "金磚" ? (
            <div
              key={i}
              style={{
                position: "absolute",
                top: d.top,
                left: d.left,
                width: d.w,
                height: d.h,
                transform: d.rotation,
                opacity: d.opacity,
              }}
            >
              {/* 三角形疊放：上 1 下 2 */}
              {(isDesktop
                ? [
                    { l: 18, t: 0 },
                    { l: 0, t: 16 },
                    { l: 36, t: 16 },
                  ]
                : [
                    { l: 12, t: 0 },
                    { l: 0, t: 11 },
                    { l: 24, t: 11 },
                  ]
              ).map((pos, j) => (
                <div
                  key={j}
                  style={{
                    position: "absolute",
                    left: pos.l,
                    top: pos.t,
                    width: isDesktop ? 33 : 22,
                    height: isDesktop ? 13 : 9,
                    background: "#fde68a",
                    borderRadius: isDesktop ? 2 : 1.5,
                  }}
                />
              ))}
            </div>
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
            zIndex: 1,
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
                shapeRendering="geometricPrecision"
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
                  strokeWidth="9"
                  strokeLinejoin="round"
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

        {/* ===== 底部說明 SVG 多層文字 ===== */}
        {(() => {
          const cellsPerZone =
            (cardTypeConfig.mechanicOptions as SymbolOptions).cellsPerZone ?? 4;
          const fs = L.helpText.fontSize;
          const badgeFs = fs + (isDesktop ? 8 : 5);
          const svgW = isDesktop ? 260 : 175;
          const cx = svgW / 2;
          const line1Y = fs + 2;
          const lineGap = isDesktop ? 36 : 24;
          const line2Y = line1Y + lineGap;
          const gaodaW = isDesktop ? 46 : 30;
          const badgeW = isDesktop ? 30 : 21;
          const badgeH = isDesktop ? 30 : 22;
          const badgeMargin = isDesktop ? 8 : 6;
          const nextjihuiW = isDesktop ? 57 : 39;
          const line2TotalW = gaodaW + badgeMargin + badgeW + (badgeMargin + 2) + nextjihuiW;
          const line2StartX = Math.round(cx - line2TotalW / 2);
          const badgeTX = line2StartX + gaodaW + badgeMargin;
          const nextjihuiTX = line2StartX + gaodaW + badgeMargin + badgeW + badgeMargin + 2;
          const layers = [
            { fill: "none" as const, stroke: "#d4a800", sw: isDesktop ? 7 : 5 },
            { fill: "none" as const, stroke: "white", sw: isDesktop ? 4 : 3 },
            { fill: "#1a0000" as const, stroke: undefined, sw: 0 },
          ];
          return (
            <svg
              style={{
                position: "absolute",
                bottom: L.helpText.bottom + 4,
                left: L.helpText.left - 10,
                overflow: "visible",
              }}
              width={svgW}
              height={line2Y + 4}
            >
              {layers.map((layer, i) => (
                <text
                  key={`l1-${i}`}
                  x={cx}
                  y={line1Y}
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize={fs}
                  fill={layer.fill}
                  stroke={layer.stroke}
                  strokeWidth={layer.sw || undefined}
                  strokeLinejoin="round"
                  paintOrder="stroke fill"
                >
                  <tspan>▲</tspan>
                  <tspan dx={4}>刮出相同符號即中獎</tspan>
                  <tspan dx={4}>▲</tspan>
                </text>
              ))}
              {layers.map((layer, i) => (
                <React.Fragment key={`l2-${i}`}>
                  <text
                    x={line2StartX}
                    y={line2Y}
                    fontFamily="monospace"
                    fontSize={fs}
                    fill={layer.fill}
                    stroke={layer.stroke}
                    strokeWidth={layer.sw || undefined}
                    strokeLinejoin="round"
                    paintOrder="stroke fill"
                  >
                    高達
                  </text>
                  <text
                    x={nextjihuiTX}
                    y={line2Y}
                    fontFamily="monospace"
                    fontSize={fs}
                    fill={layer.fill}
                    stroke={layer.stroke}
                    strokeWidth={layer.sw || undefined}
                    strokeLinejoin="round"
                    paintOrder="stroke fill"
                  >
                    次機會
                  </text>
                </React.Fragment>
              ))}
              <g
                transform={`translate(${badgeTX}, ${line2Y - badgeH + 4}) rotate(10, ${badgeW / 2}, ${badgeH / 2})`}
              >
                <rect x="0" y="0" width={badgeW} height={badgeH} fill="#dc2626" rx="2" />
                <text
                  x={badgeW / 2}
                  y={badgeH - (isDesktop ? 7 : 5)}
                  fontFamily="monospace"
                  fontSize={badgeFs}
                  fontWeight="900"
                  fill="#facc15"
                  stroke="#000"
                  strokeWidth={isDesktop ? 2 : 1.5}
                  paintOrder="stroke fill"
                  textAnchor="middle"
                >
                  {cellsPerZone}
                </text>
              </g>
            </svg>
          );
        })()}
      </article>

      {/* ===== 頭獎 ribbon（在 article 外，左側真正出血蓋過 border）===== */}
      <svg
        style={{
          position: "absolute",
          top: L.prizeBadge.top,
          left: -L.border,
          overflow: "visible",
          filter: "drop-shadow(2px 3px 5px rgba(0,0,0,0.4))",
          zIndex: 2,
        }}
        width={isDesktop ? 290 : 195}
        height={isDesktop ? 70 : 46}
        viewBox={isDesktop ? "0 0 290 70" : "0 0 195 46"}
      >
        <defs>
          <linearGradient id={`ribbon-bg-${cardId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4a800" />
            <stop offset="50%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#d4a800" />
          </linearGradient>
        </defs>
        <polygon
          points={isDesktop ? "0,0 274,0 290,35 274,70 0,70" : "0,0 179,0 195,23 179,46 0,46"}
          fill={`url(#ribbon-bg-${cardId})`}
        />
        {/* 紅框：只畫上/箭頭/下三側，不畫左側 */}
        <polyline
          points={isDesktop ? "0,0 274,0 290,35 274,70 0,70" : "0,0 179,0 195,23 179,46 0,46"}
          fill="none"
          stroke="#dc2626"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* 三層文字外框：黃細 + 白粗 + 黃細 + 深紅填色 */}
        {([
          { fill: "none",    stroke: "#d4a800", sw: isDesktop ? 14 : 9 },
          { fill: "none",    stroke: "white",   sw: isDesktop ? 10 : 6 },
          { fill: "none",    stroke: "#d4a800", sw: isDesktop ? 3  : 2 },
          { fill: "#7f1d1d", stroke: undefined, sw: 0 },
        ] as const).map((layer, i) => (
          <text
            key={i}
            x={isDesktop ? 20 : 14}
            y={isDesktop ? 49 : 32}
            fontFamily="'Noto Sans TC', 'PingFang TC', sans-serif"
            fontWeight="700"
            fontSize={isDesktop ? 40 : 27}
            fill={layer.fill}
            stroke={layer.stroke}
            strokeWidth={layer.sw || undefined}
            strokeLinejoin="round"
            letterSpacing={isDesktop ? "2" : "1"}
          >
            頭獎 {formatMaxPrize(maxPrize)} 元
          </text>
        ))}
      </svg>
    </div>
  );
}
