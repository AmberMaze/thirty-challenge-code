import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import App from './App';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { enableNetworkDebugging } from '@/utils/debugNetworkRequests';
import '@/index.css';
import 'flag-icons/css/flag-icons.min.css';

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new BrowserTracing() as any],
  tracesSampleRate: 0.2,
  release: import.meta.env.VITE_COMMIT_SHA,
});

// Enable network debugging in development
enableNetworkDebugging();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
