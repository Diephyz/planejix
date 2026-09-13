import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { initMetaPixel, trackPixel } from './lib/metaPixel';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/auth/PrivateRoute';
import AppLayout from './components/layout/AppLayout';
import LegalLayout from './components/layout/LegalLayout';
// Páginas públicas de entrada ficam no bundle principal (primeira dor de carregamento)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import InstallPrompt from './components/shared/InstallPrompt';
import CookieConsent from './components/shared/CookieConsent';
import PageLoader from './components/shared/PageLoader';
import { Analytics } from '@vercel/analytics/react';
import type { ReactNode } from 'react';

// Demais páginas são chunks separados, baixados só quando a rota é visitada
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const ImportPage = lazy(() => import('./pages/ImportPage'));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage'));
const UpgradePage = lazy(() => import('./pages/UpgradePage'));
const SavingsPage = lazy(() => import('./pages/SavingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

// Meta Pixel: PageView em cada troca de rota (no-op sem VITE_META_PIXEL_ID/consentimento)
function PixelTracker() {
  const location = useLocation();
  useEffect(() => {
    initMetaPixel();
    trackPixel('PageView');
  }, [location.pathname]);
  return null;
}

// Raiz do site: landing para visitantes, painel para quem já está logado
function HomeGate() {
  const { token } = useAuth();
  return token ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Analytics />
        <PixelTracker />
        <InstallPrompt />
        <CookieConsent />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeGate />} />
          <Route path="/welcome" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          {/* Páginas legais são públicas: linkadas na landing, no cadastro e no aviso de cookies */}
          <Route element={<LegalLayout />}>
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="terms" element={<TermsPage />} />
          </Route>
          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="budgets" element={<BudgetsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="savings" element={<SavingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="upgrade" element={<UpgradePage />} />
            <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="approvals" element={<AdminRoute><ApprovalsPage /></AdminRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
