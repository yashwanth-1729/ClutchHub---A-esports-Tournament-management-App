import { state } from '../../engine/engine'

// Two ways to keep a laptop and a phone in step, drawn the same way so the
// difference is the only thing that changes: what sits in the middle, and what
// it can read of what passes through it.

type Kind = 'server' | 'sids'

function Devices() {
  return (
    <>
      {[
        { x: 8, label: 'Laptop' },
        { x: 262, label: 'Phone' },
      ].map((d) => (
        <g key={d.label} className="cmp-dev">
          <rect x={d.x} y="156" width="90" height="46" rx="5" />
          <text x={d.x + 45} y="184" className="t-label t-center">
            {d.label}
          </text>
        </g>
      ))}
    </>
  )
}

function Packet({ path, delay, kind }: { path: string; delay: number; kind: Kind }) {
  if (state.reduced) return null
  return (
    <g className={`cmp-pkt ${kind}`}>
      {kind === 'server' ? (
        <>
          <rect x="-30" y="-10" width="60" height="20" rx="3" />
          <text x="0" y="4" className="t-mono t-center">
            buy milk
          </text>
        </>
      ) : (
        <>
          <rect x="-9" y="-7" width="18" height="14" rx="2" />
          <path d="M-4,-7 v-3 a4,4 0 0 1 8,0 v3" className="cmp-shackle" />
        </>
      )}
      <animateMotion dur="3.2s" repeatCount="indefinite" begin={`${delay}s`} rotate="0">
        <mpath href={`#${path}`} />
      </animateMotion>
    </g>
  )
}

export function ComparePanel({ kind, id }: { kind: Kind; id: string }) {
  const a = `${id}-${kind}-a`
  const b = `${id}-${kind}-b`
  return (
    <svg className={`cmp-svg cmp-${kind}`} viewBox="0 0 360 214" role="img" aria-label={kind === 'server' ? 'The usual way: a laptop and a phone sync through a server that can read everything.' : 'SIDS: a laptop and a phone sync through a store that only ever holds sealed bytes.'}>
      <defs>
        <path id={a} d="M53,156 C60,110 100,84 136,80" />
        <path id={b} d="M224,80 C260,84 300,110 307,156" />
        <radialGradient id={`${id}-halo`}>
          <stop offset="55%" stopColor="rgb(var(--accent-rgb))" stopOpacity="0.28" />
          <stop offset="100%" stopColor="rgb(var(--accent-rgb))" stopOpacity="0" />
        </radialGradient>
      </defs>

      <use href={`#${a}`} className="cmp-flow" />
      <use href={`#${b}`} className="cmp-flow" />

      {kind === 'server' ? (
        <g className="cmp-server">
          <rect x="120" y="20" width="120" height="104" rx="6" />
          <text x="180" y="44" className="t-label t-center">
            Server
          </text>
          <text x="134" y="68" className="t-small">
            your notes
          </text>
          <text x="134" y="88" className="t-small">
            your password
          </text>
          <text x="134" y="108" className="t-small">
            who you are
          </text>
        </g>
      ) : (
        <g className="cmp-store">
          <circle cx="180" cy="74" r="62" fill={`url(#${id}-halo)`} />
          <circle cx="180" cy="74" r="44" className="cmp-ring" />
          <circle cx="180" cy="74" r="38" className="cmp-hole" />
          <text x="180" y="70" className="t-label t-center">
            Store
          </text>
          <text x="180" y="88" className="t-mono t-center t-dim cmp-cipher">
            9f 3c a1…
          </text>
        </g>
      )}

      <Devices />
      <Packet path={a} delay={0} kind={kind} />
      <Packet path={b} delay={1.6} kind={kind} />
    </svg>
  )
}

/** The usual way beside the SIDS way, with a line under each saying what the middle can do. */
export function CompareDiagram({ id }: { id: string }) {
  return (
    <div className="cmp">
      <figure className="cmp-col">
        <p className="label">
          <b>A</b>The usual way
        </p>
        <ComparePanel kind="server" id={id} />
        <figcaption>The server reads everything it stores. You trust it, or you don’t use it.</figcaption>
      </figure>
      <figure className="cmp-col">
        <p className="label">
          <b>B</b>SIDS
        </p>
        <ComparePanel kind="sids" id={id} />
        <figcaption>The store holds sealed bytes only. It can’t read them, and can’t change them without your devices noticing.</figcaption>
      </figure>
    </div>
  )
}
