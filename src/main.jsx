// Ensure window.fetch is writable and has a setter for browser extensions & devtools
(function ensureWritableFetch() {
  try {
    if (typeof window !== 'undefined' && window.fetch) {
      const originalFetch = window.fetch.bind(window);
      let activeFetch = originalFetch;
      const descriptor = {
        get() {
          return activeFetch;
        },
        set(newFetch) {
          activeFetch = newFetch;
        },
        configurable: true,
        enumerable: true
      };
      try {
        Object.defineProperty(window, 'fetch', descriptor);
      } catch (_) {}
      try {
        if (typeof Window !== 'undefined' && Window.prototype) {
          Object.defineProperty(Window.prototype, 'fetch', descriptor);
        }
      } catch (_) {}
    }
  } catch (_) {}
})();

import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(<App />);

