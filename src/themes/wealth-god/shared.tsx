import type { ReactNode } from "react";
import { getCellPerturbation } from "@/utils/canvas-utils";

// ── Symbol 格子尺寸（依 getCellPerturbation.size 對應）────────────────────
export const SYMBOL_CELL_SIZES = {
  small: [114, 72],
  medium: [130, 80],
  large: [140, 88],
} as const;

export function symbolCellSize(cellId: string): {
  width: number;
  height: number;
} {
  const [w, h] = SYMBOL_CELL_SIZES[getCellPerturbation(cellId).size];
  return { width: w, height: h };
}

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
