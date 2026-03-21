import type { ReactNode } from "react";

// ── Symbol Layout 型別 ─────────────────────────────────────────────

export interface CellSlot {
  w: number;
  h: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  rotation: string;
  clipPath: string;
  contentInset?: { top: string; right: string; bottom: string; left: string };
}

export interface DecorationItem {
  type: string; // emoji or "金磚"
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  fontSize?: number;
  rotation?: string;
  opacity: number;
  filter?: string; // e.g. "drop-shadow(1.5px 3px 4px rgba(0,0,0,0.4))"
  // 金磚 only
  w?: number;
  h?: number;
  extra?: string; // additional CSS transform e.g. "skewX(-5deg)"
}

export interface SymbolLayoutConfig {
  card: { w: number; h: number };
  border: number;
  stripe: { gap: number; width: number };
  titleArea: { padding: string; borderBottom: number };
  title: { caishen: number; prize: number; letterSpacing: string };
  titleShadow: string;
  prizeShadow: string;
  price: { fontSize: number; border: number; padding: string };
  serial: { fontSize: number; padding: string; borderRadius: number };
  textStroke: string;
  container: { top: number; bottom: number };
  cells: CellSlot[];
  decorations: DecorationItem[];
  caishen: { w: number; h: number; bottom: number; right: number };
  helpText: {
    fontSize: number;
    bottom: number;
    left: number;
    letterSpacing: string;
  };
  prizeBadge: { fontSize: number; top: number; left: number };
  boxShadow: string;
  background: string;
  backgroundOverlay: string;
}

// ── Symbol Mobile (344×440) — from v15 mockup ──────────────────────

