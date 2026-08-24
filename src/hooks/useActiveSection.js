import { useEffect, useState } from 'react'

/**
 * Tracks which registered section is nearest the vertical center of the
 * viewport. Used for lightweight wayfinding UI (nav counter, labels) that
 * doesn't need to be as precise as the frame-accurate 3D scroll motion.
 */
export function useActiveSection(refs) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const elements = refs.map((r) => r.current).filter(Boolean)
    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        let best = null
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry
        }
        if (best) {
          const index = elements.indexOf(best.target)
          if (index !== -1) setActive(index)
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [refs])

  return active
}
