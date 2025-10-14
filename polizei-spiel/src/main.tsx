import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ErrorFallback } from './components/ErrorFallback'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      componentName="Polizei-Leitstellen-Simulator"
      fallback={<ErrorFallback componentName="Anwendung" />}
      onError={(error, errorInfo) => {
        // Log critical errors
        console.error('🚨 Critical Application Error:', error, errorInfo);

        // In production: Send to error tracking service
        // Example: Sentry.captureException(error, { extra: errorInfo });
      }}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
