import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

if (typeof document !== 'undefined') {
  if ('fonts' in document) {
    document.fonts.ready.then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });
    setTimeout(() => {
      document.documentElement.classList.add('fonts-loaded');
    }, 350);
  } else {
    document.documentElement.classList.add('fonts-loaded');
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
