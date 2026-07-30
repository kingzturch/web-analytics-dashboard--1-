import React, { useState } from 'react';
import { Settings, Code, Database, Copy, Check, Lock, Globe, Layers, Moon, Sun, Shield, Sliders, Palette } from 'lucide-react';
import { Site } from '../types/analytics';

interface SettingsViewProps {
  site: Site;
  onUpdateSite?: (updated: Partial<Site>) => void;
}

export type SettingsTab = 'general' | 'appearance' | 'security';

export const SettingsView: React.FC<SettingsViewProps> = ({ site, onUpdateSite }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [copiedSql, setCopiedSql] = useState(false);
  const [isPublic, setIsPublic] = useState(site.public_access ?? true);

  // Appearance states
  const [accentColor, setAccentColor] = useState('emerald');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // General states
  const [defaultRange, setDefaultRange] = useState('7d');
  const [defaultTimezone, setDefaultTimezone] = useState(site.timezone || 'Asia/Jakarta');

  // Security states
  const [requireCors, setRequireCors] = useState(true);
  const [rateLimit, setRateLimit] = useState('1000');

  const sqlSchema = `-- Supabase PostgreSQL Schema DDL
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL,
  public_access BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  key_prefix TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleTogglePublic = () => {
    const nextVal = !isPublic;
    setIsPublic(nextVal);
    if (onUpdateSite) {
      onUpdateSite({ public_access: nextVal });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>Platform & Global Settings</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Pengaturan sistem analytics, tampilan antarmuka, dan kebijakan keamanan.
          </p>
        </div>
      </div>

      {/* 3 Main Settings Tabs */}
      <div className="flex items-center space-x-2 p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 w-full sm:w-auto self-start">
        <button
          id="settings-tab-general"
          onClick={() => setActiveTab('general')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'general'
              ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/80'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Sliders className={`w-4 h-4 ${activeTab === 'general' ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <span>General</span>
        </button>

        <button
          id="settings-tab-appearance"
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'appearance'
              ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/80'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Palette className={`w-4 h-4 ${activeTab === 'appearance' ? 'text-amber-400' : 'text-zinc-500'}`} />
          <span>Appearance</span>
        </button>

        <button
          id="settings-tab-security"
          onClick={() => setActiveTab('security')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'security'
              ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/80'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Shield className={`w-4 h-4 ${activeTab === 'security' ? 'text-sky-400' : 'text-zinc-500'}`} />
          <span>Security</span>
        </button>
      </div>

      {/* TAB 1: GENERAL */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>System Preferences & Timezone</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Default Timezone</label>
                <select
                  value={defaultTimezone}
                  onChange={(e) => setDefaultTimezone(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Default Date Range</label>
                <select
                  value={defaultRange}
                  onChange={(e) => setDefaultRange(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="today">Hari Ini (24 Hours)</option>
                  <option value="7d">7 Hari Terakhir</option>
                  <option value="30d">30 Hari Terakhir</option>
                  <option value="90d">90 Hari Terakhir</option>
                </select>
              </div>
            </div>
          </div>

          {/* Database DDL Inspector */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2 text-sm font-semibold text-zinc-100">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Supabase PostgreSQL Schema Reference</span>
              </div>
              <button
                onClick={handleCopySql}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-colors"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied' : 'Copy DDL'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs font-mono text-zinc-400 overflow-x-auto leading-relaxed max-h-56">
              {sqlSchema}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: APPEARANCE */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Palette className="w-4 h-4 text-amber-400" />
              <span>Theme & Visual Customization</span>
            </h3>

            <div className="space-y-3">
              <label className="text-xs font-medium text-zinc-300">Accent Color Accent</label>
              <div className="flex items-center space-x-3">
                {[
                  { id: 'emerald', bg: 'bg-emerald-500', name: 'Emerald' },
                  { id: 'sky', bg: 'bg-sky-500', name: 'Sky Blue' },
                  { id: 'amber', bg: 'bg-amber-500', name: 'Amber' },
                  { id: 'purple', bg: 'bg-purple-500', name: 'Purple' },
                ].map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setAccentColor(color.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      accentColor === color.id
                        ? 'border-zinc-500 bg-zinc-800 text-white'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${color.bg}`} />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/60 space-y-3">
              <label className="text-xs font-medium text-zinc-300">Display Density</label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setDensity('comfortable')}
                  className={`px-4 py-2 rounded-xl border text-xs font-medium transition-all ${
                    density === 'comfortable'
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                  }`}
                >
                  Comfortable (Default)
                </button>
                <button
                  onClick={() => setDensity('compact')}
                  className={`px-4 py-2 rounded-xl border text-xs font-medium transition-all ${
                    density === 'compact'
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                  }`}
                >
                  Compact Layout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Shield className="w-4 h-4 text-sky-400" />
              <span>API Ingestion & CORS Security Policies</span>
            </h3>

            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <span className="text-xs font-medium text-white block">Origin CORS Enforcement</span>
                <span className="text-[11px] text-zinc-500">
                  Hanya izinkan pengiriman telemetry event dari domain terdaftar di tab Sites.
                </span>
              </div>
              <button
                onClick={() => setRequireCors(!requireCors)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                  requireCors
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                {requireCors ? 'Strict CORS On' : 'CORS Relaxed'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <span className="text-xs font-medium text-white block">Public Dashboard Shared Link</span>
                <span className="text-[11px] text-zinc-500">
                  Izinkan publik melihat ringkasan analytics tanpa autentikasi login.
                </span>
              </div>
              <button
                onClick={handleTogglePublic}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                  isPublic
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                {isPublic ? 'Public Allowed' : 'Restricted'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
