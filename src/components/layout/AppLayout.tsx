import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar, NavTabType } from '../Navbar';
import { Site } from '../../types/analytics';
import { UserSession } from '../../services/authService';

interface AppLayoutProps {
  sites: Site[];
  selectedSite: Site;
  onSelectSite: (site: Site) => void;
  activeTab: NavTabType;
  onChangeTab: (tab: NavTabType) => void;
  liveCount: number;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  currentUser: UserSession | null;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  sites,
  selectedSite,
  onSelectSite,
  activeTab,
  onChangeTab,
  liveCount,
  onOpenSearch,
  onOpenAuth,
  currentUser,
  children,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-zinc-950">
      {/* Sidebar Navigation (Desktop Collapsible & Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        onChangeTab={onChangeTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
        liveCount={liveCount}
      />

      {/* Main Content Area Shifted based on Sidebar Width */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
        }`}
      >
        {/* Topbar Header */}
        <Navbar
          sites={sites}
          selectedSite={selectedSite}
          onSelectSite={onSelectSite}
          activeTab={activeTab}
          onChangeTab={onChangeTab}
          liveCount={liveCount}
          onOpenSearch={onOpenSearch}
          onOpenAuth={onOpenAuth}
          currentUser={currentUser}
          onOpenNewSiteModal={() => onChangeTab('sites')}
        />

        {/* Dynamic Page Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>

        {/* Minimal Production Footer */}
        <footer className="border-t border-zinc-800/60 py-4 px-6 text-center text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl w-full mx-auto">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Web Analytics Multi-Tenant Engine &bull; Production Contract</span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span>Latency: &lt;15ms</span>
            <span>Supabase SDK v2</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
