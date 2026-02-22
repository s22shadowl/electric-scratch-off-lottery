// 金色系粒子顏色池
const PARTICLE_COLORS = ['#FFD700', '#FFA500', '#FFE44D', '#FFF5CC', '#FF9F43']

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number   // 0–1，達 1 時死亡
  size: number
  color: string
}

// 在指定座標發射 count 個粒子
export function createParticles(x: number, y: number, count = 5): Particle[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = 1.5 + Math.random() * 2.5
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.5, // 整體偏向上飛
      life: 0,
      size: 2.5 + Math.random() * 3,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]!,
    }
  })
}

// 依 dt（每幀增量，建議 0.02–0.05）更新所有粒子，過濾掉死亡粒子（不可變）
export function updateParticles(particles: Particle[], dt: number): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.15, // 重力加速
      life: p.life + dt,
    }))
    .filter(p => p.life < 1)
}

// 將所有粒子繪製至 canvas（先清除）
export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height)
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.life)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}
