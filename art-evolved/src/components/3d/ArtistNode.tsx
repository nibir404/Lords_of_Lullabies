import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { GraphNode } from './graphLayout'

/** Billboard label for a graph node, painted to a small canvas. */
export function NodeLabel({ node, dim }: { node: GraphNode; dim: boolean }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 64
    const ctx = c.getContext('2d')!
    ctx.font = `${node.kind === 'movement' ? 600 : 400} 30px "Inter Tight", Helvetica, sans-serif`
    ctx.fillStyle = node.kind === 'movement' ? node.color : '#f2efe8'
    ctx.textBaseline = 'middle'
    ctx.fillText(node.kind === 'movement' ? node.label.toUpperCase() : node.label, 8, 32)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    return t
  }, [node])
  useEffect(() => () => tex.dispose(), [tex])
  const w = node.kind === 'movement' ? 16 : 11
  return (
    <sprite position={[node.x + w / 2 + node.size + 0.6, node.y, node.z]} scale={[w, w / 8, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} opacity={dim ? 0.2 : 0.95} toneMapped={false} />
    </sprite>
  )
}
