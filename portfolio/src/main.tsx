import { createRoot } from 'react-dom/client'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '@fontsource/ibm-plex-mono/400.css'
import 'lenis/dist/lenis.css'
import './styles/global.css'
import './styles/demos.css'
import './styles/sldt.css'
import App from './App'

createRoot(document.getElementById('root')!).render(<App />)
