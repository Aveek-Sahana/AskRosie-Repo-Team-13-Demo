import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'

const legacyQrHost = 'ask-rosie-repo-team-13-demo.vercel.app'
const liveDemoHost = 'ask-rosie-team-13.vercel.app'

// The physical QR code points to the legacy host. Preserve its path/query while
// handing visitors to the current owner-operated demo without redirect loops.
if (window.location.hostname === legacyQrHost) {
  const destination = new URL(window.location.href)
  destination.protocol = 'https:'
  destination.host = liveDemoHost
  window.location.replace(destination.toString())
} else {
  createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
}
