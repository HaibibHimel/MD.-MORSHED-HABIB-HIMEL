import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PortfolioPage } from '@/src/pages/PortfolioPage';
import { AdminPage } from '@/src/pages/AdminPage';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';

function shouldUseHashRouter(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return (
    host.endsWith('github.io') ||
    window.location.protocol === 'file:' ||
    host.endsWith('gitlab.io')
  );
}

export default function App() {
  const Router = shouldUseHashRouter() ? HashRouter : BrowserRouter;

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<PortfolioPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
