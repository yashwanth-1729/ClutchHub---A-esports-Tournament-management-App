// Everything a visitor reads lives here. Rename the brand or add links in one place.

export const brand = {
  mark: 'VOIDBYTE',
  person: 'Yashwanth Raj Cherukuru',
  first: 'Yashwanth',
  role: 'Full-stack developer · UI/UX for web & mobile',
  location: 'India',
  timezone: 'Asia/Kolkata',
  availability: 'Open to remote freelance & internships',
}

export const links = {
  email: 'cherukuriyashwanthraj@gmail.com',
  github: 'https://github.com/yashwanth-1729',
  // Empty strings are hidden until filled in.
  instagram: 'https://www.instagram.com/yashwanthbuilds/',
  website: '',
  linkedin: '',
  resume: 'resume.pdf',
}

export type ProjectId = 'jarvis' | 'hospital' | 'clutchhub' | 'sldt'

export type Project = {
  id: ProjectId
  index: string
  title: string
  kicker: string
  lead: string
  /** Run-in head, then the paragraph. */
  built: [string, string][]
  stack: string[]
  source: string
  live: string
  original?: boolean
  figure: string
}

export const projects: Project[] = [
  {
    id: 'jarvis',
    index: 'II.1',
    title: 'JARVIS',
    kicker: 'A voice-first command center, for Windows and Android',
    lead: 'A private assistant for tasks, schedules, notes, memories and reminders that you mostly talk to. Built alone: a Tauri desktop app, and an Android app that runs the whole Python backend on the phone itself.',
    built: [
      ['Agent.', 'A loop over twenty-three core tools for tasks, schedules, notes and memories, plus shell and computer-control tools on the desktop, streaming its reply as it thinks.'],
      ['Voice.', 'Speech segmentation that survives pauses, synthesis sentence by sentence so the first words land fast, and playback in strict order, in English, Telugu and Hindi.'],
      ['Interface.', 'Conversational onboarding with swipeable personality cards and a weekly study-block planner, and a Three.js mascot whose face follows the session, down to a red lock-in mode.'],
      ['Memory.', 'Typed long-term memory with ranked retrieval, a scheduler that turns “class at five” into a spoken reminder, and local-first sync across devices.'],
    ],
    stack: ['Next.js', 'FastAPI', 'Tauri v2', 'Three.js', 'Kotlin'],
    source: 'https://github.com/yashwanth-1729/Jarvis-V2',
    live: '',
    figure: 'The mascot, redrawn for this page. It watches your cursor and greets you in English, Telugu or Hinglish, out loud, from somewhere inside the hole. Hold “lock in” and the rest of the page commits with it.',
  },
  {
    id: 'hospital',
    index: 'II.2',
    title: 'Hospital Automation',
    kicker: 'Booking, reminders and follow-ups',
    lead: 'Patient and staff interfaces, API webhooks, and a PostgreSQL-backed worker that books, reminds and follows up.',
    built: [
      ['Intake.', 'Idempotent: the same lead submitted twice is stored once.'],
      ['Booking.', 'Transactional slot locking, so two patients can never hold the same slot.'],
      ['Tests.', 'The booking workflows are covered with Vitest.'],
    ],
    stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Node.js'],
    source: 'https://github.com/yashwanth-1729/Hospital-Automation-System',
    live: '',
    figure: 'A morning of appointments. Pick a free slot and a second patient reaches for the same one at the same instant; one of you gets it, the other is refused.',
  },
  {
    id: 'clutchhub',
    index: 'II.3',
    title: 'ClutchHub',
    kicker: 'A Free Fire tournament platform',
    lead: 'Tournament creation, team registration, messaging, match scoring, and leaderboards that update live as each match’s results come in.',
    built: [
      ['Backend.', 'Operations moved into Next.js route handlers, with auth-based role checks and paginated APIs.'],
      ['Scoring.', 'Points calculated on the server, kills plus placement, ranked and pushed to the board live.'],
    ],
    stack: ['Next.js', 'React', 'TypeScript', 'Supabase'],
    source: 'https://github.com/yashwanth-1729/ClutchHub-frontend',
    live: '',
    figure: 'Six invented squads in a twelve-squad lobby. The squads are made up; the scoring rule is the real one.',
  },
  {
    id: 'sldt',
    index: 'II.4',
    title: 'SLDT',
    kicker: 'Encrypted sync, without a server',
    lead: 'Devices share encrypted state through storage that doesn’t know it’s a sync backend. No database, no session server, no login. The store serves bytes by path and refuses stale writes; it never sees plaintext and never holds a secret.',
    built: [
      ['Identity.', 'A recovery code is the account. Argon2id at 64 MiB turns it into two domain-separated keys, one to encrypt and one to sign.'],
      ['Integrity.', 'Records padded to size buckets and sealed with AES-256-GCM, indexed by a single HMAC-signed, hash-chained manifest that catches tampering, replay and rollback.'],
      ['Concurrency.', 'Compare-and-swap writes with exponential backoff. Conflicts settle by revision, then device id, never by the clock. Tombstones keep deletes deleted.'],
    ],
    stack: ['TypeScript', 'Web Crypto', 'Argon2id', 'IndexedDB', 'GitHub API'],
    source: 'https://github.com/yashwanth-1729/Jarvis-V2/tree/main/jarvis-oss/sldt',
    live: '',
    original: true,
    figure: 'What the store holds, and what your key reads. The ciphertext is real AES-256-GCM, made in your browser a moment ago. Drag the lens across it.',
  },
]

