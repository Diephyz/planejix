import { useState, Suspense } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import FinanceAssistant from '../dashboard/FinanceAssistant';
import PageLoader from '../shared/PageLoader';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { plan, isAdmin } = useAuth();
  const location = useLocation();

  // Assinatura Pix vencida: só Planos (renovação) e Perfil (dados/LGPD) ficam acessíveis
  if (plan === 'expired' && !isAdmin && !['/upgrade', '/profile'].includes(location.pathname)) {
    return <Navigate to="/upgrade" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-[260px] min-h-screen flex flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-24 lg:pb-6">
          {/* Suspense aqui dentro: ao navegar, só o conteúdo troca — sidebar/topbar não piscam */}
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <BottomNav />
      <FinanceAssistant />
    </div>
  );
}
