import { Fragment } from 'react'

/** Splits text into per-character spans for animation, keeping it readable to screen readers. */
export function Chars({ text, className = 'ch' }: { text: string; className?: string }) {
  const words = text.split(' ')
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, wi) => (
          <Fragment key={wi}>
            <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
              {Array.from(word).map((c, ci) => (
                <span key={ci} className={className}>
                  {c}
                </span>
              ))}
            </span>
            {wi < words.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </span>
    </>
  )
}
