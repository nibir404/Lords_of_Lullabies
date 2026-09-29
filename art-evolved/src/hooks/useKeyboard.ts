import { useEffect } from 'react'
import { MOVEMENTS } from '@/data/movements'
import { useStore } from '@/state/store'
import { world } from '@/state/world'
import { clamp } from '@/utils/math'

const isTyping = (el: Element | null) => !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable || el.getAttribute('role') === 'slider')

/**
 * ← / → travel, Enter explores, Esc steps back, ⌘K or / searches, M opens the menu, R is a random
 * journey, +/− zooms, Home/End jump to the ends of the corridor.
 */
export function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState()
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        s.setSearchOpen(!s.searchOpen)
        return
      }
      const modal = s.searchOpen || s.menuOpen || s.artistId !== null || s.artistsOpen || s.filmOpen
      if (modal || isTyping(document.activeElement)) return
      if (s.view === 'create') {
        if (e.key === 'Escape') s.setView('timeline')
        return
      }
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          if (s.view === 'timeline') {
            e.preventDefault()
            s.next()
          } else if (s.view === 'evolution' || s.view === 'morph' || s.view === 'media') {
            e.preventDefault()
            s.setSlider(s.view, clamp(s.sliders[s.view] + 0.05))
          }
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          if (s.view === 'timeline') {
            e.preventDefault()
            s.prev()
          } else if (s.view === 'evolution' || s.view === 'morph' || s.view === 'media') {
            e.preventDefault()
            s.setSlider(s.view, clamp(s.sliders[s.view] - 0.05))
          }
          break
        case 'Home':
          if (s.view === 'timeline') s.goToIndex(0)
          break
        case 'End':
          if (s.view === 'timeline') s.goToIndex(MOVEMENTS.length - 1)
          break
        case 'Enter':
          if (s.view === 'landing') s.setView('timeline')
          else if (s.view === 'timeline' && document.activeElement === document.body) s.toggleExplore()
          break
        case 'Escape':
          if (s.exploring) s.setExploring(false)
          else if (s.view !== 'timeline' && s.view !== 'landing') s.setView('timeline')
          break
        case '/':
          e.preventDefault()
          s.setSearchOpen(true)
          break
        case 'm':
        case 'M':
          s.setMenuOpen(true)
          break
        case 'r':
        case 'R':
          s.surpriseMe()
          break
        case '+':
        case '=':
          world.zoom = clamp(world.zoom - 0.15, -0.5, 0.9)
          break
        case '-':
        case '_':
          world.zoom = clamp(world.zoom + 0.15, -0.5, 0.9)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
