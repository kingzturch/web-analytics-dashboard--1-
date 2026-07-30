import React from 'react';
import { BreakdownItem } from '../types/analytics';
import { getCountryFlag } from '../lib/analyticsEngine';
import { ExternalLink } from 'lucide-react';

interface BreakdownCardProps {
  title: string;
  icon?: React.ReactNode;
  items: BreakdownItem[];
  type?: 'page' | 'referrer' | 'country' | 'browser' | 'os' | 'device';
  emptyMessage?: string;
}

export const BreakdownCard: React.FC<BreakdownCardProps> = ({
  title,
  icon,
  items,
  type = 'page',
  emptyMessage = 'No data available for this range',
}) => {
  const maxCount = items.length > 0 ? Math.max(...items.map(i => i.count)) : 1;

  return (
    <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 shadow-xs flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
          <div className="flex items-center space-x-2">
            {icon && (
              <span className="text-zinc-400">
                {React.isValidElement(icon)
                  ? icon
                  : typeof icon === 'function' || typeof icon === 'object'
                  ? React.createElement(icon as any, { className: 'w-4 h-4' })
                  : icon}
              </span>
            )}
            <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">Top {items.length}</span>
        </div>

        {/* List of Breakdown Items */}
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 font-mono">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item, idx) => {
              const relativePercent = Math.round((item.count / maxCount) * 100);

              return (
                <div key={idx} className="relative group">
                  {/* Background Progress Bar Fill */}
                  <div
                    className="absolute inset-y-0 left-0 bg-zinc-800/60 group-hover:bg-zinc-800/90 transition-all rounded-lg"
                    style={{ width: `${relativePercent}%` }}
                  />

                  {/* Foreground Content */}
                  <div className="relative px-3 py-2 flex items-center justify-between text-xs z-10">
                    <div className="flex items-center space-x-2 truncate max-w-[70%]">
                      {type === 'country' && item.code && (
                        <span className="text-base leading-none">
                          {getCountryFlag(item.code)}
                        </span>
                      )}
                      
                      <span className="font-mono text-zinc-200 truncate group-hover:text-white transition-colors">
                        {item.name}
                      </span>

                      {type === 'page' && (
                        <span className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-emerald-400 transition-opacity">
                          <ExternalLink className="w-3 h-3 inline" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 font-mono">
                      <span className="text-zinc-400">{item.count.toLocaleString()}</span>
                      <span className="text-zinc-500 text-[11px] w-9 text-right font-normal">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
