import React from 'react';
import { 
  X, 
  Clock, 
  Compass, 
  Globe, 
  Laptop, 
  Smartphone, 
  Cpu, 
  ArrowDown, 
  MousePointer, 
  Layers, 
  FileText, 
  Calendar, 
  ExternalLink,
  ChevronRight,
  Zap,
  Activity,
  Download,
  Send,
  Eye,
  ListFilter
} from 'lucide-react';
import { SessionDetailData } from '../types/analytics';
import { getCountryFlag } from '../lib/analyticsEngine';

interface SessionDetailModalProps {
  data: SessionDetailData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({ data, isOpen, onClose }) => {
  if (!isOpen || !data) return null;

  const {
    session,
    durationFormatted,
    landingPage,
    exitPage,
    referrer,
    country,
    countryCode,
    browser,
    device,
    os,
    pageViewsTimeline,
    eventsTimeline,
  } = data;

  const formatTimeOnly = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return isoString;
    }
  };

  const getEventIcon = (eventName: string) => {
    const name = eventName.toLowerCase();
    if (name.includes('scroll')) return <Activity className="w-3.5 h-3.5 text-sky-400" />;
    if (name.includes('click')) return <MousePointer className="w-3.5 h-3.5 text-amber-400" />;
    if (name.includes('submit') || name.includes('form') || name.includes('checkout')) return <Send className="w-3.5 h-3.5 text-emerald-400" />;
    if (name.includes('download')) return <Download className="w-3.5 h-3.5 text-purple-400" />;
    return <Zap className="w-3.5 h-3.5 text-rose-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="bg-zinc-900 border border-zinc-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Bar */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-sm font-bold">
              SD
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white font-mono">Session Detail</h2>
                <span className="text-xs font-mono text-zinc-500">#{session.id.slice(0, 8)}</span>
              </div>
              <p className="text-xs text-zinc-400">
                Started on {new Date(session.started_at).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 8-Tile Header Metadata Grid (Required fields: Duration, Landing, Exit, Referrer, Country, Browser, Device, OS) */}
        <div className="p-5 bg-zinc-950/60 border-b border-zinc-800/80 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            
            {/* 1. Session Duration */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/90 space-y-1">
              <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Session Duration</span>
              </div>
              <div className="text-sm font-bold text-amber-400 font-mono">{durationFormatted}</div>
            </div>

            {/* 2. Landing Page */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/90 space-y-1">
              <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Landing Page</span>
              </div>
              <div className="text-xs font-bold text-emerald-400 font-mono truncate" title={landingPage}>
                {landingPage}
              </div>
            </div>

            {/* 3. Exit Page */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/90 space-y-1">
              <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>Exit Page</span>
              </div>
              <div className="text-xs font-bold text-rose-400 font-mono truncate" title={exitPage}>
                {exitPage}
              </div>
            </div>

            {/* 4. Referrer */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/90 space-y-1">
              <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>Referrer</span>
              </div>
              <div className="text-xs font-bold text-sky-400 font-mono truncate" title={referrer}>
                {referrer}
              </div>
            </div>

            {/* 5. Country */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/90 space-y-1">
              <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Country</span>
              </div>
              <div className="text-xs font-bold text-zinc-200 font-mono flex items-center gap-1.5">
                <span>{getCountryFlag(countryCode)}</span>
                <span>{country}</span>
              </div>
            </div>

            {/* 6. Browser */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/90 space-y-1">
              <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-purple-400" />
                <span>Browser</span>
              </div>
              <div className="text-xs font-bold text-zinc-200 font-mono">{browser}</div>
            </div>

            {/* 7. Device */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/90 space-y-1">
              <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                <span>Device</span>
              </div>
              <div className="text-xs font-bold text-zinc-200 capitalize font-mono">{device}</div>
            </div>

            {/* 8. OS */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/90 space-y-1">
              <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-teal-400" />
                <span>OS</span>
              </div>
              <div className="text-xs font-bold text-zinc-200 font-mono">{os}</div>
            </div>

          </div>
        </div>

        {/* Layout Dua Kolom (Two Column Layout for Timeline & Events) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: Page Views Sequential Timeline (09:00 Home ↓ 09:01 Product ↓ 09:02 Pricing ↓ 09:05 Checkout) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Page Views Timeline ({pageViewsTimeline.length})</span>
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">Sequential Path</span>
            </div>

            {pageViewsTimeline.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 font-mono bg-zinc-950/40 rounded-xl border border-zinc-800/60">
                No page views recorded for this session.
              </div>
            ) : (
              <div className="relative pl-4 space-y-3">
                {/* Vertical connecting line */}
                <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-gradient-to-b from-emerald-500/80 via-emerald-500/30 to-zinc-800 pointer-events-none" />

                {pageViewsTimeline.map((pv, index) => {
                  const isLast = index === pageViewsTimeline.length - 1;
                  return (
                    <div key={pv.id} className="relative flex flex-col space-y-1">
                      <div className="flex items-start space-x-3 group">
                        {/* Timeline Step Circle Node */}
                        <div className="w-5 h-5 rounded-full bg-zinc-900 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 z-10 shadow-sm mt-0.5">
                          {index + 1}
                        </div>

                        {/* Timeline Item Box */}
                        <div className="flex-1 p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/90 group-hover:border-zinc-700 transition-colors shadow-xs">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="font-bold text-emerald-400 font-mono">
                              {formatTimeOnly(pv.entered_at)}
                            </span>
                            <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                              {pv.title || 'Page View'}
                            </span>
                          </div>

                          <div className="text-sm font-semibold text-zinc-200 mt-1 font-mono break-all">
                            {pv.url}
                          </div>

                          {pv.referrer && (
                            <div className="text-[11px] text-zinc-500 mt-1 font-mono flex items-center gap-1">
                              <Compass className="w-3 h-3 text-sky-400 shrink-0" />
                              <span className="truncate">Ref: {pv.referrer}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Arrow Connector Down symbol (↓) */}
                      {!isLast && (
                        <div className="pl-6 py-0.5 text-emerald-500/70 flex items-center justify-center text-xs">
                          <ArrowDown className="w-4 h-4 animate-bounce-short" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Chronological Custom Events Stream (Scroll, Click, Submit, Download, Custom) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>Custom Events Stream ({eventsTimeline.length})</span>
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">Chronological Stream</span>
            </div>

            {eventsTimeline.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 font-mono bg-zinc-950/40 rounded-xl border border-zinc-800/60 space-y-2">
                <ListFilter className="w-6 h-6 mx-auto text-zinc-600" />
                <p>No custom interaction events triggered during this session.</p>
                <p className="text-[10px] text-zinc-600">Tracked actions like Scroll, Click, Submit, or Download will stream here.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {eventsTimeline.map((evt) => (
                  <div 
                    key={evt.id}
                    className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800/90 hover:border-zinc-700 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                          {getEventIcon(evt.event_name)}
                        </div>
                        <span className="font-bold text-purple-300 text-sm">
                          {evt.event_name}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-zinc-400">
                        {formatTimeOnly(evt.created_at)}
                      </span>
                    </div>

                    {/* Event Data Payload JSON */}
                    {evt.event_data && Object.keys(evt.event_data).length > 0 && (
                      <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                        <pre className="whitespace-pre-wrap leading-relaxed text-emerald-400/90">
                          {JSON.stringify(evt.event_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between shrink-0 text-xs text-zinc-500 font-mono">
          <span>Visitor ID: {session.visitor_id}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
          >
            Close Session Detail
          </button>
        </div>
      </div>
    </div>
  );
};
