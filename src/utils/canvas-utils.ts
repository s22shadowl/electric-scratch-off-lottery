// ── 格子內容擾動（seeded，模擬印刷不規則感） ─────────────────────────────────

// xorshift32 PRNG，seed 由 cell ID 字串衍生
export function seededRand(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  if (h === 0) h = 1;
  return () => {
    h ^= h << 13;
    h ^= h >> 17;
    h ^= h << 5;
    return (h >>> 0) / 0xffffffff;
  };
}

export interface CellPerturbation {
  rotation: number; // degrees, ±4
  skewX: number; // degrees, ±12（~30% 格觸發）
  alignH: "left" | "center" | "right";
  alignV: "top" | "center" | "bottom";
  scale: number; // 0.70–1.00
  offsetX: number; // px, ±3
  offsetY: number; // px, ±3
}

export function getCellPerturbation(cellId: string): CellPerturbation {
  const rand = seededRand(cellId);
  const rotation = (rand() - 0.5) * 8;
  const hasSkew = rand() < 0.3;
  const skewX = hasSkew ? (rand() - 0.5) * 24 : 0;
  const alignH = (["left", "center", "right"] as const)[
    Math.floor(rand() * 3)
  ]!;
  const alignV = (["top", "center", "bottom"] as const)[
    Math.floor(rand() * 3)
  ]!;
  const scale = 0.7 + rand() * 0.3;
  const offsetX = (rand() - 0.5) * 6;
  const offsetY = (rand() - 0.5) * 6;
  return { rotation, skewX, alignH, alignV, scale, offsetX, offsetY };
}

// 在銀色遮罩上繪製防偽底紋（粉紫斜線波浪），刮除時隨銀色層一起消除
export function drawAntiCounterfeitPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "#B06EC8";
  ctx.lineWidth = 0.9;

  const spacing = 8; // 線距（px）
  const amplitude = 2.5; // 波浪振幅
  const frequency = 0.28; // 波浪頻率

  // 45° 斜向波浪線，覆蓋整個 canvas
  for (let start = -height; start <= width; start += spacing) {
    ctx.beginPath();
    let started = false;
    for (let t = 0; t <= width + height; t += 2) {
      const x = start + t;
      const y = t + amplitude * Math.sin(t * frequency);
      if (x >= 0 && x <= width && y >= 0 && y <= height) {
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      } else if (started && y > height) {
        break;
      }
    }
    if (started) ctx.stroke();
  }

  ctx.restore();
}

// ── Canvas 常數 ──────────────────────────────────────────────────────────────
export const BRUSH_RADIUS = 24;
export const TOUCH_BRUSH_RADIUS = 40; // 手指觸控用
export const SAMPLING_STEP = 4; // 每 N 個 pixel 取樣一次（效能優化）

// 在指定座標以 destination-out 模式繪製圓形（刮除遮罩）
export function drawErase(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

// 填充銀色金屬漸層遮罩（水平漸層 + 像素 noise 模擬鋁箔質感）
export function drawSilverMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.globalCompositeOperation = "source-over";
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#9A9A9A");
  gradient.addColorStop(0.25, "#D8D8D8");
  gradient.addColorStop(0.5, "#F0F0F0");
  gradient.addColorStop(0.75, "#D8D8D8");
  gradient.addColorStop(1, "#9A9A9A");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 像素 noise ±30：模擬金屬鋁箔顆粒感
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 60;
    data[i]! = Math.min(255, Math.max(0, data[i]! + n));
    data[i + 1]! = Math.min(255, Math.max(0, data[i + 1]! + n));
    data[i + 2]! = Math.min(255, Math.max(0, data[i + 2]! + n));
  }
  ctx.putImageData(imageData, 0, 0);
}

// 計算已刮除（透明）像素的比例（0–1）
// step: 取樣間隔，越大越快但越不精確
export function calculateRevealedRatio(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  step = SAMPLING_STEP,
): number {
  if (width === 0 || height === 0) return 0;
  const { data } = ctx.getImageData(0, 0, width, height);
  let transparent = 0;
  let total = 0;
  for (let i = 3; i < data.length; i += 4 * step) {
    total++;
    if ((data[i] ?? 255) < 128) transparent++;
  }
  return total > 0 ? transparent / total : 0;
}
