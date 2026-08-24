export function Hero() {
  return (
    <section className="relative flex h-screen flex-col justify-between px-6 pt-28 pb-12 md:px-12 md:pb-16">
      <div className="max-w-3xl">
        <p className="tracked-label mb-6">Dimensional Cut — Object Study 001–003</p>
        <h1 className="font-display text-[13vw] leading-[0.95] tracking-tight sm:text-[9vw] md:text-[6.4vw]">
          Every surface
          <br />
          hides a <span className="italic text-mute">structure.</span>
        </h1>
        <p className="mt-8 max-w-md text-[0.95rem] leading-relaxed text-mute">
          Three objects, held open at the seam. Scroll to watch each one close over what it was
          protecting — then scroll back to open it again.
        </p>
      </div>

      <div className="flex items-end justify-between">
        <div className="hidden text-[0.7rem] leading-relaxed text-mute-dim md:block">
          <p>Orb · Capsule · Prism</p>
          <p>Rendered live, react-three-fiber</p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <span className="tracked-label">Scroll to unfold</span>
          <div className="relative h-16 w-px overflow-hidden bg-line">
            <div className="absolute inset-x-0 top-0 h-1/2 w-full animate-[scrollcue_1.8s_ease-in-out_infinite] bg-paper" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollcue {
          0% { transform: translateY(-100%); }
          60% { transform: translateY(200%); }
          100% { transform: translateY(200%); }
        }
      `}</style>
    </section>
  )
}
