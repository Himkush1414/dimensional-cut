# Dimensional Cut

A scroll-driven study in cut-open form. Three objects — an orb, a capsule, a
faceted prism — are held open, revealing the structure inside. Scroll and
each one seals shut and hands off to the next; scroll back up and it opens
again. There's no timeline or state machine driving the reveal — every
object's motion is a pure function of scroll position, so reversing scroll
reverses the animation for free.

Live scene: React Three Fiber + Three.js. Scroll choreography: a single GSAP
ScrollTrigger driving one continuous progress value, smoothed by Lenis.

## Stack

- React 19 + Vite
- Tailwind CSS v4
- Three.js via `@react-three/fiber` and `@react-three/drei`
- GSAP + ScrollTrigger
- Lenis (smooth scroll)

## Getting started

```bash
npm install
npm run dev
```

```bash
npm run build   # production build
npm run preview # preview the production build
npm run lint    # oxlint
```

## How the motion works

`src/lib/sceneState.js` holds a single mutable `t` (0–1) updated once per
frame from a GSAP ScrollTrigger spanning the three object sections
(`src/App.jsx`). `computeMotion(t, index, count)` derives, per object, a
`weight` (how visible it is) and `sealProgress` (how closed it is) — purely
from `t`, with no side effects or stored history. Each object's `useFrame`
reads this every frame to drive its own opacity, scale, and shell motion, so
scrolling up is not a special case, it's just `t` decreasing.

Two different "cut open" mechanics live side by side on purpose, so the page
doesn't read as one effect repeated three times:

- **Orb** and **Capsule** (`src/three/objects/`) are hinge-split shells —
  two halves that physically separate and rotate open.
- **Prism** dissolves instead: its facets go from transparent/glassy to an
  opaque, metallic seal via material properties, no geometry split.

All three share `Core.jsx`, the wireframe-and-node "interior" they reveal
when open, so the visual language stays consistent even though the seal
mechanic differs.
