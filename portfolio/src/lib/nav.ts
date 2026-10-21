import { focusTarget, scrollToTarget } from '../engine/engine'

/** A target is a place on this page (a selector, or 0 for the top) or another page ("/sids"). */
export type Target = string | number

/** Another page on the site, or off it: the browser follows these links itself. */
export const isPage = (to: Target) => typeof to === 'string' && (to.startsWith('/') || to.startsWith('http'))

/** Go there: another page by navigation, a place on this page by the fall, with focus handed to its heading. */
export function goTo(to: Target) {
  if (isPage(to)) {
    window.location.assign(to as string)
    return
  }
  scrollToTarget(to)
  focusTarget(to)
}

/** For a link's onClick: in-page targets scroll; pages are left to the browser, so new-tab clicks still work. */
export function follow(to: Target) {
  return (e: React.MouseEvent) => {
    if (isPage(to)) return
    e.preventDefault()
    goTo(to)
  }
}