export const SYMBOL_MOBILE: SymbolLayoutConfig = {
  card: { w: 344, h: 440 },
  border: 4,
  stripe: { gap: 10, width: 12 },
  titleArea: { padding: "6px 8px", borderBottom: 2 },
  title: { caishen: 43, prize: 38, letterSpacing: "4px" },
  titleShadow: "1px 1px 2px rgba(0,0,0,0.9)",
  prizeShadow: "2px 2px 0 rgba(0,0,0,0.4), 0 0 24px rgba(255,200,50,0.2)",
  price: { fontSize: 18, border: 1.5, padding: "1px 6px" },
  serial: { fontSize: 13, padding: "2px 8px", borderRadius: 2 },
  textStroke: "4px",
  container: { top: 85, bottom: 75 },
  cells: [
    // 元寶 yuanbao (top-left): wide flat base, two upturned wings at top
    {
      w: 140,
      h: 92,
      top: 57,
      left: 16,
      rotation: "-2deg",
      clipPath:
        "polygon(50% 0%,42% 3%,35% 10%,30% 5%,22% 2%,15% 8%,10% 18%,6% 28%,3% 40%,0% 55%,2% 70%,5% 82%,10% 92%,18% 97%,28% 100%,40% 100%,50% 98%,60% 100%,72% 100%,82% 97%,90% 92%,95% 82%,98% 70%,100% 55%,97% 40%,94% 28%,90% 18%,85% 8%,78% 2%,70% 5%,65% 10%,58% 3%)",
      contentInset: { top: "14%", right: "8%", bottom: "4%", left: "8%" },
    },
    // 銅錢 copper coin (top-right): circle approximated with 20 vertices
    {
      w: 135,
      h: 88,
      top: 39,
      right: 16,
      rotation: "1deg",
      clipPath:
        "polygon(50% 0%,65% 2%,78% 7%,88% 15%,95% 25%,99% 37%,100% 50%,99% 63%,95% 75%,88% 85%,78% 93%,65% 98%,50% 100%,35% 98%,22% 93%,12% 85%,5% 75%,1% 63%,0% 50%,1% 37%,5% 25%,12% 15%,22% 7%,35% 2%)",
      contentInset: { top: "10%", right: "10%", bottom: "10%", left: "10%" },
    },
    // 紅包 red envelope (bottom-left): rectangle with triangular flap on top
    {
      w: 135,
      h: 95,
      bottom: 6,
      left: 20,
      rotation: "2deg",
      clipPath:
        "polygon(10% 0%,50% 18%,90% 0%,95% 0%,98% 5%,100% 12%,100% 88%,98% 95%,95% 100%,5% 100%,2% 95%,0% 88%,0% 12%,2% 5%,5% 0%)",
      contentInset: { top: "20%", right: "6%", bottom: "4%", left: "6%" },
    },
    // 福袋 lucky bag (bottom-right): rounded bottom, cinched top with tied knot
    {
      w: 140,
      h: 88,
      bottom: 2,
      left: 172,
      rotation: "-1deg",
      clipPath:
        "polygon(38% 0%,35% 5%,30% 8%,25% 5%,22% 2%,18% 6%,20% 12%,28% 16%,32% 20%,25% 24%,15% 30%,8% 38%,3% 48%,0% 60%,1% 72%,5% 82%,12% 90%,22% 96%,35% 100%,50% 100%,65% 100%,78% 96%,88% 90%,95% 82%,99% 72%,100% 60%,97% 48%,92% 38%,85% 30%,75% 24%,68% 20%,72% 16%,80% 12%,82% 6%,78% 2%,75% 5%,70% 8%,65% 5%,62% 0%)",
      contentInset: { top: "22%", right: "8%", bottom: "6%", left: "8%" },
    },
  ],
  decorations: [
    {
      type: "🪙",
      top: 225,
      left: 8,
      fontSize: 38,
      opacity: 0.8,
      rotation: "rotate(-15deg)",
      filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.4))",
    },
    {
      type: "🪙",
      top: 240,
      left: 24,
      fontSize: 29,
      opacity: 0.8,
      rotation: "rotate(10deg)",
    },
    {
      type: "✦",
      top: 152,
      left: 160,
      fontSize: 31,
      opacity: 0.8,
      rotation: "rotate(15deg)",
    },
    {
      type: "✦",
      top: 292,
      left: 6,
      fontSize: 23,
      opacity: 0.8,
      rotation: "rotate(-25deg)",
    },
    {
      type: "✧",
      top: 212,
      right: 8,
      fontSize: 25,
      opacity: 0.8,
      rotation: "rotate(35deg)",
    },
    { type: "✦", top: 325, right: 50, fontSize: 19, opacity: 0.65 },
    {
      type: "金磚",
      top: 248,
      left: 78,
      w: 44,
      h: 23,
      opacity: 0.8,
      rotation: "rotate(-8deg) skewX(-5deg)",
    },
    {
      type: "☁",
      top: 120,
      right: 4,
      fontSize: 50,
      opacity: 0.67,
      rotation: "rotate(8deg)",
    },
    {
      type: "☁",
      top: 302,
      left: 155,
      fontSize: 44,
      opacity: 0.67,
      rotation: "rotate(-5deg)",
    },
  ],
  caishen: { w: 143, h: 160, bottom: 0, right: -5 },
  helpText: { fontSize: 11, bottom: 12, left: 14, letterSpacing: "1px" },
  prizeBadge: {
    fontSize: 23,
    top: 92,
    left: 10,
  },
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  background: "radial-gradient(ellipse at 50% 40%, #f472b6, #db2777, #9d174d)",
  backgroundOverlay:
    "repeating-conic-gradient(rgba(255,255,255,0.06) 0% 25%, transparent 0% 50%) 0 0 / 20px 20px",
};

// ── Symbol Desktop (520×665) — from desktop-v1 mockup ──────────────

