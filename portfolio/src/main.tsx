import { createRoot } from 'react-dom/client'
// One type family in three voices, designed together: Hubot Sans for display,
// Mona Sans for reading, Monaspace Neon for anything a machine wrote.
import '@fontsource-variable/hubot-sans/wdth.css'
import '@fontsource-variable/mona-sans/wdth.css'
import '@fontsource/monaspace-neon/400.css'
import '@fontsource/monaspace-neon/500.css'
// Telugu for the JARVIS figure; its unicode-range keeps it from loading until Telugu is on screen
import '@fontsource-variable/noto-sans-telugu/wght.css'
import 'lenis/dist/lenis.css'
import './styles/global.css'
import './styles/demos.css'
import './styles/sldt.css'
import App from './App'

createRoot(document.getElementById('root')!).render(<App />)
