import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { sceneState } from './lib/sceneState'
import { useActiveSection } from './hooks/useActiveSection'
import { Scene } from './three/Scene'
import { Nav } from './sections/Nav'
import { Hero } from './sections/Hero'
import { ObjectSection } from './sections/ObjectSection'
import { Cta } from './sections/Cta'

gsap.registerPlugin(ScrollTrigger)

const SECTIONS = [
  {
    eyebrow: 'Core Sample',
    title: 'The orb, held',
    accentWord: 'open.',
    body: 'A shell in two halves, hinged at the seam. Inside: a lattice built to look like something worth protecting.',
    meta: ['Form — Sphere, equatorial cut', 'State — Open ↔ Sealed', 'Material — Ivory shell'],
    align: 'left',
    accentColor: '#d98c4f',
  },
  {
    eyebrow: 'Mechanism',
    title: 'The capsule,',
    accentWord: 'cracked.',
    body: 'Same idea, different geometry — a canister split through its barrel, dome caps drifting apart to expose what it carries.',
    meta: ['Form — Capsule, barrel cut', 'State — Open ↔ Sealed', 'Material — Brushed steel'],
    align: 'right',
    accentColor: '#6fd3c7',
  },
  {
    eyebrow: 'Lattice',
    title: 'The prism,',
    accentWord: 'dissolving.',
    body: 'No hinge this time — the facets themselves turn to glass, then seize back into opaque stone as the scroll closes it.',
    meta: ['Form — Icosahedron, faceted', 'State — Transparent ↔ Opaque', 'Material — Cut stone'],
    align: 'left',
    accentColor: '#b79af0',
  },
]

export default function App() {
  const heroRef = useRef(null)
  const stageRef = useRef(null)
  const sectionRefs = useRef(SECTIONS.map(() => ({ current: null })))
  const ctaRef = useRef(null)

  const observedRefs = useMemo(() => [heroRef, ...sectionRefs.current, ctaRef], [])
  const activeIndex = useActiveSection(observedRefs)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    sceneState.reducedMotion = reducedMotion

    const lenis = new Lenis({
      duration: reducedMotion ? 0.4 : 1.05,
      smoothWheel: !reducedMotion,
    })
    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const trigger = ScrollTrigger.create({
      trigger: stageRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        sceneState.t = self.progress
      },
    })

    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const progress = max > 0 ? window.scrollY / max : 0
      doc.style.setProperty('--scroll-progress', progress.toFixed(4))
    }
    lenis.on('scroll', onScroll)
    onScroll()

    const onPointerMove = (event) => {
      sceneState.mx = (event.clientX / window.innerWidth) * 2 - 1
      sceneState.my = -((event.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onPointerMove)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      gsap.ticker.remove(raf)
      trigger.kill()
      lenis.destroy()
    }
  }, [])

  return (
    <>
      <Scene />
      <div className="vignette" />
      <div className="grain" />
      <div className="progress-rail" />

      <Nav activeIndex={activeIndex} />

      <main className="relative z-10">
        <div ref={heroRef}>
          <Hero />
        </div>

        <div id="stage" ref={stageRef}>
          {SECTIONS.map((section, i) => (
            <ObjectSection
              key={section.eyebrow}
              ref={(el) => (sectionRefs.current[i].current = el)}
              index={i}
              {...section}
            />
          ))}
        </div>

        <Cta ref={ctaRef} />
      </main>
    </>
  )
}
