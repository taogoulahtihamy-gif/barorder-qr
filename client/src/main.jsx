import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import App from './App';
import './index.css';
import './styles/responsive.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
        <Toaster position="top-center" toastOptions={{ style: { background: '#1a1a2e', color: '#fff', borderRadius: '12px' } }} />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
