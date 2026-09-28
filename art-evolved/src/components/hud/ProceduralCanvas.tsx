import { useEffect, useRef, useState } from 'react'
import type { Movement } from '@/data/types'
import { paintInto } from '@/art/painters'
import { cn } from '@/lib/utils'

/** A canvas painted by a procedural painter, only once it scrolls into view. */
export function ProceduralCanvas({ movement, seed, painter, width, height, className, label }: {
  movement: Movement
  seed: string | number
  painter?: string
  width: number
  height: number
  className?: string
  label?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!visible || !ref.current) return
    const id = requestAnimationFrame(() => ref.current && paintInto(ref.current, movement, seed, painter))
    return () => cancelAnimationFrame(id)
  }, [visible, movement, seed, painter])
  return <canvas ref={ref} width={width} height={height} className={cn('block h-full w-full', className)} role="img" aria-label={label ?? `Procedural interpretation of ${movement.name}`} />
}
