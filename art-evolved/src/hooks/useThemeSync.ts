import { useEffect } from 'react'
import { MOVEMENTS } from '@/data/movements'
import { VIEW_CONFIG } from '@/components/3d/viewConfig'
import { useStore } from '@/state/store'
import { hexToRgbTriplet, mixHex } from '@/utils/color'
import { resolveStyle } from '@/components/3d/styleTarget'
import type { UiTheme } from '@/data/types'

/** Pushes the active chamber's palette and interface theme into CSS — the UI evolves with the art. */
export function useThemeSync() {
  const view = useStore((s) => s.view)
  const index = useStore((s) => s.activeIndex)
  const idle = useStore((s) => s.uiIdle)
  const device = useStore((s) => s.device)
  // Wings whose atmosphere changes with a slider need the interface to follow for contrast.
  const sliderKey = useStore((s) => (view === 'evolution' || view === 'morph' || view === 'media' ? Math.round(s.sliders[view] * 40) + s.mediaTab + s.evolutionPair : ''))
  useEffect(() => {
    const root = document.documentElement
    let bg: string, fg: string, accent: string, ui: UiTheme
    if (view === 'timeline' || device === 'mobile') {
      const m = MOVEMENTS[index].visual
      ;({ bg, ink: fg, accent } = m.palette)
      ui = m.ui
    } else if (view === 'create') {
      ;[bg, fg, accent, ui] = ['#0d0d0f', '#f2efe8', '#e0482f', 'generative']
    } else {
      const c = VIEW_CONFIG[view]
      const st = resolveStyle()
      ;[bg, fg, accent, ui] = [mixHex(st.bgA, st.bgB, st.mix), mixHex(st.inkA, st.inkB, st.mix), c.accent, view === 'map' || view === 'finale' ? 'generative' : 'museum']
    }
    root.style.setProperty('--bg', hexToRgbTriplet(bg))
    root.style.setProperty('--fg', hexToRgbTriplet(fg))
    root.style.setProperty('--accent', hexToRgbTriplet(accent))
    root.style.setProperty('--panel', hexToRgbTriplet(mixHex(bg, fg, 0.04)))
    root.dataset.ui = ui
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
  }, [view, index, device, sliderKey])
  useEffect(() => {
    document.documentElement.dataset.idle = String(idle)
  }, [idle])
}
