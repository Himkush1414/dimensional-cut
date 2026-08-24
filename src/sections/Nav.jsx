const LABELS = ['Index', 'Core Sample', 'Mechanism', 'Lattice', 'Close']

export function Nav({ activeIndex = 0 }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[1.05rem] tracking-tight">Dimensional</span>
        <span className="font-display text-[1.05rem] italic text-mute">Cut</span>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <span className="tracked-label tabular-nums">
          {String(activeIndex + 1).padStart(2, '0')} / {String(LABELS.length).padStart(2, '0')}
        </span>
        <span className="tracked-label text-paper/80">{LABELS[activeIndex]}</span>
      </div>

      <a
        href="#stage"
        className="tracked-label rounded-full border border-line px-4 py-2 transition-colors duration-300 hover:border-paper/40 hover:text-paper"
      >
        Unfold
      </a>
    </header>
  )
}
