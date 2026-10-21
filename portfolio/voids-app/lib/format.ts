export const gb = (n: number) => (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)) + ' GB'

/** Indian grouping: ₹12,34,567 */
export function inr(n: number) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

/** ₹ in lakh for large figures: ₹8.5 L */
export function lakh(n: number) {
  return '₹' + (n / 1e5).toLocaleString('en-IN', { maximumFractionDigits: n >= 1e7 ? 0 : 1 }) + ' L'
}

export const times = (a: number, b: number) => {
  const r = a / b
  return (r >= 10 ? r.toFixed(0) : r.toFixed(1)) + '×'
}
