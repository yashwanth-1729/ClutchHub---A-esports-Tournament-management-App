import { SOURCES, type SourceId } from '@/data/sources'

/** One section of the talk: an index, a label, a headline, the content, and its sources. */
export function Slide({
  id,
  n,
  label,
  title,
  lede,
  sources = [],
  children,
  className = '',
}: {
  id: string
  n?: string
  label?: string
  title?: React.ReactNode
  lede?: React.ReactNode
  sources?: SourceId[]
  children?: React.ReactNode
  className?: string
}) {
  return (
    <section id={id} className={`slide relative flex flex-col justify-center px-5 pb-20 pt-20 md:px-16 lg:px-24 ${className}`} aria-labelledby={title ? `${id}-h` : undefined}>
      <div className="mx-auto w-full max-w-[1320px]">
        {label ? (
          <p className="label mb-5">
            {n ? <span className="mr-3 text-warm">{n}</span> : null}
            {label}
          </p>
        ) : null}
        {title ? (
          <h2 id={`${id}-h`} className="display max-w-[26ch] text-[clamp(28px,3.3vw,54px)] leading-[1.02] font-[720] text-ink">
            {title}
          </h2>
        ) : null}
        {lede ? <p className="mt-5 max-w-[70ch] text-[clamp(16px,1.15vw,19px)] leading-relaxed text-ink-2">{lede}</p> : null}
        {children}
        {sources.length ? <SourceList ids={sources} /> : null}
      </div>
    </section>
  )
}

export function SourceList({ ids }: { ids: SourceId[] }) {
  return (
    <div className="mt-10 border-t border-rule pt-4">
      <p className="label mb-2">Sources</p>
      <ol className="grid gap-x-8 gap-y-1 text-[12.5px] leading-snug text-ink-3 md:grid-cols-2">
        {ids.map((id) => {
          const s = SOURCES[id]
          return (
            <li key={id} className="flex gap-2">
              <span className="font-mono text-warm/80">[{s.n}]</span>
              <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-rule underline-offset-2 hover:text-ink hover:decoration-ink-3">
                {s.title}
              </a>
              <span className="whitespace-nowrap">· {s.publisher}, {s.date}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** An inline citation: [n], linked to the source. */
export function Cite({ id }: { id: SourceId }) {
  const s = SOURCES[id]
  return (
    <a href={s.url} target="_blank" rel="noreferrer" title={`${s.title} · ${s.publisher}, ${s.date}`} className="ml-0.5 align-super font-mono text-[0.62em] text-warm/90 no-underline hover:text-warm">
      [{s.n}]
    </a>
  )
}

/** Evidence, estimate, or target: every number on the page carries one of these. */
export function Tag({ kind }: { kind: 'evidence' | 'estimate' | 'target' | 'illustrative' | 'indicative' }) {
  const map = {
    evidence: 'border-ok/40 text-ok',
    estimate: 'border-warn/40 text-warn',
    target: 'border-warm/50 text-warm',
    illustrative: 'border-cool/40 text-cool',
    indicative: 'border-warn/40 text-warn',
  } as const
  const text = { evidence: 'Published evidence', estimate: 'Calculated estimate', target: 'Target, not a result', illustrative: 'Illustrative', indicative: 'Indicative price' }[kind]
  return <span className={`label inline-block rounded-full border px-2 py-0.5 text-[10px] ${map[kind]}`}>{text}</span>
}
