import React from 'react';
import { 
  BarChart3, 
  Radio, 
  Globe2,
  Users, 
  Clock, 
  FileText, 
  Zap, 
  Compass, 
  Cpu, 
  Globe, 
  Key, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  Layers,
  ShieldCheck,
  X
} from 'lucide-react';
import { NavTabType } from '../Navbar';

interface SidebarProps {
  activeTab: NavTabType;
  onChangeTab: (tab: NavTabType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  liveCount: number;
}

interface NavItem {
  id: NavTabType;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onChangeTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  liveCount,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'realtime', label: 'Realtime', icon: Radio, badge: liveCount > 0 ? liveCount : 'Live', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    { id: 'sites', label: 'Sites', icon: Globe2 },
    { id: 'reports', label: 'Reports', icon: Layers },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelect = (id: NavTabType) => {
    onChangeTab(id);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800/80 text-zinc-300 select-none">
      {/* Brand & Sidebar Toggle */}
      <div className={`flex items-center justify-between p-4 border-b border-zinc-800/80 ${collapsed ? 'px-3 justify-center' : ''}`}>
        {!collapsed && (
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-zinc-950 font-bold shadow-md shadow-emerald-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight">Pulse Analytics</span>
              <span className="block text-[10px] text-zinc-500 font-mono">v1.0 Production</span>
            </div>
          </div>
        )}

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center px-2' : 'justify-between px-3'
              } py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-zinc-800/90 text-white border border-zinc-700/60 shadow-xs font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && item.badge !== undefined && (
                <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full border ${item.badgeColor || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Tenant Status */}
      {!collapsed && (
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 text-[11px]">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="font-semibold text-zinc-300">Tenant Workspace</span>
            <span className="flex items-center text-emerald-400 font-mono text-[10px]">
              <ShieldCheck className="w-3 h-3 mr-1" /> Multi-Tenant
            </span>
          </div>
          <p className="text-zinc-500 text-[10px] truncate">Active Isolation Contract</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed left-0 top-0 bottom-0 z-30 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-xs bg-zinc-950 h-full shadow-2xl z-10 animate-slide-in">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
