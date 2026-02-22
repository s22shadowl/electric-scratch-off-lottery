import { useRef, useCallback, useEffect } from 'react'
import type { RefObject } from 'react'
import { createParticles, updateParticles, drawParticles } from '@/utils/particle-utils'
import type { Particle } from '@/utils/particle-utils'

export function useParticles(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
) {
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const animatingRef = useRef(false)

  const tick = useCallback(
    (time: number) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx || !canvas) return

      const elapsed = time - lastTimeRef.current
      const dt = Math.min(elapsed / 500, 0.08) // 每幀約 0.033（60fps）
      lastTimeRef.current = time

      particlesRef.current = updateParticles(particlesRef.current, dt)
      drawParticles(ctx, particlesRef.current, canvas.width, canvas.height)

      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        animatingRef.current = false
      }
    },
    [canvasRef],
  )

  const emit = useCallback(
    (x: number, y: number) => {
      if (!enabled) return
      particlesRef.current = [
        ...particlesRef.current,
        ...createParticles(x, y, 4),
      ]
      if (!animatingRef.current) {
        animatingRef.current = true
        lastTimeRef.current = performance.now()
        rafRef.current = requestAnimationFrame(tick)
      }
    },
    [enabled, tick],
  )

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return { emit }
}
