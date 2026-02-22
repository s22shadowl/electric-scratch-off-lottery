import { describe, it, expect, vi } from 'vitest'
import { createParticles, updateParticles, drawParticles } from './particle-utils'
import type { Particle } from './particle-utils'

// ── 測試輔助 ──────────────────────────────────────────────

function makeParticle(overrides: Partial<Particle> = {}): Particle {
  return {
    x: 10, y: 10, vx: 1, vy: -2,
    life: 0, size: 3, color: '#FFD700',
    ...overrides,
  }
}

function makeCtx() {
  return {
    clearRect: vi.fn(),
    fillStyle: '',
    globalAlpha: 1,
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D
}

// ── createParticles ───────────────────────────────────────

describe('createParticles', () => {
  it('應產生指定數量的粒子', () => {
    expect(createParticles(50, 30, 5)).toHaveLength(5)
  })

  it('所有粒子應從指定座標出發', () => {
    createParticles(50, 30, 10).forEach(p => {
      expect(p.x).toBe(50)
      expect(p.y).toBe(30)
    })
  })

  it('所有粒子初始 life 應為 0', () => {
    createParticles(0, 0, 5).forEach(p => expect(p.life).toBe(0))
  })

  it('粒子速度 vy 多數應向上（負值）', () => {
    const particles = createParticles(0, 0, 20)
    const upward = particles.filter(p => p.vy < 0)
    expect(upward.length).toBeGreaterThan(particles.length * 0.5)
  })

  it('count 預設值應為 5', () => {
    expect(createParticles(0, 0)).toHaveLength(5)
  })
})

// ── updateParticles ───────────────────────────────────────

describe('updateParticles', () => {
  it('應依速度更新座標（x += vx, y += vy）', () => {
    const [p] = updateParticles([makeParticle({ x: 10, y: 10, vx: 1, vy: -2 })], 0.02)
    expect(p!.x).toBe(11)
    expect(p!.y).toBe(8)
  })

  it('應套用重力（vy 增加）', () => {
    const [p] = updateParticles([makeParticle({ vy: -2 })], 0.02)
    expect(p!.vy).toBeGreaterThan(-2)
  })

  it('應累積 life', () => {
    const [p] = updateParticles([makeParticle()], 0.05)
    expect(p!.life).toBeCloseTo(0.05)
  })

  it('life >= 1 的粒子應被過濾掉', () => {
    const dying = makeParticle({ life: 0.99 })
    expect(updateParticles([dying], 0.05)).toHaveLength(0)
  })

  it('life < 1 的粒子應保留', () => {
    const alive = makeParticle({ life: 0.5 })
    expect(updateParticles([alive], 0.02)).toHaveLength(1)
  })

  it('不應修改原始陣列（不可變）', () => {
    const original = [makeParticle()]
    updateParticles(original, 0.05)
    expect(original[0]!.life).toBe(0)
  })
})

// ── drawParticles ─────────────────────────────────────────

describe('drawParticles', () => {
  it('應呼叫 clearRect 清除畫布', () => {
    const ctx = makeCtx()
    drawParticles(ctx, [], 100, 80)
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 100, 80)
  })

  it('每個粒子應繪製一個圓弧', () => {
    const ctx = makeCtx()
    const particles = [makeParticle(), makeParticle({ x: 20 })]
    drawParticles(ctx, particles, 100, 80)
    expect(ctx.arc).toHaveBeenCalledTimes(2)
  })

  it('完成後應將 globalAlpha 還原為 1', () => {
    const ctx = makeCtx()
    const particles = [makeParticle({ life: 0.5 })] // globalAlpha 會是 0.5
    drawParticles(ctx, particles, 100, 80)
    expect(ctx.globalAlpha).toBe(1)
  })

  it('空粒子陣列仍應清除畫布', () => {
    const ctx = makeCtx()
    drawParticles(ctx, [], 100, 80)
    expect(ctx.clearRect).toHaveBeenCalledOnce()
    expect(ctx.arc).not.toHaveBeenCalled()
  })
})
