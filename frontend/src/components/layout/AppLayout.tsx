import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import FinanceAssistant from '../dashboard/FinanceAssistant';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-[260px] min-h-screen flex flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <FinanceAssistant />
    </div>
  );
}
