// The two pages of the site, as the running head and the chapter sheet see them.
// Each section's key is its data-frame, which also gives its depth.
import { projects } from './content'
import type { Target } from './lib/nav'

export type ChapterRow = { key: string; num: string; title: string; target: Target; children?: ChapterRow[] }

export type SiteNav = {
  /** The running head for each section: numeral, title. */
  heads: Record<string, [string, string]>
  /** The contents, for the chapter sheet. */
  contents: ChapterRow[]
  /** The header's links on wide screens. */
  links: { label: string; to: Target; external?: boolean }[]
  /** Where the wordmark goes: the top of this page, or home. */
  home: Target
  /** The phone's running head on the opening screen. */
  opening: { num: string; title: string; name: string }
}

const SOURCE = 'https://github.com/yashwanth-1729/Jarvis-V2/tree/main/jarvis-oss/sldt'

export const PORTFOLIO: SiteNav = {
  heads: {
    hero: ['', 'Plate I'],
    about: ['I.', 'Orientation'],
    work: ['II.', 'Debris'],
    jarvis: ['II.1', 'JARVIS'],
    hospital: ['II.2', 'Hospital Automation'],
    clutchhub: ['II.3', 'ClutchHub'],
    sldt: ['II.4', 'SIDS'],
    sidsDoor: ['III.', 'SIDS'],
    orbit: ['IV.', 'The photon sphere'],
    contact: ['V.', 'The horizon'],
  },
  contents: [
    { key: 'about', num: 'I.', title: 'Orientation', target: '[data-frame="about"]' },
    {
      key: 'work',
      num: 'II.',
      title: 'Debris',
      target: '#work',
      children: projects.map((p, i) => ({ key: p.id, num: `II.${i + 1}`, title: p.title, target: `#${p.id}` })),
    },
    {
      key: 'sidsDoor',
      num: 'III.',
      title: 'SIDS',
      target: '#sids-door',
      children: [{ key: 'sidsPage', num: '→', title: 'Its own page', target: '/sids' }],
    },
    { key: 'orbit', num: 'IV.', title: 'The photon sphere', target: '#orbit' },
    { key: 'contact', num: 'V.', title: 'The horizon', target: '#contact' },
  ],
  links: [
    { label: 'Work', to: '#work' },
    { label: 'SIDS', to: '/sids' },
    { label: 'Contact', to: '#contact' },
  ],
  home: 0,
  opening: { num: 'I–V', title: 'Contents', name: 'Contents, chapters I to V' },
}

export const SIDS: SiteNav = {
  heads: {
    sidsHero: ['', 'SIDS'],
    sidsWhy: ['01', 'Why it exists'],
    protocol: ['02', 'How it works'],
    sidsLab: ['03', 'Try it'],
    sidsNotes: ['04', 'Field notes'],
    sidsEnd: ['05', 'Use it'],
  },
  contents: [
    { key: 'sidsWhy', num: '01', title: 'Why it exists', target: '#why' },
    { key: 'protocol', num: '02', title: 'How it works', target: '#how' },
    { key: 'sidsLab', num: '03', title: 'Try it', target: '#try' },
    { key: 'sidsNotes', num: '04', title: 'Field notes', target: '#notes' },
    { key: 'sidsEnd', num: '05', title: 'Use it', target: '#use' },
    { key: 'portfolio', num: '←', title: 'The portfolio', target: '/' },
  ],
  links: [
    { label: 'Portfolio', to: '/' },
    { label: 'How it works', to: '#how' },
    { label: 'Try it', to: '#try' },
    { label: 'Source', to: SOURCE, external: true },
  ],
  home: '/',
  opening: { num: '01–05', title: 'SIDS', name: 'SIDS, all parts' },
}

export const SIDS_SOURCE = SOURCE
