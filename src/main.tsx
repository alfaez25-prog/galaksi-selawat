import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/amiri/400.css'
import '@fontsource/amiri/700.css'
import '@fontsource/cinzel/600.css'
import '@fontsource/cinzel/800.css'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
