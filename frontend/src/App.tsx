import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import CategoriesPage from './pages/CategoriesPage';
import ImportPage from './pages/ImportPage';
import BudgetsPage from './pages/BudgetsPage';
import AdminPage from './pages/AdminPage';
import ApprovalsPage from './pages/ApprovalsPage';
import UpgradePage from './pages/UpgradePage';
import SavingsPage from './pages/SavingsPage';
import type { ReactNode } from 'react';

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
            <Route path="upgrade" element={<UpgradePage />} />
            <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="approvals" element={<AdminRoute><ApprovalsPage /></AdminRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
