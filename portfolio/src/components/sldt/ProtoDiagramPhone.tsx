import { state } from '../../engine/engine'

// The phone's version of the "How it works" figure: the same drawing language as
// the desktop diagram (thin rules, pencil flows, mono labels), redrawn for a
// 340-wide column. Laptop and phone sit side by side, the recovery code above
// them, the store below. Each step crossfades one state in; nothing else moves.

const P = {
  idA: 'M105,14 C88,14 78,24 78,43',
  idB: 'M235,14 C252,14 262,24 262,43',
  aStore: 'M40,101 C40,126 52,141 74,142',
  bStore: 'M300,101 C300,126 288,141 266,142',
  retry: 'M266,154 C298,160 322,146 322,102',
  bLoop: 'M300,101 C300,126 288,141 266,142 L266,154 C298,160 322,146 322,102',
}

const W = 156 // device width
const DEV = [
  { x: 0.5, name: 'Laptop', id: 'a3f9' },
  { x: 183.5, name: 'Phone', id: 'c71e' },
]

export function ProtoDiagramPhone({ step, label }: { step: number; label: string }) {
  const move = !state.reduced
  // on in these steps, faint in those, gone otherwise
  const st = (on: number[], dim: number[] = []) => `st${on.includes(step) ? ' on' : dim.includes(step) ? ' dim' : ''}`

  return (
    <svg className={`pd step-${step}`} viewBox="0 0 340 170" role="img" aria-label={label}>
      <defs>
        {(['', 'p', 'r'] as const).map((k) => (
          <marker key={k} id={`pd-ah${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className={`pd-ah${k}`} />
          </marker>
        ))}
      </defs>

      {/* the recovery code, and where it goes */}
      <g className={st([0], [1, 2, 3])}>
        <rect x="105.5" y="0.5" width="129" height="27" rx="6" className="code" />
        <text x="170" y="18.5" className="t-mono t-center">
          SLDT:id:secret
        </text>
      </g>
      <g className={st([0])}>
        <path d={P.idA} className="flow" markerEnd="url(#pd-ahp)" />
        <path d={P.idB} className="flow" markerEnd="url(#pd-ahp)" />
        {move && step === 0 ? (
          <>
            <circle r="4" className="pkt">
              <animateMotion dur="1.8s" repeatCount="indefinite" path={P.idA} />
            </circle>
            <circle r="4" className="pkt">
              <animateMotion dur="1.8s" repeatCount="indefinite" path={P.idB} />
            </circle>
          </>
        ) : null}
      </g>

      {/* the two devices */}
      {DEV.map((d, i) => (
        <g key={d.name}>
          <rect x={d.x} y="44.5" width={W} height="56" rx="6" />
          <text x={d.x + 12} y="63" className="t-label">
            {d.name}
          </text>
          <text x={d.x + W - 12} y="63" className="t-mono t-dim t-end">
            {d.id}
          </text>
          {/* the two keys: both lit as they are made, the signing key while the list is checked */}
          <g className={st(i === 0 ? [0, 2] : [0, 1, 2])}>
            <rect x={d.x + 14} y="72.5" width="60" height="19" rx="9.5" className={`pill${step === 0 ? ' lit' : ''}`} />
            <text x={d.x + 44} y="86" className={`t-small t-center${step === 0 ? '' : ' t-dim'}`}>
              lock key
            </text>
            <rect x={d.x + 82} y="72.5" width="60" height="19" rx="9.5" className={`pill${step === 0 || step === 2 ? ' lit' : ''}`} />
            <text x={d.x + 112} y="86" className={`t-small t-center${step === 0 || step === 2 ? '' : ' t-dim'}`}>
              sign key
            </text>
          </g>
        </g>
      ))}

      {/* the store */}
      <g>
        <rect x="75.5" y="118.5" width="189" height="51" rx="6" />
        <text x="87.5" y="136" className="t-label">
          The store
        </text>
        <text x="252.5" y="136" className="t-small t-end">
          can’t read
        </text>
      </g>
      <g className={st([0])}>
        <text x="87.5" y="157" className="t-mono t-dim">
          nothing yet
        </text>
      </g>
      <g className={st([1], [3, 4])}>
        <text x="87.5" y="157" className="t-mono t-dim">
          9f 3c a1 07 e2 5b 44…
        </text>
      </g>

      {/* 1: a note is locked and padded on the laptop, then sent */}
      <g className={st([1])}>
        <rect x="12.5" y="72.5" width="40" height="19" rx="3" className="doc" />
        <text x="32.5" y="86" className="t-small t-center">
          note
        </text>
        <path d="M57,82 L70,82" className="link" markerEnd="url(#pd-ah)" />
        <rect x="74.5" y="72.5" width="66" height="19" rx="3" className="block" />
        <path d="M83.5,80 V77.5 A2.5,2.5 0 0 1 88.5,77.5 V80" className="shackle" />
        <rect x="82" y="80" width="8" height="6.5" rx="1" className="lock" />
        <text x="116" y="86" className="t-mono t-center">
          256 B
        </text>
        <path d={P.aStore} className="flow" markerEnd="url(#pd-ahp)" />
        {move && step === 1 ? (
          <g className="env">
            <rect x="-7" y="-5" width="14" height="10" rx="2" />
            <animateMotion dur="2.2s" repeatCount="indefinite" path={P.aStore} />
          </g>
        ) : null}
      </g>

      {/* 2: the signed list, each version pointing back to the one before */}
      <g className={st([2])}>
        {[0, 1, 2].map((i) => {
          const x = 87.5 + i * 58
          return (
            <g key={i}>
              <rect x={x} y="143.5" width="46" height="19" rx="3" className={i === 2 ? 'latest' : ''} />
              <text x={x + 9} y="157" className="t-mono">
                v{3 + i}
              </text>
              <circle cx={x + 34} cy="153" r="4.5" className="seal" />
              <circle cx={x + 34} cy="153" r="2" className="seal-dot" />
              {i > 0 ? <path d={`M${x - 1},153 L${x - 11},153`} className="link" markerEnd="url(#pd-ah)" /> : null}
            </g>
          )
        })}
      </g>

      {/* 3: both write at once; the store takes one and turns the other away */}
      <g className={st([3])}>
        <text x="12.5" y="86" className="t-mono t-acc">
          saved
        </text>
        <text x="195.5" y="86" className="t-mono t-red">
          busy, tries again
        </text>
        <path d={P.aStore} className="flow" markerEnd="url(#pd-ahp)" />
        <path d={P.bStore} className="flow red" markerEnd="url(#pd-ahr)" />
        <path d={P.retry} className="flow red" markerEnd="url(#pd-ahr)" />
        {move && step === 3 ? (
          <>
            <circle r="4" className="pkt">
              <animateMotion dur="1.6s" repeatCount="indefinite" path={P.aStore} />
            </circle>
            <circle r="4" className="pkt red">
              <animateMotion dur="2.4s" repeatCount="indefinite" path={P.bLoop} />
            </circle>
          </>
        ) : null}
      </g>

      {/* 4: a real clash, settled the same way everywhere */}
      <g className={st([4])}>
        <text x="170" y="18.5" className="t-small t-center t-acc">
          a fixed rule picks; both agree
        </text>
        <rect x="28.5" y="72.5" width="100" height="19" rx="9.5" className="tag lose" />
        <text x="78.5" y="86" className="t-mono t-center t-dim">
          v4 · laptop
        </text>
        <rect x="207.5" y="72.5" width="108" height="19" rx="9.5" className="tag win" />
        <text x="261.5" y="86" className="t-mono t-center">
          v4 · phone ✓
        </text>
      </g>
    </svg>
  )
}
