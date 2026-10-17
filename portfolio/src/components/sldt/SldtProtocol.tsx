import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { audio } from '../../audio/VoidAudio'
import { state } from '../../engine/engine'

const STEPS = [
  {
    k: 'Identity',
    title: 'The recovery code is the account.',
    body: 'SLDT:<datasetId>:<secret>. No login, no password reset. Argon2id at 64 MiB stretches it into 64 bytes, split into an encryption key and a signing key, so a weakness in one can’t leak into the other. The secret never touches disk.',
  },
  {
    k: 'Seal',
    title: 'Every record travels sealed.',
    body: 'Padded up to a fixed bucket (256 B, 1 KB, 4 KB…) so the store learns only the bucket, not the exact length, then sealed with AES-256-GCM. The store receives bytes it can’t read and can’t change without being caught.',
  },
  {
    k: 'Manifest',
    title: 'One small index keeps everyone honest.',
    body: 'Every object, its revision and its ciphertext hash, in one manifest that is HMAC-signed, numbered, and chained to the hash of the one before it. Forge it and the signature fails. Replay an old one and the revision check fails. Both are hard stops.',
  },
  {
    k: 'Compare-and-swap',
    title: 'The store only has to do one smart thing.',
    body: 'Refuse a write if the file changed since you read it. Lose the race on the manifest and the whole cycle starts over with exponential backoff, 300 ms up to 8 s, re-reading what the other device wrote. Lose it on a single object and that sync stops; the next one pulls the other write and settles it.',
  },
  {
    k: 'Resolve',
    title: 'Conflicts settle the same way everywhere.',
    body: 'Higher revision wins. On a tie, the higher device id. Never the wall clock, which devices disagree on and anyone can fake. Two devices looking at the same pair pick the same winner without talking. Deletes are tombstones, kept forever, so nothing comes back.',
  },
]

