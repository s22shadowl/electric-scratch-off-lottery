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
