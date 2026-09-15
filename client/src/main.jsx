import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
const isInjectedMonitorError = (value) => {
  const message = String(value?.message || value || '');
  return message.includes('reportAllChanges') && message.includes('startTime');
};
window.addEventListener('error', (event) => {
  if (isInjectedMonitorError(event.error || event.message)) event.preventDefault();
});
window.addEventListener('unhandledrejection', (event) => {
  if (isInjectedMonitorError(event.reason)) event.preventDefault();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
