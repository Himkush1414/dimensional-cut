import { forwardRef } from 'react'

export const Cta = forwardRef(function Cta(_, ref) {
  return (
    <section ref={ref} className="relative flex min-h-screen flex-col justify-between px-6 pt-32 pb-8 md:px-12">
      <div className="max-w-2xl">
        <p className="tracked-label mb-6">04 — Close</p>
        <h2 className="font-display text-[3rem] leading-[1.02] tracking-tight sm:text-[4.2rem]">
          Nothing stays open <span className="italic text-mute">forever.</span>
        </h2>
        <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-mute">
          That's the study — surfaces built to seal what they carry, and to reveal it again the
          moment someone bothers to look. Build the version of this for your own product.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#stage"
            className="rounded-full bg-paper px-6 py-3 text-[0.8rem] font-medium tracking-wide text-ink transition-transform duration-300 hover:-translate-y-0.5"
          >
            Open it again
          </a>
          <a
            href="https://github.com/Himkush1414/dimensional-cut"
            target="_blank"
            rel="noreferrer"
            className="tracked-label rounded-full border border-line px-6 py-3 transition-colors duration-300 hover:border-paper/40 hover:text-paper"
          >
            View source
          </a>
        </div>
      </div>

      <footer className="mt-24 flex flex-col gap-4 border-t border-line pt-6 text-[0.7rem] text-mute-dim sm:flex-row sm:items-center sm:justify-between">
        <p>Dimensional Cut — a scroll study in cut-open form.</p>
        <p>Three.js · React Three Fiber · GSAP ScrollTrigger</p>
      </footer>
    </section>
  )
})
