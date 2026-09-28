import { useEffect, useState } from 'react'

/** Samples a per-frame value from the mutable world state into React at a throttled rate. */
export function useWorldValue<T>(read: () => T, hz = 8): T {
  const [v, setV] = useState(read)
  useEffect(() => {
    const id = window.setInterval(() => setV(read()), 1000 / hz)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hz])
  return v
}
