// Mutable, non-reactive store. Read every frame inside useFrame callbacks so
// scroll-driven motion never triggers a React re-render.
export const sceneState = {
  t: 0, // 0..1 progress through the pinned object stage
  mx: 0, // normalized mouse x, -1..1
  my: 0, // normalized mouse y, -1..1
  reducedMotion: false,
}

const smoothstep = (edge0, edge1, x) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * Derives per-object motion from the single global scroll progress `t`.
 * Each of `count` objects owns an equal slice of `t`. Within its slice an
 * object opens, idles, then seals shut while the next object simultaneously
 * fades in already-open — a continuous handoff with no timeline/state
 * machine, so scrolling up reverses it for free.
 */
export function computeMotion(t, index, count) {
  const clampedT = Math.min(Math.max(t, 0), 1)
  const activeFloat = Math.min(clampedT * count, count - 1e-4)
  const floorIndex = Math.floor(activeFloat)
  const localT = activeFloat - floorIndex
  const isLast = index === count - 1

  let weight = 0
  let sealProgress = 0

  if (index === floorIndex) {
    sealProgress = smoothstep(0.12, 0.72, localT)
    weight = isLast ? 1 : 1 - smoothstep(0.8, 1, localT)
  } else if (index === floorIndex + 1) {
    weight = smoothstep(0.8, 1, localT)
    sealProgress = 0
  }

  return { weight, sealProgress }
}
