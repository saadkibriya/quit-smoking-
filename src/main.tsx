import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Bundled locally (no CDN) so the typography survives offline.
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/plus-jakarta-sans/latin-800.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';

createRoot(document.getElementById('root')!).render(<App />);

/**
 * Offline shell registration — production builds only, so the dev server keeps
 * its HMR behaviour. Caching failure is never surfaced: it is an enhancement.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* no offline shell; the app still works while online */
    });
  });
}
