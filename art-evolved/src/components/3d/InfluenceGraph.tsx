import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { BufferAttribute, BufferGeometry, Color, Group, InstancedMesh, LineBasicMaterial, Object3D } from 'three'
import { RELATION_COLORS } from '@/data/relations'
import { useStore } from '@/state/store'
import { getGraph, type GraphNode, type NodeKind } from './graphLayout'
import { NodeLabel } from './ArtistNode'

const KIND_GEOMETRY: Record<NodeKind, JSX.Element> = {
  movement: <octahedronGeometry args={[1, 0]} />,
  artist: <sphereGeometry args={[1, 12, 10]} />,
  technology: <boxGeometry args={[1.4, 1.4, 1.4]} />,
}

function NodeSet({ kind, nodes, focus, onHover, onSelect }: {
  kind: NodeKind
  nodes: GraphNode[]
  focus: Set<string> | null
  onHover: (n: GraphNode | null) => void
  onSelect: (n: GraphNode) => void
}) {
  const ref = useRef<InstancedMesh>(null)
  const tmp = useMemo(() => ({ o: new Object3D(), c: new Color() }), [])
  useEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    nodes.forEach((n, i) => {
      tmp.o.position.set(n.x, n.y, n.z)
      tmp.o.scale.setScalar(n.size)
      tmp.o.updateMatrix()
      mesh.setMatrixAt(i, tmp.o.matrix)
      tmp.c.set(n.color)
      if (focus && !focus.has(n.id)) tmp.c.multiplyScalar(0.18)
      mesh.setColorAt(i, tmp.c)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [nodes, focus, tmp])

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, nodes.length]}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        if (e.instanceId !== undefined) onHover(nodes[e.instanceId])
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        if (e.instanceId !== undefined) onSelect(nodes[e.instanceId])
      }}
    >
      {KIND_GEOMETRY[kind]}
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

/** Movements, artists and technologies as nodes; relations as coloured edges; fully explorable. */
export function InfluenceGraph() {
  const graph = useMemo(() => getGraph(), [])
  const selected = useStore((s) => s.mapSelected)
  const filters = useStore((s) => s.mapFilters)
  const select = useStore((s) => s.selectMapNode)
  const [hover, setHover] = useState<GraphNode | null>(null)
  const group = useRef<Group>(null)

  const focus = useMemo(() => {
    if (!selected) return null
    const idx = graph.index.get(selected)
    if (idx === undefined) return null
    const set = new Set<string>([selected])
    for (const e of graph.edges) {
      if (!filters[e.type]) continue
      if (e.a === idx) set.add(graph.nodes[e.b].id)
      if (e.b === idx) set.add(graph.nodes[e.a].id)
    }
    return set
  }, [selected, graph, filters])

  const lines = useMemo(() => {
    const visible = graph.edges.filter((e) => filters[e.type])
    const pos = new Float32Array(visible.length * 6)
    const col = new Float32Array(visible.length * 6)
    const c = new Color()
    const selIdx = selected ? graph.index.get(selected) : undefined
    visible.forEach((e, i) => {
      const A = graph.nodes[e.a], B = graph.nodes[e.b]
      pos.set([A.x, A.y, A.z, B.x, B.y, B.z], i * 6)
      c.set(RELATION_COLORS[e.type])
      const on = selIdx === undefined || e.a === selIdx || e.b === selIdx
      c.multiplyScalar(on ? (selIdx === undefined ? 0.55 : 1.1) : 0.07)
      col.set([c.r, c.g, c.b, c.r, c.g, c.b], i * 6)
    })
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('color', new BufferAttribute(col, 3))
    return g
  }, [graph, filters, selected])
  const lineMat = useMemo(() => new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, toneMapped: false }), [])
  useEffect(() => () => lines.dispose(), [lines])
  useEffect(() => () => lineMat.dispose(), [lineMat])

  useFrame((_, dt) => {
    if (group.current && !selected && !hover && !useStore.getState().reducedMotion) group.current.rotation.y += dt * 0.02
  })

  const byKind = useMemo(() => {
    const out: Record<NodeKind, GraphNode[]> = { movement: [], artist: [], technology: [] }
    graph.nodes.forEach((n) => out[n.kind].push(n))
    return out
  }, [graph])

  return (
    <group ref={group}>
      <lineSegments geometry={lines} material={lineMat} />
      {(Object.keys(byKind) as NodeKind[]).map((k) => (
        <NodeSet key={k} kind={k} nodes={byKind[k]} focus={focus} onHover={setHover} onSelect={(n) => select(n.id === selected ? null : n.id)} />
      ))}
      {byKind.movement.map((n) => (
        <NodeLabel key={n.id} node={n} dim={!!focus && !focus.has(n.id)} />
      ))}
      {focus &&
        byKind.artist
          .filter((n) => focus.has(n.id))
          .map((n) => <NodeLabel key={n.id} node={n} dim={false} />)}
      {hover && (
        <Html position={[hover.x, hover.y + hover.size + 1.2, hover.z]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="whitespace-nowrap border border-fg/30 bg-panel px-3 py-1.5 font-sans text-[11px] uppercase tracking-museum text-fg">
            {hover.label} <span className="text-fg/50">· {hover.kind}</span>
          </div>
        </Html>
      )}
    </group>
  )
}
