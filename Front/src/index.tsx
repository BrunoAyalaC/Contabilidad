import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('Front bundle: src/index.tsx loaded');

// Global error handlers to catch render/runtime errors early
window.addEventListener('error', (ev) => {
  console.error('Global error caught:', ev.error || ev.message, ev);
});
window.addEventListener('unhandledrejection', (ev) => {
  console.error('Unhandled rejection:', ev.reason);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);