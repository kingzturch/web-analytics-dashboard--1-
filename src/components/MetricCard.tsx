import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label?: string;
  title?: string;
  value: string | number;
  changePercent?: number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  subtext?: string;
  isInverseTrendGood?: boolean; // For bounce rate where lower is better
  onClick?: () => void;
  isActive?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  title,
  value,
  changePercent,
  change,
  isPositive: isPositiveProp,
  icon: Icon,
  subtext,
  isInverseTrendGood = false,
  onClick,
  isActive = false,
}) => {
  const cardLabel = label || title || 'metric';
  const computedChangePercent = changePercent !== undefined 
    ? changePercent 
    : change 
      ? parseFloat(change.replace(/[^0-9.-]/g, '')) || 0 
      : 0;

  const isPositive = isPositiveProp !== undefined ? isPositiveProp : computedChangePercent > 0;
  const isNegative = !isPositive && computedChangePercent < 0;

  // Determine indicator color
  let trendBg = 'bg-zinc-800 text-zinc-400';

  if (isPositive) {
    if (isInverseTrendGood) {
      trendBg = 'bg-rose-950/60 border border-rose-800/50 text-rose-400';
    } else {
      trendBg = 'bg-emerald-950/60 border border-emerald-800/50 text-emerald-400';
    }
  } else if (isNegative) {
    if (isInverseTrendGood) {
      trendBg = 'bg-emerald-950/60 border border-emerald-800/50 text-emerald-400';
    } else {
      trendBg = 'bg-rose-950/60 border border-rose-800/50 text-rose-400';
    }
  }

  const changeDisplay = change || (computedChangePercent !== 0 ? `${Math.abs(computedChangePercent)}%` : null);

  return (
    <div
      id={`metric-card-${cardLabel.toLowerCase().replace(/\s+/g, '-')}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`p-5 rounded-xl border transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        isActive
          ? 'bg-zinc-900 border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-md'
          : 'bg-zinc-900/60 border-zinc-800/90 hover:border-zinc-700/80 hover:bg-zinc-900/90'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Icon className="w-4 h-4 text-zinc-400" />
          {cardLabel}
        </span>

        {changeDisplay && (
          <div className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${trendBg}`}>
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : isNegative ? (
              <ArrowDownRight className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span>{changeDisplay}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </div>

      {subtext && (
        <div className="mt-1.5 text-xs text-zinc-500">
          {subtext}
        </div>
      )}
    </div>
  );
};
