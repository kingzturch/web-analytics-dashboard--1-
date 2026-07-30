import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { TimeSeriesPoint, TimeRange } from '../types/analytics';
import { Calendar, Users, Eye } from 'lucide-react';

interface MainChartProps {
  data: TimeSeriesPoint[];
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  selectedMetric?: 'visitors' | 'pageViews' | 'both';
  onMetricChange?: (metric: 'visitors' | 'pageViews' | 'both') => void;
  metricName?: string;
}

export const MainChart: React.FC<MainChartProps> = ({
  data,
  timeRange,
  onTimeRangeChange,
  selectedMetric,
  onMetricChange = () => {},
}) => {
  const timeRanges: { label: string; value: TimeRange }[] = [
    { label: '24 Hours', value: '24h' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
  ];

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 shadow-sm space-y-5">
      {/* Chart Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        
        {/* Left: Metric View Selector */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs font-medium self-start sm:self-auto">
          <button
            id="chart-metric-visitors"
            onClick={() => onMetricChange('visitors')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              selectedMetric === 'visitors'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Unique Visitors</span>
          </button>

          <button
            id="chart-metric-pageviews"
            onClick={() => onMetricChange('pageViews')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              selectedMetric === 'pageViews'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Page Views</span>
          </button>

          <button
            id="chart-metric-both"
            onClick={() => onMetricChange('both')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              selectedMetric === 'both'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Both</span>
          </button>
        </div>

        {/* Right: Time Range Buttons */}
        <div className="flex items-center space-x-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800 text-xs font-medium self-end sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-zinc-500 ml-2 mr-1 hidden sm:inline" />
          {timeRanges.map(range => (
            <button
              key={range.value}
              id={`time-range-${range.value}`}
              onClick={() => onTimeRangeChange(range.value)}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                (timeRange || '30d') === range.value
                  ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {/* Visitors Gradient */}
              <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>

              {/* PageViews Gradient */}
              <linearGradient id="pageViewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />

            <XAxis
              dataKey="formattedTime"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={8}
            />

            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-zinc-900 border border-zinc-700/80 p-3 rounded-xl shadow-xl font-mono text-xs space-y-1.5">
                      <div className="text-zinc-400 font-sans border-b border-zinc-800 pb-1 mb-1">
                        {label}
                      </div>
                      {payload.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between space-x-4">
                          <span className="flex items-center space-x-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-zinc-300 font-sans">
                              {entry.name === 'visitors' ? 'Unique Visitors' : 'Page Views'}
                            </span>
                          </span>
                          <span className="font-bold text-white">
                            {Number(entry.value).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />

            {(selectedMetric === 'visitors' || selectedMetric === 'both') && (
              <Area
                type="monotone"
                dataKey="visitors"
                name="visitors"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#visitorsGradient)"
              />
            )}

            {(selectedMetric === 'pageViews' || selectedMetric === 'both') && (
              <Area
                type="monotone"
                dataKey="pageViews"
                name="pageViews"
                stroke="#38bdf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#pageViewsGradient)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
