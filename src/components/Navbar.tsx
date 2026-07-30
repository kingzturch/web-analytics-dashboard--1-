import React, { useState } from 'react';
import { 
  Globe, 
  Plus, 
  Radio, 
  BarChart3, 
  Zap, 
  Key, 
  Settings, 
  ChevronDown, 
  Check, 
  Database, 
  Search,
  Users,
  FileText,
  Compass,
  Cpu,
  Code
} from 'lucide-react';
import { Site } from '../types/analytics';
import { isSupabaseConfigured } from '../lib/supabase';
import { UserSession } from '../services/authService';

export type NavTabType = 'dashboard' | 'realtime' | 'sites' | 'reports' | 'settings';

interface NavbarProps {
  sites: Site[];
  selectedSite: Site;
  onSelectSite: (site: Site) => void;
  onOpenNewSiteModal: () => void;
  activeTab: NavTabType;
  onChangeTab: (tab: NavTabType) => void;
  liveCount: number;
  onOpenSearch?: () => void;
  onOpenAuth?: () => void;
  currentUser?: UserSession | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  sites,
  selectedSite,
  onSelectSite,
  onOpenNewSiteModal,
  activeTab,
  onChangeTab,
  liveCount,
  onOpenSearch,
  onOpenAuth,
  currentUser,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const supabaseConnected = isSupabaseConfigured();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Logo & Site Selector */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-lg shadow-xs">
                Δ
              </div>
              <span className="font-semibold text-zinc-100 tracking-tight hidden sm:inline text-base">
                MetricsPulse
              </span>
            </div>

            <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

            {/* Site Selector Dropdown */}
            <div className="relative">
              <button
                id="site-selector-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all text-sm font-medium text-zinc-200"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span className="max-w-[140px] sm:max-w-[180px] truncate">{selectedSite.name}</span>
                <span className="text-xs text-zinc-500 font-mono hidden md:inline">({selectedSite.domain})</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {dropdownOpen && (
                <div 
                  className="absolute left-0 mt-2 w-72 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl z-50 overflow-hidden py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/80 flex items-center justify-between">
                    <span>Websites ({sites.length})</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">PostgreSQL</span>
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-zinc-800/40">
                    {sites.map((site) => (
                      <button
                        key={site.id}
                        id={`site-option-${site.id}`}
                        onClick={() => {
                          onSelectSite(site);
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-zinc-800/60 transition-colors group"
                      >
                        <div>
                          <div className="text-sm font-medium text-zinc-200 group-hover:text-white flex items-center gap-1.5">
                            {site.name}
                            {site.public_access && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1 py-0.2 rounded font-mono">public</span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500 font-mono mt-0.5">{site.domain}</div>
                        </div>
                        {selectedSite.id === site.id && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="p-1.5 border-t border-zinc-800 bg-zinc-950/40">
                    <button
                      id="add-new-site-btn"
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenNewSiteModal();
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-xs font-medium text-zinc-200 transition-colors border border-zinc-700/50"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Add New Website</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Active Users Indicator, Global Search & Database Status */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Quick Global Search Trigger Button */}
            {onOpenSearch && (
              <button
                id="global-search-btn"
                onClick={onOpenSearch}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-all"
                title="Global Search (Press '/' or Cmd+K)"
              >
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Search analytics...</span>
                <kbd className="hidden lg:inline-block px-1.5 py-0.2 text-[10px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700 rounded">
                  /
                </kbd>
              </button>
            )}

            {/* Live Users Pulsing Badge */}
            <button
              id="realtime-badge-btn"
              onClick={() => onChangeTab('realtime')}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-800/50 hover:bg-emerald-900/40 transition-colors"
              title="Click to view real-time visitor activity"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-300 font-mono">{liveCount}</span>
              <span className="text-xs text-emerald-400/80 font-medium hidden sm:inline">online now</span>
            </button>

            {/* Supabase DB Status Badge */}
            <div 
              className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                supabaseConnected 
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-400' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{supabaseConnected ? 'Supabase DB' : 'Local Postgres Engine'}</span>
            </div>

            {/* User Profile / Auth Button */}
            {onOpenAuth && (
              <button
                id="user-auth-btn"
                onClick={onOpenAuth}
                className="flex items-center space-x-2 p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-xs text-zinc-200"
                title="Manage Account / Login"
              >
                {currentUser?.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.name || 'User'}
                    className="w-5 h-5 rounded-full object-cover border border-emerald-500/50"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                    {currentUser?.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
                <span className="hidden sm:inline font-medium max-w-[100px] truncate">
                  {currentUser?.name || currentUser?.email || 'Login'}
                </span>
                <span className="hidden lg:inline text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 uppercase font-mono">
                  {currentUser?.role || 'Guest'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex space-x-1 sm:space-x-6 border-t border-zinc-800/60 overflow-x-auto no-scrollbar py-1">
          <button
            id="tab-dashboard-btn"
            onClick={() => onChangeTab('dashboard')}
            className={`flex items-center space-x-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-zinc-800/80 text-white border border-zinc-700/60 shadow-xs font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Dashboard</span>
          </button>

          <button
            id="tab-realtime-btn"
            onClick={() => onChangeTab('realtime')}
            className={`flex items-center space-x-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'realtime'
                ? 'bg-zinc-800/80 text-white border border-zinc-700/60 shadow-xs font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Radio className="w-4 h-4 text-amber-400" />
            <span>Realtime</span>
          </button>

          <button
            id="tab-sites-btn"
            onClick={() => onChangeTab('sites')}
            className={`flex items-center space-x-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'sites'
                ? 'bg-zinc-800/80 text-white border border-zinc-700/60 shadow-xs font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Sites</span>
          </button>

          <button
            id="tab-reports-btn"
            onClick={() => onChangeTab('reports')}
            className={`flex items-center space-x-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-zinc-800/80 text-white border border-zinc-700/60 shadow-xs font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span>Reports</span>
          </button>

          <button
            id="tab-settings-btn"
            onClick={() => onChangeTab('settings')}
            className={`flex items-center space-x-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-zinc-800/80 text-white border border-zinc-700/60 shadow-xs font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Settings className="w-4 h-4 text-stone-400" />
            <span>Settings</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
