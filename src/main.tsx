import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LangProvider } from './i18n/context'
import './index.css'
import App from './App'
import { seedDemoAccounts } from './auth/localAuth'

// Seed shared demo accounts so invite list works across devices
seedDemoAccounts()

// Register service worker only in production — SW caching would break dev hot-reload.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </StrictMode>,
)