export const SYMBOL_DESKTOP: SymbolLayoutConfig = {
  card: { w: 520, h: 665 },
  border: 6,
  stripe: { gap: 15, width: 18 },
  titleArea: { padding: "9px 12px", borderBottom: 3 },
  title: { caishen: 65, prize: 57, letterSpacing: "6px" },
  titleShadow: "1px 1px 2px rgba(0,0,0,0.9)",
  prizeShadow: "3px 3px 0 rgba(0,0,0,0.4), 0 0 36px rgba(255,200,50,0.2)",
  price: { fontSize: 27, border: 2, padding: "1.5px 9px" },
  serial: { fontSize: 20, padding: "3px 12px", borderRadius: 3 },
  textStroke: "6px",
  container: { top: 130, bottom: 114 },
  cells: [
    // 元寶 yuanbao (top-left)
    {
      w: 211,
      h: 139,
      top: 83,
      left: 24,
      rotation: "-2deg",
      clipPath:
        "polygon(50% 0%,42% 3%,35% 10%,30% 5%,22% 2%,15% 8%,10% 18%,6% 28%,3% 40%,0% 55%,2% 70%,5% 82%,10% 92%,18% 97%,28% 100%,40% 100%,50% 98%,60% 100%,72% 100%,82% 97%,90% 92%,95% 82%,98% 70%,100% 55%,97% 40%,94% 28%,90% 18%,85% 8%,78% 2%,70% 5%,65% 10%,58% 3%)",
      contentInset: { top: "14%", right: "8%", bottom: "4%", left: "8%" },
    },
    // 銅錢 copper coin (top-right)
    {
      w: 204,
      h: 133,
      top: 57,
      right: 24,
      rotation: "1deg",
      clipPath:
        "polygon(50% 0%,65% 2%,78% 7%,88% 15%,95% 25%,99% 37%,100% 50%,99% 63%,95% 75%,88% 85%,78% 93%,65% 98%,50% 100%,35% 98%,22% 93%,12% 85%,5% 75%,1% 63%,0% 50%,1% 37%,5% 25%,12% 15%,22% 7%,35% 2%)",
      contentInset: { top: "10%", right: "10%", bottom: "10%", left: "10%" },
    },
    // 紅包 red envelope (bottom-left)
    {
      w: 204,
      h: 143,
      bottom: 9,
      left: 30,
      rotation: "2deg",
      clipPath:
        "polygon(10% 0%,50% 18%,90% 0%,95% 0%,98% 5%,100% 12%,100% 88%,98% 95%,95% 100%,5% 100%,2% 95%,0% 88%,0% 12%,2% 5%,5% 0%)",
      contentInset: { top: "20%", right: "6%", bottom: "4%", left: "6%" },
    },
    // 福袋 lucky bag (bottom-right)
    {
      w: 211,
      h: 133,
      bottom: 3,
      left: 260,
      rotation: "-1deg",
      clipPath:
        "polygon(38% 0%,35% 5%,30% 8%,25% 5%,22% 2%,18% 6%,20% 12%,28% 16%,32% 20%,25% 24%,15% 30%,8% 38%,3% 48%,0% 60%,1% 72%,5% 82%,12% 90%,22% 96%,35% 100%,50% 100%,65% 100%,78% 96%,88% 90%,95% 82%,99% 72%,100% 60%,97% 48%,92% 38%,85% 30%,75% 24%,68% 20%,72% 16%,80% 12%,82% 6%,78% 2%,75% 5%,70% 8%,65% 5%,62% 0%)",
      contentInset: { top: "22%", right: "8%", bottom: "6%", left: "8%" },
    },
  ],
  decorations: [
    {
      type: "🪙",
      top: 340,
      left: 12,
      fontSize: 45,
      opacity: 0.65,
      rotation: "rotate(-15deg)",
      filter: "drop-shadow(1.5px 3px 4px rgba(0,0,0,0.4))",
    },
    {
      type: "🪙",
      top: 363,
      left: 36,
      fontSize: 34,
      opacity: 0.65,
      rotation: "rotate(10deg)",
    },
    {
      type: "✦",
      top: 230,
      left: 242,
      fontSize: 38,
      opacity: 0.65,
      rotation: "rotate(15deg)",
    },
    {
      type: "✦",
      top: 441,
      left: 9,
      fontSize: 26,
      opacity: 0.65,
      rotation: "rotate(-25deg)",
    },
    {
      type: "✧",
      top: 320,
      right: 12,
      fontSize: 30,
      opacity: 0.65,
      rotation: "rotate(35deg)",
    },
    { type: "✦", top: 491, right: 76, fontSize: 23, opacity: 0.5 },
    {
      type: "金磚",
      top: 375,
      left: 118,
      w: 53,
      h: 26,
      opacity: 0.65,
      rotation: "rotate(-8deg) skewX(-5deg)",
    },
    {
      type: "☁",
      top: 181,
      right: 6,
      fontSize: 60,
      opacity: 0.5,
      rotation: "rotate(8deg)",
    },
    {
      type: "☁",
      top: 457,
      left: 234,
      fontSize: 53,
      opacity: 0.5,
      rotation: "rotate(-5deg)",
    },
  ],
  caishen: { w: 215, h: 240, bottom: 0, right: -8 },
  helpText: { fontSize: 17, bottom: 18, left: 21, letterSpacing: "1.5px" },
  prizeBadge: {
    fontSize: 34,
    top: 138,
    left: 15,
  },
  boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
  background: "radial-gradient(ellipse at 50% 40%, #f472b6, #db2777, #9d174d)",
  backgroundOverlay:
    "repeating-conic-gradient(rgba(255,255,255,0.06) 0% 25%, transparent 0% 50%) 0 0 / 30px 30px",
};

// ── Zone blob 形狀（0-100 坐標，等同百分比） ───────────────────────────────
export const BLOB: Record<string, { css: string; svg: string }> = {
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

export function ZoneBlob({
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
