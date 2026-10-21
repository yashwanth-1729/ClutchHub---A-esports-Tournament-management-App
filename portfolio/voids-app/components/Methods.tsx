import { CONTAMINATION, METHODS } from '@/data/methods'
import { Cite } from './Slide'

export function Methods() {
  return (
    <div className="mt-12 grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
      <div className="grid gap-3 md:grid-cols-2">
        {METHODS.map((m) => (
          <div key={m.name} className="rounded-xl border border-rule bg-panel p-5">
            <p className="display text-[19px] font-[650]">
              {m.name}
              <Cite id={m.source} />
            </p>
            <p className="mt-1 text-[14px] text-ink-2">{m.what}</p>
            <p className="mt-3 border-l-2 border-ok/60 pl-3 text-[13.5px] leading-snug text-ink">{m.fact}</p>
            <p className="mt-2 border-l-2 border-bad/50 pl-3 text-[13px] leading-snug text-ink-3">{m.limit}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-rule p-5">
        <p className="label mb-3">Why contamination control is not optional</p>
        <ul className="grid gap-4 text-[14px] leading-snug text-ink-2">
          {CONTAMINATION.map((c) => (
            <li key={c.source}>
              {c.fact}
              <Cite id={c.source} />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13.5px] leading-snug text-ink">
          So VOIDS is scored on tasks written after the base model’s release, with n-gram and embedding de-duplication against training data, and every failure reported.
        </p>
      </div>
    </div>
  )
}
