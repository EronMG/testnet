import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { Buffer } from 'buffer'
import process from 'process'
// @ts-ignore
if (typeof globalThis.Buffer === 'undefined') {
	// @ts-ignore
	globalThis.Buffer = Buffer
}
// @ts-ignore
if (typeof globalThis.process === 'undefined') {

	globalThis.process = process
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
