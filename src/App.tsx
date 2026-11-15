import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PortfolioPage } from '@/src/pages/PortfolioPage';
import { AdminPage } from '@/src/pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortfolioPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
