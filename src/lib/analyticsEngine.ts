import { 
  Site, 
  ApiKey, 
  Visitor, 
  Session, 
  PageView, 
  AnalyticsEvent, 
  TimeRange, 
  AnalyticsSummary, 
  TimeSeriesPoint, 
  BreakdownItem, 
  CustomEventSummary,
  CountryAnalyticsItem,
  GlobalFilterState
} from '../types/analytics';

// Helper to format country code to flag emoji
export function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return '🌐';
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
