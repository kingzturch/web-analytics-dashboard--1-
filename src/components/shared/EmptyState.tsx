import React from 'react';
import { BarChart3, Code, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onOpenTracking?: () => void;
  actionText?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No analytics data available',
  description = 'This website has not started sending analytics. Install the tracking script to start collecting data.',
  onOpenTracking,
  actionText = 'Open Tracking Installation',
  onAction,
  actionLabel,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800/80 my-4 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-4 text-emerald-400 shadow-inner">
        <BarChart3 className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-zinc-100 mb-1">{title}</h3>
      <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">{description}</p>
      
      {(onOpenTracking || onAction) && (
        <button
          onClick={onOpenTracking || onAction}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-all shadow-md shadow-emerald-950/20 active:scale-98"
        >
          <Code className="w-4 h-4" />
          <span>{actionLabel || actionText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
