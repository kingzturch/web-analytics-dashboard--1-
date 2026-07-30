import React, { useState } from 'react';
import {
  BarChart2,
  FileText,
  Users,
  Compass,
  Globe,
  Zap,
} from 'lucide-react';
import { Site, GlobalFilterState, AnalyticsSummary } from '../types/analytics';
import { PagesView } from './PagesView';
import { EventsView } from './EventsView';
import { VisitorsView } from './VisitorsView';
import { GeographyView } from './GeographyView';
import { AcquisitionView } from './AcquisitionView';
import { EmptyState } from './shared/EmptyState';

interface ReportsViewProps {
  site: Site;
  analyticsData: AnalyticsSummary | null;
  globalFilter: GlobalFilterState;
  onSelectPageUrl: (url: string) => void;
  onSelectVisitor: (visitorId: string) => void;
  onSelectSession: (sessionId: string) => void;
  onSelectCountryFilter: (countryCode: string) => void;
}

/** Overview/Technology removed — redundant with Dashboard breakdowns */
export type MainReportTab = 'traffic' | 'audience' | 'acquisition';

export const ReportsView: React.FC<ReportsViewProps> = ({
  site,
  analyticsData,
  globalFilter,
  onSelectPageUrl,
  onSelectVisitor,
  onSelectSession,
  onSelectCountryFilter,
}) => {
  const [activeTab, setActiveTab] = useState<MainReportTab>('traffic');
  const [trafficSubTab, setTrafficSubTab] = useState<'pages' | 'events'>('pages');
  const [audienceSubTab, setAudienceSubTab] = useState<'visitors' | 'geography'>('visitors');

  if (!analyticsData) {
    return (
      <EmptyState
        title="Reports unavailable"
        description="Analytics data has not loaded for this site yet. Open the Dashboard or install the tracker first."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-sky-400" />
            <span>Reports</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Deep-dive traffic, audience, and acquisition for{' '}
            <strong className="text-zinc-200 font-mono">{site.domain}</strong>.
            Overview KPIs live on the Dashboard.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800">
        {(
          [
            { id: 'traffic' as const, label: 'Traffic', icon: FileText, color: 'text-emerald-400' },
            { id: 'audience' as const, label: 'Audience', icon: Users, color: 'text-sky-400' },
            { id: 'acquisition' as const, label: 'Acquisition', icon: Compass, color: 'text-purple-400' },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`report-tab-${tab.id}`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-zinc-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'traffic' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-zinc-800/80 pb-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setTrafficSubTab('pages')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                trafficSubTab === 'pages'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Pages</span>
            </button>

            <button
              type="button"
              onClick={() => setTrafficSubTab('events')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                trafficSubTab === 'events'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Events</span>
            </button>
          </div>

          {trafficSubTab === 'pages' && (
            <PagesView site={site} onSelectPageUrl={onSelectPageUrl} />
          )}

          {trafficSubTab === 'events' && (
            <EventsView
              site={site}
              onSelectVisitor={onSelectVisitor}
              onSelectSession={onSelectSession}
            />
          )}
        </div>
      )}

      {activeTab === 'audience' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-zinc-800/80 pb-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setAudienceSubTab('visitors')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                audienceSubTab === 'visitors'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Visitors</span>
            </button>

            <button
              type="button"
              onClick={() => setAudienceSubTab('geography')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                audienceSubTab === 'geography'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Geography</span>
            </button>
          </div>

          {audienceSubTab === 'visitors' && (
            <VisitorsView site={site} onSelectVisitor={onSelectVisitor} />
          )}

          {audienceSubTab === 'geography' && (
            <GeographyView
              site={site}
              globalFilter={globalFilter}
              onSelectCountryFilter={onSelectCountryFilter}
            />
          )}
        </div>
      )}

      {activeTab === 'acquisition' && <AcquisitionView site={site} />}
    </div>
  );
};
