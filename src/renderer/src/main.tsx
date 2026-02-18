import './assets/main.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';

const renderApp = (): void => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  );
};

const startMockWorker = async (): Promise<void> => {
  if (!import.meta.env.DEV) return;
  // DEV 기본값은 MSW ON, 필요하면 VITE_USE_MSW=false 로 끈다.
  if (import.meta.env.VITE_USE_MSW === 'false') return;
  if (!('serviceWorker' in navigator)) return;

  const startWorker = async (): Promise<void> => {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      serviceWorker: {
        url: '/mockServiceWorker.js'
      },
      onUnhandledRequest: 'bypass'
    });
  };

  try {
    await startWorker();
  } catch (error) {
    // Recover from stale/corrupted registrations seen in Electron Chromium profiles.
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((registration) => registration.active?.scriptURL.includes('mockServiceWorker.js'))
        .map((registration) => registration.unregister())
    );

    try {
      await startWorker();
    } catch (retryError) {
      console.warn('[MSW] Failed to start mock worker. Falling back to real API.', {
        error,
        retryError
      });
    }
  }
};

void (async () => {
  await startMockWorker();
  renderApp();
})();
