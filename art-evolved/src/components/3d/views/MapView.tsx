import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useStore } from '@/state/store'
import { world } from '@/state/world'
import { InfluenceGraph } from '../InfluenceGraph'
import { VIEW_CONFIG } from '../viewConfig'

export default function MapView() {
  const controls = useRef<OrbitControlsImpl>(null)
  const [x, y, z] = VIEW_CONFIG.map.look
  useFrame(() => {
    if (controls.current) controls.current.enabled = useStore.getState().view === 'map' && !world.tweening
  })
  return (
    <group>
      <group position={[x, y, z]}>
        <InfluenceGraph />
      </group>
      <OrbitControls ref={controls} target={[x, y, z]} enableDamping dampingFactor={0.08} minDistance={25} maxDistance={320} enabled={false} makeDefault={false} />
    </group>
  )
}
