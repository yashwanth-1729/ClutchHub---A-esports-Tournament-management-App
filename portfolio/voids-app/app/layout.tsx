import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/hubot-sans/wdth.css'
import '@fontsource-variable/mona-sans/wdth.css'
import '@fontsource/monaspace-neon/400.css'
import '@fontsource/monaspace-neon/500.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'VOIDS — Domain-Specialized Intelligence | Voidbyte',
  description:
    'VOIDS is a Voidbyte research programme: compact 20–30B language models trained for exceptional, measured expertise in one domain, starting with React and frontend engineering. Small by design. Exceptional by domain.',
  metadataBase: new URL('https://www.voidbyte.tech'),
  alternates: { canonical: '/voids/' },
  openGraph: {
    title: 'VOIDS — Domain-Specialized Intelligence',
    description: 'Small by design. Exceptional by domain. A Voidbyte research programme.',
    url: 'https://www.voidbyte.tech/voids/',
    siteName: 'Voidbyte',
    type: 'website',
  },
  authors: [{ name: 'Yashwanth Raj Cherukuru', url: 'https://www.voidbyte.tech' }],
}

export const viewport: Viewport = { themeColor: '#030303', colorScheme: 'dark' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
