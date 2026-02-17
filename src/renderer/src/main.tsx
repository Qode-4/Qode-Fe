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

  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass'
  });
};

void startMockWorker().then(() => {
  renderApp();
});
