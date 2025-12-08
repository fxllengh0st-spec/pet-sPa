import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import { ToastProvider } from './src/context/ToastContext';

// Styles Imports - Explicit ordering ensures variables are loaded first
import './src/styles/variables.css';
import './src/styles/base.css';
import './src/styles/animations.css';
import './src/styles/components.css';
import './src/styles/layout.css';
import './src/styles/overlays.css';
import './src/styles/pages.css';
import './src/styles/chat.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);