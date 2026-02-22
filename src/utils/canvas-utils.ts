export const BRUSH_RADIUS = 24
export const SAMPLING_STEP = 4 // 每 N 個 pixel 取樣一次（效能優化）

// 在指定座標以 destination-out 模式繪製圓形（刮除遮罩）
export function drawErase(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

// 填充銀色金屬漸層遮罩
export function drawSilverMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.globalCompositeOperation = 'source-over'
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0,   '#C8C8C8')
  gradient.addColorStop(0.3, '#E8E8E8')
  gradient.addColorStop(0.6, '#B0B0B0')
  gradient.addColorStop(1,   '#D0D0D0')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

// 計算已刮除（透明）像素的比例（0–1）
// step: 取樣間隔，越大越快但越不精確
export function calculateRevealedRatio(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  step = SAMPLING_STEP,
): number {
  if (width === 0 || height === 0) return 0
  const { data } = ctx.getImageData(0, 0, width, height)
  let transparent = 0
  let total = 0
  for (let i = 3; i < data.length; i += 4 * step) {
    total++
    if ((data[i] ?? 255) < 128) transparent++
  }
  return total > 0 ? transparent / total : 0
}
