import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Globe, 
  Tag, 
  Compass, 
  Search, 
  MessageSquare, 
  BarChart3, 
  PieChart as PieChartIcon, 
  RefreshCw,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Filter
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { AcquisitionData, Site, BreakdownItem } from '../types/analytics';
import { fetchAcquisitionData } from '../lib/analytics';

interface AcquisitionViewProps {
  site: Site;
}

const COLOR_PALETTE = [
  '#10b981', // Emerald
  '#0ea5e9', // Sky
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#6366f1', // Indigo
];

interface DimensionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: BreakdownItem[];
  colorOffset?: number;
}

const DimensionCard: React.FC<DimensionCardProps> = ({ title, subtitle, icon, items, colorOffset = 0 }) => {
  const [chartType, setChartType] = useState<'both' | 'pie' | 'bar'>('both');

  const chartData = items.map((item, idx) => ({
    name: item.name.length > 18 ? item.name.slice(0, 16) + '...' : item.name,
    fullName: item.name,
    value: item.count,
    percentage: item.percentage,
    color: COLOR_PALETTE[(idx + colorOffset) % COLOR_PALETTE.length],
  }));

  const totalCount = items.reduce((acc, i) => acc + i.count, 0) || 1;

  return (
    <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm space-y-5 flex flex-col justify-between">
      <div>
        {/* Header with Icon, Title, and Chart Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-emerald-400">
              {icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-zinc-400 font-mono">{subtitle}</p>
            </div>
          </div>

          {/* Chart Toggle */}
          <div className="inline-flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800 self-start sm:self-auto text-xs font-mono">
            <button
              onClick={() => setChartType('both')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                chartType === 'both' ? 'bg-zinc-800 text-emerald-400 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Both
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all ${
                chartType === 'pie' ? 'bg-zinc-800 text-emerald-400 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Pie</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all ${
                chartType === 'bar' ? 'bg-zinc-800 text-emerald-400 font-bold shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Bar</span>
            </button>
          </div>
        </div>

        {/* Charts Container */}
        <div className="pt-4 pb-2">
          {items.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs font-mono text-zinc-500">
              No acquisition traffic recorded for this dimension.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Pie Chart Visualization */}
              {(chartType === 'pie' || chartType === 'both') && (
                <div className={`h-56 ${chartType === 'pie' ? 'col-span-full' : ''}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#18181b" strokeWidth={2} />
                        ))}
                      </Pie>
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
                          `${Number(val).toLocaleString()} views (${item.payload.percentage}%)`,
                          item.payload.fullName
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Bar Chart Visualization */}
              {(chartType === 'bar' || chartType === 'both') && (
                <div className={`h-56 ${chartType === 'bar' ? 'col-span-full' : ''}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#71717a" 
                        fontSize={10} 
                        fontFamily="monospace"
                        angle={-25}
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
                          `${Number(val).toLocaleString()} views (${item.payload.percentage}%)`,
                          item.payload.fullName
                        ]}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`bar-cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data Breakdown Table */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2 font-semibold">
            <span>Source Channel Name</span>
            <div className="flex items-center space-x-6">
              <span>Traffic Views</span>
              <span>Share</span>
            </div>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => {
              const color = COLOR_PALETTE[(idx + colorOffset) % COLOR_PALETTE.length];
              return (
                <div key={idx} className="relative group p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2.5 truncate max-w-[65%] z-10">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-zinc-200 truncate group-hover:text-white transition-colors font-medium">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-6 z-10">
                    <span className="text-zinc-300 font-bold">{item.count.toLocaleString()}</span>
                    <span className="text-emerald-400 font-bold w-12 text-right">{item.percentage}%</span>
                  </div>

                  {/* Subtle Progress Bar */}
                  <div 
                    className="absolute inset-y-0 left-0 bg-zinc-800/30 rounded-xl transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AcquisitionView: React.FC<AcquisitionViewProps> = ({ site }) => {
  const [data, setData] = useState<AcquisitionData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAcquisition = async () => {
    setLoading(true);
    try {
      const res = await fetchAcquisitionData(site.id);
      setData(res);
    } catch (e) {
      console.error('Error fetching acquisition data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAcquisition();
  }, [site.id]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-mono font-medium">
            <Compass className="w-3.5 h-3.5" />
            <span>TRAFFIC ACQUISITION & CHANNEL ANALYTICS</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Acquisition Overview</span>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              7 Analytics Dimensions
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            Comprehensive breakdown of how visitors arrive at <span className="text-zinc-200 font-mono">{site.domain}</span>, including referrers, UTM parameters, search engines, and social platforms.
          </p>
        </div>

        <button
          onClick={loadAcquisition}
          disabled={loading}
          className="self-start md:self-auto inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-medium transition-colors border border-zinc-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Channels</span>
        </button>
      </div>

      {loading || !data ? (
        <div className="p-16 text-center text-xs font-mono text-zinc-500 space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Processing Acquisition & Channel Traffic Matrices...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Top Referrers */}
          <DimensionCard
            title="Top Referrers"
            subtitle="Exact HTTP referrer URLs driving traffic"
            icon={<Share2 className="w-4 h-4" />}
            items={data.topReferrers}
            colorOffset={0}
          />

          {/* 2. Top Domains */}
          <DimensionCard
            title="Top Domains"
            subtitle="Parent domain origins of incoming visitors"
            icon={<Globe className="w-4 h-4" />}
            items={data.topDomains}
            colorOffset={1}
          />

          {/* 3. UTM Source */}
          <DimensionCard
            title="UTM Source"
            subtitle="Campaign source parameters (utm_source)"
            icon={<Tag className="w-4 h-4" />}
            items={data.utmSources}
            colorOffset={2}
          />

          {/* 4. UTM Medium */}
          <DimensionCard
            title="UTM Medium"
            subtitle="Campaign marketing mediums (utm_medium)"
            icon={<Layers className="w-4 h-4" />}
            items={data.utmMediums}
            colorOffset={3}
          />

          {/* 5. UTM Campaign */}
          <DimensionCard
            title="UTM Campaign"
            subtitle="Target marketing campaigns (utm_campaign)"
            icon={<TrendingUp className="w-4 h-4" />}
            items={data.utmCampaigns}
            colorOffset={4}
          />

          {/* 6. Search Engine */}
          <DimensionCard
            title="Search Engine"
            subtitle="Organic & Paid search discovery channels"
            icon={<Search className="w-4 h-4" />}
            items={data.searchEngines}
            colorOffset={5}
          />

          {/* 7. Social Media */}
          <DimensionCard
            title="Social Media"
            subtitle="Inbound traffic from social networks"
            icon={<MessageSquare className="w-4 h-4" />}
            items={data.socialMedia}
            colorOffset={6}
          />
        </div>
      )}
    </div>
  );
};
