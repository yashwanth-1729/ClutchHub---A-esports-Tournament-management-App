'use client'
import { useEffect, useState } from 'react'

/** true below 640px wide: charts shrink their label columns */
export function useNarrow() {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = matchMedia('(max-width: 640px)')
    const on = () => setNarrow(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return narrow
}
