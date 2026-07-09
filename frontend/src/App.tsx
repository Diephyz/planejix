import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/auth/PrivateRoute';
import AppLayout from './components/layout/AppLayout';
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
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Analytics />
        <InstallPrompt />
        <CookieConsent />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/welcome" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="budgets" element={<BudgetsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="savings" element={<SavingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="upgrade" element={<UpgradePage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="terms" element={<TermsPage />} />
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
