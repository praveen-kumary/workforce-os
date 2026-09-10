import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useAuthStore } from './store/auth.store'

// Hydrate auth state from localStorage before rendering
useAuthStore.getState().hydrate();

createRoot(document.getElementById('root')!).render(
  <App />
)
