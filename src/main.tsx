import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker } from './serviceWorkerRegistration';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Registro del Service Worker para soporte offline y PWA instalable
registerServiceWorker({
  onOfflineReady() {
    // La aplicación está lista para uso offline
  },
});

