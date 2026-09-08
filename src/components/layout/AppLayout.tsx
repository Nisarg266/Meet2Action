import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { ToastContainer } from '../common/ToastContainer';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-900 overflow-hidden">
      {/* Fixed/Responsive Sidebar */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar onMobileMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          {children || <Outlet />}
        </main>
      </div>

      {/* Global Utilities */}
      <GlobalSearchModal />
      <ToastContainer />
    </div>
  );
};

