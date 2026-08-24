import { forwardRef } from 'react'

const ALIGN = {
  left: 'items-start text-left',
  right: 'items-end text-right ml-auto',
}

export const ObjectSection = forwardRef(function ObjectSection(
  { index, eyebrow, title, accentWord, body, meta, align = 'left', accentColor },
  ref,
) {
  return (
    <section className="relative h-[220vh]">
      <div ref={ref} className="sticky top-0 flex h-screen items-center px-6 md:px-12">
        <div className={`flex w-full max-w-md flex-col ${ALIGN[align]}`}>
          <div className="mb-5 flex items-center gap-3">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: accentColor, boxShadow: `0 0 12px 2px ${accentColor}` }}
            />
            <span className="tracked-label">
              {String(index + 1).padStart(2, '0')} — {eyebrow}
            </span>
          </div>

          <h2 className="font-display text-[2.6rem] leading-[1.02] tracking-tight sm:text-[3.2rem]">
            {title} <span className="italic text-mute">{accentWord}</span>
          </h2>

          <p className="mt-6 text-[0.95rem] leading-relaxed text-mute">{body}</p>

          {meta && (
            <div className="mt-8 flex flex-col gap-1 border-t border-line pt-4 text-[0.7rem] text-mute-dim">
              {meta.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
})
