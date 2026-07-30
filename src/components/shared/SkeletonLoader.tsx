import React from 'react';

export const MetricCardSkeleton: React.FC = () => (
  <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-3 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-3 w-24 bg-zinc-800 rounded" />
      <div className="h-4 w-12 bg-zinc-800 rounded-full" />
    </div>
    <div className="h-8 w-28 bg-zinc-800 rounded mt-2" />
    <div className="h-3 w-36 bg-zinc-800/60 rounded" />
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-4 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-8 w-48 bg-zinc-800 rounded-xl" />
      <div className="h-8 w-36 bg-zinc-800 rounded-xl" />
    </div>
    <div className="h-64 w-full bg-zinc-800/40 rounded-xl mt-4" />
  </div>
);

export const BreakdownCardSkeleton: React.FC = () => (
  <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-3 animate-pulse">
    <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
      <div className="h-4 w-32 bg-zinc-800 rounded" />
      <div className="h-3 w-12 bg-zinc-800 rounded" />
    </div>
    <div className="space-y-2 pt-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-7 w-full bg-zinc-800/50 rounded-lg" />
      ))}
    </div>
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-3 animate-pulse">
    <div className="h-6 w-40 bg-zinc-800 rounded mb-4" />
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="h-10 w-full bg-zinc-800/40 rounded-lg" />
    ))}
  </div>
);
