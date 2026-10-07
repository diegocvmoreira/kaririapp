import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { BottomNavigation } from '../components/common/BottomNavigation';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#1F2024] selection:bg-[#D9262E] selection:text-white pb-20 md:pb-0">
      {/* Offline Toast */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Modo Offline: Visualizando dados armazenados no dispositivo.</span>
        </div>
      )}

      {/* Main Top Header */}
      <Header />

      {/* Page Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Fixed Navigation */}
      <BottomNavigation />
    </div>
  );
};
