import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Cpu, 
  Globe2, 
  Clock, 
  Monitor, 
  Maximize, 
  Smartphone, 
  Layers, 
  RefreshCw,
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { TechnologyData, Site, BreakdownItem } from '../types/analytics';
import { fetchTechnologyData } from '../lib/analytics';

interface TechnologyViewProps {
  site: Site;
}

const TECH_COLOR_PALETTE = [
  '#0ea5e9', // Sky
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#6366f1', // Indigo
  '#ec4899', // Pink
];

interface TechDimensionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: BreakdownItem[];
  colorOffset?: number;
}

const TechDimensionCard: React.FC<TechDimensionCardProps> = ({
  title,
  subtitle,
  icon,
  items,
  colorOffset = 0,
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'both'>('both');

  const chartData = items.map((item, idx) => ({
    name: item.name.length > 20 ? item.name.slice(0, 18) + '...' : item.name,
    fullName: item.name,
    count: item.count,
    percentage: item.percentage,
    color: TECH_COLOR_PALETTE[(idx + colorOffset) % TECH_COLOR_PALETTE.length],
  }));

  const maxCount = items.length > 0 ? Math.max(...items.map(i => i.count)) : 1;

  return (
    <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm space-y-5 flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-sky-400">
              {icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-zinc-400 font-mono">{subtitle}</p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800 self-start sm:self-auto text-xs font-mono">
            <button
              onClick={() => setViewMode('both')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                viewMode === 'both' ? 'bg-zinc-800 text-sky-400 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Both
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all ${
                viewMode === 'chart' ? 'bg-zinc-800 text-sky-400 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Chart</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all ${
                viewMode === 'table' ? 'bg-zinc-800 text-sky-400 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Visual Chart */}
        {(viewMode === 'chart' || viewMode === 'both') && (
          <div className="pt-4 pb-2">
            {items.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs font-mono text-zinc-500">
                No technological telemetry recorded for this dimension.
              </div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#71717a" 
                      fontSize={10} 
                      fontFamily="monospace"
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis stroke="#71717a" fontSize={10} fontFamily="monospace" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: '#f4f4f5'
                      }}
                      formatter={(val: any, name: any, item: any) => [
                        `${Number(val).toLocaleString()} visitors (${item.payload.percentage}%)`,
                        item.payload.fullName
                      ]}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`tech-bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Data Table */}
        {(viewMode === 'table' || viewMode === 'both') && (
          <div className="mt-4 pt-4 border-t border-zinc-800/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 pb-2">
                    <th className="pb-2 font-semibold">Specification</th>
                    <th className="pb-2 font-semibold text-right">Visitors</th>
                    <th className="pb-2 font-semibold text-right">Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {items.map((item, idx) => {
                    const color = TECH_COLOR_PALETTE[(idx + colorOffset) % TECH_COLOR_PALETTE.length];
                    const barWidth = Math.round((item.count / maxCount) * 100);

                    return (
                      <tr key={idx} className="hover:bg-zinc-800/40 transition-colors group">
                        {/* Name */}
                        <td className="py-2.5 pr-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-zinc-200 font-medium group-hover:text-white truncate">
                              {item.name}
                            </span>
                          </div>
                        </td>

                        {/* Count */}
                        <td className="py-2.5 px-2 text-right text-zinc-300 font-bold">
                          {item.count.toLocaleString()}
                        </td>

                        {/* Share Percentage + Progress */}
                        <td className="py-2.5 pl-2 text-right">
                          <div className="inline-flex items-center space-x-2 justify-end">
                            <span className="text-sky-400 font-bold">{item.percentage}%</span>
                            <div className="w-16 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 hidden sm:block">
                              <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: color }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const TechnologyView: React.FC<TechnologyViewProps> = ({ site }) => {
  const [data, setData] = useState<TechnologyData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTechnology = async () => {
    setLoading(true);
    try {
      const res = await fetchTechnologyData(site.id);
      setData(res);
    } catch (e) {
      console.error('Error fetching technology data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTechnology();
  }, [site.id]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800/60 text-sky-400 text-xs font-mono font-medium">
            <Cpu className="w-3.5 h-3.5" />
            <span>TECHNOLOGY & HARDWARE TELEMETRY ENGINE</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Technology Stack Analytics</span>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              8 Telemetry Dimensions
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            Hardware, browser, OS, screen resolution, viewport, timezone, and device specifications of visitors on <span className="text-zinc-200 font-mono">{site.domain}</span>.
          </p>
        </div>

        <button
          onClick={loadTechnology}
          disabled={loading}
          className="self-start md:self-auto inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-medium transition-colors border border-zinc-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Hardware</span>
        </button>
      </div>

      {loading || !data ? (
        <div className="p-16 text-center text-xs font-mono text-zinc-500 space-y-3">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Processing Technology & Hardware Specification Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Browser */}
          <TechDimensionCard
            title="Browser"
            subtitle="Client Web Browsers"
            icon={<Laptop className="w-4 h-4" />}
            items={data.browsers}
            colorOffset={0}
          />

          {/* 2. Browser Version */}
          <TechDimensionCard
            title="Browser Version"
            subtitle="Specific browser release builds"
            icon={<Cpu className="w-4 h-4" />}
            items={data.browserVersions}
            colorOffset={1}
          />

          {/* 3. Operating System */}
          <TechDimensionCard
            title="Operating System"
            subtitle="Desktop and mobile OS platforms"
            icon={<Layers className="w-4 h-4" />}
            items={data.operatingSystems}
            colorOffset={2}
          />

          {/* 4. Language */}
          <TechDimensionCard
            title="Language"
            subtitle="Browser locale preferred languages"
            icon={<Globe2 className="w-4 h-4" />}
            items={data.languages}
            colorOffset={3}
          />

          {/* 5. Timezone */}
          <TechDimensionCard
            title="Timezone"
            subtitle="Client system regional timezones"
            icon={<Clock className="w-4 h-4" />}
            items={data.timezones}
            colorOffset={4}
          />

          {/* 6. Screen Resolution */}
          <TechDimensionCard
            title="Screen Resolution"
            subtitle="Physical display monitor dimensions"
            icon={<Monitor className="w-4 h-4" />}
            items={data.screenResolutions}
            colorOffset={5}
          />

          {/* 7. Viewport */}
          <TechDimensionCard
            title="Viewport"
            subtitle="Actual render window canvas bounds"
            icon={<Maximize className="w-4 h-4" />}
            items={data.viewports}
            colorOffset={6}
          />

          {/* 8. Device Type */}
          <TechDimensionCard
            title="Device Type"
            subtitle="Form factor classification (Desktop, Mobile, Tablet)"
            icon={<Smartphone className="w-4 h-4" />}
            items={data.deviceTypes}
            colorOffset={7}
          />
        </div>
      )}
    </div>
  );
};