export function SldtProtocol() {
  const section = useRef<HTMLElement>(null)
  const [step, setStep] = useState(0)
  const last = useRef(0)

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: section.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const s = Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length))
        if (s !== last.current) {
          last.current = s
          setStep(s)
          audio.blip(s + 1)
        }
      },
    })
    return () => st.kill()
  }, [])

  const on = (...s: number[]) => (s.includes(step) ? 'on' : '')

  return (
    <section className="proto" data-frame="protocol" ref={section} aria-labelledby="proto-h">
      <div className="proto-stage wrap">
        <div className="proto-copy backed">
          <p className="label" id="proto-h">
            <b>III.1–5</b>How it works
          </p>
          <ol className="proto-steps">
            {STEPS.map((s, i) => (
              <li key={s.k} className={i === step ? 'active' : i < step ? 'done' : ''}>
                <span className="proto-n">{i + 1}</span>
                <div>
                  <h3>
                    {s.title} <span className="proto-k">{s.k}</span>
                  </h3>
                  <p className="proto-body">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <svg className={`proto-svg step-${step}`} viewBox="0 0 800 560" role="img" aria-label={`Diagram, step ${step + 1}: ${STEPS[step].k}`}>
          <defs>
            <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
            </marker>
            <path id="p-a-store" d="M180,330 C220,420 280,450 330,452" />
            <path id="p-b-store" d="M620,330 C580,420 520,450 470,452" />
            <path id="p-id-a" d="M270,100 C200,120 150,150 130,205" />
            <path id="p-id-b" d="M530,100 C600,120 650,150 670,205" />
            <path id="p-retry" d="M470,440 C560,380 640,370 660,330" />
          </defs>

          {/* identity */}
          <g className={`g-id ${on(0)}`}>
            <rect x="270" y="20" width="260" height="96" rx="6" />
            <text x="400" y="52" className="t-mono t-center">SLDT:datasetId:secret</text>
            <text x="400" y="74" className="t-small t-center">Argon2id, 64 MiB, 3 passes</text>
            <text x="400" y="96" className="t-small t-center t-acc">64 bytes, split in two</text>
            <use href="#p-id-a" className="flow" />
            <use href="#p-id-b" className="flow" />
            {!state.reduced && step === 0 ? (
              <>
                <circle r="5" className="pkt">
                  <animateMotion dur="1.8s" repeatCount="indefinite">
                    <mpath href="#p-id-a" />
                  </animateMotion>
                </circle>
                <circle r="5" className="pkt">
                  <animateMotion dur="1.8s" repeatCount="indefinite" begin="0.3s">
                    <mpath href="#p-id-b" />
                  </animateMotion>
                </circle>
              </>
            ) : null}
          </g>

          {/* devices */}
          {[
            { x: 40, label: 'Laptop', id: 'a3f9' },
            { x: 590, label: 'Phone', id: 'c71e' },
          ].map((d) => (
            <g key={d.label} className="g-dev">
              <rect x={d.x} y="205" width="170" height="125" rx="6" />
              <text x={d.x + 16} y="232" className="t-label">
                {d.label}
              </text>
              <text x={d.x + 154} y="232" className="t-small t-end">
                id {d.id}
              </text>
              <g className={`keys ${on(0)}`}>
                <rect x={d.x + 16} y="248" width="64" height="22" rx="11" />
                <text x={d.x + 48} y="263" className="t-small t-center">
                  AES key
                </text>
                <rect x={d.x + 88} y="248" width="66" height="22" rx="11" />
                <text x={d.x + 121} y="263" className="t-small t-center">
                  HMAC key
                </text>
              </g>
              <text x={d.x + 16} y="306" className="t-small">
                IndexedDB
              </text>
            </g>
          ))}

          {/* store */}
          <g className="g-store">
            <rect x="280" y="380" width="240" height="150" rx="8" />
            <text x="296" y="404" className="t-label">
              The store
            </text>
            <text x="504" y="404" className="t-small t-end">
              public, and dumb
            </text>
            <g className={`cipher ${on(1, 2, 3, 4)}`}>
              <text x="296" y="430" className="t-mono t-dim">
                9f 3c a1 07 e2 5b 44 d0…
              </text>
              <text x="296" y="448" className="t-mono t-dim">
                note_0193.enc, ~400 B
              </text>
            </g>
            <g className={`chain ${on(2)}`}>
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <rect x={296 + i * 74} y="466" width="62" height="46" rx="4" />
                  <text x={327 + i * 74} y="485" className="t-small t-center">
                    r{3 + i}
                  </text>
                  <text x={327 + i * 74} y="502" className="t-small t-center t-acc">
                    signed
                  </text>
                  {i > 0 ? <path d={`M${296 + i * 74},489 L${284 + i * 74},489`} className="link" markerEnd="url(#ah)" /> : null}
                </g>
              ))}
            </g>
          </g>

          {/* seal */}
          <g className={`g-seal ${on(1)}`}>
            <use href="#p-a-store" className="flow" />
            <g transform="translate(70 140)">
              <rect width="44" height="40" rx="3" className="doc" />
              <text x="22" y="25" className="t-small t-center">
                note
              </text>
              <path d="M52,20 L80,20" className="link" markerEnd="url(#ah)" />
              <rect x="88" width="56" height="40" rx="3" className="doc" />
              <path d="M88,30 L144,30" className="pad" />
              <text x="116" y="18" className="t-small t-center">
                256 B
              </text>
            </g>
            {!state.reduced && step === 1 ? (
              <g className="pkt-env">
                <rect x="-9" y="-7" width="18" height="14" rx="2" />
                <animateMotion dur="2.2s" repeatCount="indefinite">
                  <mpath href="#p-a-store" />
                </animateMotion>
              </g>
            ) : null}
          </g>

          {/* compare and swap */}
          <g className={`g-cas ${on(3)}`}>
            <use href="#p-a-store" className="flow" />
            <use href="#p-b-store" className="flow" />
            <use href="#p-retry" className="flow retry" />
            <text x="190" y="440" className="t-mono t-acc">
              200, written
            </text>
            <text x="560" y="452" className="t-mono t-red">
              409, retry in 300 ms
            </text>
            {!state.reduced && step === 3 ? (
              <>
                <circle r="5" className="pkt">
                  <animateMotion dur="1.6s" repeatCount="indefinite">
                    <mpath href="#p-a-store" />
                  </animateMotion>
                </circle>
                <circle r="5" className="pkt red">
                  <animateMotion dur="1.6s" repeatCount="indefinite" begin="0.15s">
                    <mpath href="#p-b-store" />
                  </animateMotion>
                </circle>
              </>
            ) : null}
          </g>

          {/* resolve */}
          <g className={`g-res ${on(4)}`}>
            <rect x="250" y="150" width="130" height="34" rx="17" className="tag lose" />
            <text x="315" y="172" className="t-mono t-center">
              r4, a3f9
            </text>
            <rect x="420" y="150" width="130" height="34" rx="17" className="tag win" />
            <text x="485" y="172" className="t-mono t-center">
              r4, c71e ✓
            </text>
            <text x="400" y="210" className="t-small t-center">
              Same revision, so the higher device id wins, on both devices.
            </text>
          </g>
        </svg>
      </div>
    </section>
  )
}
