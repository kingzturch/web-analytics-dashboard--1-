import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, Users, FileText, Zap, X } from 'lucide-react';
import { Site, VisitorListItem } from '../types/analytics';
import { fetchPageAnalytics, fetchVisitors } from '../lib/analytics';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: Site;
  onSelectResult: (type: 'page' | 'visitor' | 'session' | 'event', idOrUrl: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  site,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [matchingPages, setMatchingPages] = useState<{ path: string; title: string; views: number }[]>([]);
  const [matchingVisitors, setMatchingVisitors] = useState<VisitorListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setMatchingPages([]);
      setMatchingVisitors([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setMatchingPages([]);
      setMatchingVisitors([]);
      return;
    }

    let isMounted = true;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const [pages, visitorsRes] = await Promise.all([
          fetchPageAnalytics(site.id),
          fetchVisitors(site.id, 1, 20, query.trim())
        ]);

        if (isMounted) {
          const q = query.toLowerCase();
          const filteredPages = pages
            .filter(p => p.path.toLowerCase().includes(q) || (p.title && p.title.toLowerCase().includes(q)))
            .map(p => ({ path: p.path, title: p.title || p.path, views: p.views }));

          setMatchingPages(filteredPages);
          setMatchingVisitors(visitorsRes.visitors || []);
        }
      } catch (err) {
        console.warn('Global search error:', err);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, site.id]);

  // Global Keyboard Listener for `/` or `Cmd+K` / `Ctrl+K`
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !isOpen) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          e.preventDefault();
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasResults = matchingPages.length > 0 || matchingVisitors.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-zinc-800">
          <Search className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search visitors, pages in ${site.name}...`}
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <div className="flex items-center space-x-2">
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700 rounded">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4 divide-y divide-zinc-800/60">
          {query.trim().length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs">
              Type to search across <span className="text-zinc-300 font-medium">{site.domain}</span> analytics data
            </div>
          ) : isSearching ? (
            <div className="py-8 text-center text-zinc-400 text-xs animate-pulse">
              Searching database...
            </div>
          ) : hasResults ? (
            <>
              {/* Pages */}
              {matchingPages.length > 0 && (
                <div className="pt-2 first:pt-0">
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pages ({matchingPages.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchingPages.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          onSelectResult('page', p.path);
                          onClose();
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-zinc-800/80 flex items-center justify-between text-xs transition-colors group"
                      >
                        <div className="truncate pr-2">
                          <div className="font-medium text-zinc-200 group-hover:text-emerald-300 truncate">{p.title}</div>
                          <div className="text-zinc-500 font-mono text-[11px] truncate">{p.path}</div>
                        </div>
                        <span className="text-zinc-400 font-mono text-[11px] flex-shrink-0">{p.views} views</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Visitors */}
              {matchingVisitors.length > 0 && (
                <div className="pt-3">
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>Visitors ({matchingVisitors.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchingVisitors.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          onSelectResult('visitor', v.id);
                          onClose();
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-zinc-800/80 flex items-center justify-between text-xs transition-colors group"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-zinc-300 group-hover:text-sky-300">{v.visitorUid}</span>
                          <span className="text-zinc-500 text-[11px]">({v.country}, {v.browser})</span>
                        </div>
                        <span className="text-zinc-400 text-[11px] font-mono">{v.lastSeenAt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-zinc-500 text-xs">
              No matching records found for "<span className="text-zinc-300 font-medium">{query}</span>"
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-zinc-950/60 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center space-x-2">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Site: <strong className="text-zinc-300">{site.name}</strong></span>
          </div>
          <span>Press <kbd className="px-1.5 py-0.5 text-[10px] bg-zinc-800 rounded font-mono">ESC</kbd> to exit</span>
        </div>
      </div>
    </div>
  );
};
