import { useEffect } from 'react'
import { ambient } from '@/audio/AmbientEngine'
import { MOVEMENTS } from '@/data/movements'
import type { SoundProfile } from '@/data/types'
import { useStore, type ViewId } from '@/state/store'

const VIEW_SOUND: Record<Exclude<ViewId, 'timeline'>, SoundProfile> = {
  landing: 'dream',
  evolution: 'acoustic',
  morph: 'organic',
  media: 'machine',
  map: 'generative',
  finale: 'neural',
  create: 'generative',
}

export function useSoundSync() {
  const sound = useStore((s) => s.sound)
  const view = useStore((s) => s.view)
  const index = useStore((s) => s.activeIndex)
  const profile: SoundProfile = view === 'timeline' ? MOVEMENTS[index].visual.sound : VIEW_SOUND[view]
  useEffect(() => {
    if (sound) void ambient.enable(profile)
    else ambient.disable()
    // Profile changes are handled below; enabling only reacts to the toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound])
  useEffect(() => {
    if (sound) ambient.setProfile(profile)
  }, [profile, sound])
}