export const skills: { group: string; items: string[] }[] = [
  {
    group: 'Interface',
    items: [
      'Onboarding flows',
      'Animated dashboards',
      'Gesture-driven interactions',
      'Micro-interactions',
      'Mobile-first layouts',
      'UX copywriting',
      'Reduced-motion accessibility',
    ],
  },
  { group: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Three.js'] },
  {
    group: 'Backend & data',
    items: ['Node.js', 'FastAPI', 'Python', 'REST APIs', 'PostgreSQL', 'SQL', 'Supabase', 'IndexedDB'],
  },
  { group: 'Engineering', items: ['Web Crypto API', 'Streaming audio', 'Webhooks', 'Vitest', 'Git'] },
]

/** The skills, typeset as a book index pointing at where each one shows up. */
export const bookIndex: [string, string[]][] = [
  ['Animated dashboards', ['II.1']],
  ['Argon2id', ['II.4', 'III']],
  ['FastAPI', ['II.1']],
  ['Gesture-driven interactions', ['II.1']],
  ['Git', ['passim']],
  ['IndexedDB', ['II.4', 'III']],
  ['JavaScript', ['passim']],
  ['Micro-interactions', ['this page']],
  ['Next.js', ['II.1', 'II.2', 'II.3']],
  ['Node.js', ['II.2']],
  ['Onboarding flows', ['II.1']],
  ['PostgreSQL', ['II.2']],
  ['Python', ['II.1']],
  ['React', ['II.1', 'II.3', 'this page']],
  ['Reduced-motion accessibility', ['II.1', 'this page']],
  ['Responsive layouts', ['this page']],
  ['REST APIs', ['II.2', 'II.3']],
  ['SQL', ['II.2']],
  ['Streaming audio', ['II.1']],
  ['Supabase', ['II.3']],
  ['Three.js', ['II.1', 'this page']],
  ['TypeScript', ['II.2', 'II.3', 'II.4']],
  ['UX copywriting', ['this page']],
  ['Vitest', ['II.2']],
  ['Web Crypto API', ['II.4', 'III']],
  ['Webhooks', ['II.2']],
]

export const refTarget: Record<string, string> = {
  'II.1': '#jarvis',
  'II.2': '#hospital',
  'II.3': '#clutchhub',
  'II.4': '#sldt',
  III: '#inside-sldt',
  'this page': '#top',
}
