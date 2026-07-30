import React, { useState, useEffect } from 'react';
import {
  Code,
  Terminal,
  Copy,
  Check,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Site, ApiKey } from '../types/analytics';
import { fetchApiKeysData } from '../lib/analytics';

interface TrackingInstallationViewProps {
  site: Site;
}

type FrameworkId =
  | 'html_script'
  | 'nextjs'
  | 'react'
  | 'vue'
  | 'nuxt'
  | 'svelte'
  | 'astro'
  | 'laravel'
  | 'wordpress'
  | 'remix';

interface FrameworkOption {
  id: FrameworkId;
  name: string;
  category: string;
}

const FRAMEWORKS: FrameworkOption[] = [
  { id: 'html_script', name: 'HTML', category: 'Standard' },
  { id: 'react', name: 'React', category: 'SPA' },
  { id: 'nextjs', name: 'Next.js', category: 'Framework' },
  { id: 'vue', name: 'Vue', category: 'SPA' },
  { id: 'nuxt', name: 'Nuxt', category: 'Framework' },
  { id: 'svelte', name: 'Svelte', category: 'Framework' },
  { id: 'astro', name: 'Astro', category: 'Static' },
  { id: 'laravel', name: 'Laravel', category: 'Backend' },
  { id: 'wordpress', name: 'WordPress', category: 'CMS' },
  { id: 'remix', name: 'Remix', category: 'Fullstack' },
];

const API_KEY_PLACEHOLDER = 'YOUR_PULSE_API_KEY';

function getCollectorBase(): string {
  const raw = import.meta.env.VITE_COLLECTOR_URL || '';
  return raw.replace(/\/$/, '');
}

export const TrackingInstallationView: React.FC<TrackingInstallationViewProps> = ({ site }) => {
  const collectorUrl = getCollectorBase();
  const [activeFramework, setActiveFramework] = useState<FrameworkId>('html_script');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [snippetApiKey, setSnippetApiKey] = useState<string>(API_KEY_PLACEHOLDER);
  const [copied, setCopied] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState<
    'not_connected' | 'testing' | 'connected' | 'receiving_data' | 'failed'
  >('not_connected');
  const [lastEvent, setLastEvent] = useState<{ time: string; type: string; path: string } | null>(
    null
  );
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    async function loadKeys() {
      const keys = await fetchApiKeysData(site.id);
      setApiKeys(keys.filter((k) => k.status === 'active'));
    }
    loadKeys();
  }, [site.id]);

  const keyToUse = snippetApiKey.trim() || API_KEY_PLACEHOLDER;
  const trackerSrc = collectorUrl ? `${collectorUrl}/tracker.js` : '__SET_VITE_COLLECTOR_URL__/tracker.js';

  const getCodeSnippet = (fw: FrameworkId): string => {
    switch (fw) {
      case 'html_script':
        return `<!-- Pulse Analytics — paste before </head> -->
<script
  defer
  src="${trackerSrc}"
  data-api-key="${keyToUse}">
</script>`;

      case 'nextjs':
        return `// app/layout.tsx (Next.js App Router)
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="${trackerSrc}"
                  data-api-key="${keyToUse}"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}`;

      case 'react':
        return `// src/App.tsx (or root layout) — inject collector-hosted tracker.js
import { useEffect } from 'react';

const COLLECTOR_URL = '${collectorUrl || 'https://YOUR_COLLECTOR_HOST'}';
const API_KEY = '${keyToUse}';

export default function App() {
  useEffect(() => {
    if (document.querySelector('script[data-pulse-tracker]')) return;
    const script = document.createElement('script');
    script.src = \`\${COLLECTOR_URL.replace(/\\/$/, '')}/tracker.js\`;
    script.defer = true;
    script.setAttribute('data-api-key', API_KEY);
    script.setAttribute('data-pulse-tracker', '1');
    document.head.appendChild(script);
  }, []);

  return <div>{/* your app */}</div>;
}`;

      case 'vue':
        return `// main.ts (Vue 3) — inject collector-hosted tracker.js
import { createApp } from 'vue';
import App from './App.vue';

const COLLECTOR_URL = '${collectorUrl || 'https://YOUR_COLLECTOR_HOST'}';
const API_KEY = '${keyToUse}';

if (typeof document !== 'undefined' && !document.querySelector('script[data-pulse-tracker]')) {
  const script = document.createElement('script');
  script.src = \`\${COLLECTOR_URL.replace(/\\/$/, '')}/tracker.js\`;
  script.defer = true;
  script.setAttribute('data-api-key', API_KEY);
  script.setAttribute('data-pulse-tracker', '1');
  document.head.appendChild(script);
}

createApp(App).mount('#app');`;

      case 'nuxt':
        return `// plugins/pulse-analytics.client.ts (Nuxt 3)
export default defineNuxtPlugin(() => {
  if (import.meta.server) return;
  if (document.querySelector('script[data-pulse-tracker]')) return;

  const script = document.createElement('script');
  script.src = '${trackerSrc}';
  script.defer = true;
  script.setAttribute('data-api-key', '${keyToUse}');
  script.setAttribute('data-pulse-tracker', '1');
  document.head.appendChild(script);
});`;

      case 'svelte':
        return `<!-- src/routes/+layout.svelte (SvelteKit) -->
<script>
  // Pulse Analytics loads via svelte:head below
</script>

<svelte:head>
  <script
    defer
    src="${trackerSrc}"
      data-api-key="${keyToUse}"
  ></script>
</svelte:head>

<slot />`;

      case 'astro':
        return `---
// src/layouts/Layout.astro
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${site.name}</title>
    <script
      defer
      src="${trackerSrc}"
          data-api-key="${keyToUse}"
    ></script>
  </head>
  <body>
    <slot />
  </body>
</html>`;

      case 'laravel':
        return `{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Laravel') }}</title>
    <script
      defer
      src="${trackerSrc}"
          data-api-key="${keyToUse}"
    ></script>
</head>
<body>
    @yield('content')
</body>
</html>`;

      case 'wordpress':
        return `// functions.php (active theme) — outputs tracker in <head>
function add_pulse_analytics_tracker() {
    $collector = '${collectorUrl || 'https://YOUR_COLLECTOR_HOST'}';
    $api_key  = '${keyToUse}';
    printf(
        '<script defer src="%s/tracker.js" data-api-key="%s"></script>',
        esc_url(rtrim($collector, '/')),
        esc_attr($api_key)
    );
}
add_action('wp_head', 'add_pulse_analytics_tracker');`;

      case 'remix':
        return `// app/root.tsx (Remix)
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
        <script
          defer
          src="${trackerSrc}"
                  data-api-key="${keyToUse}"
        />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}`;

      default:
        return '';
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet(activeFramework));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus('testing');
    setTestMessage(null);

    if (!collectorUrl) {
      setIsTesting(false);
      setConnectionStatus('failed');
      setTestMessage('VITE_COLLECTOR_URL belum dikonfigurasi.');
      return;
    }

    if (!snippetApiKey.trim() || snippetApiKey.trim() === API_KEY_PLACEHOLDER) {
      setIsTesting(false);
      setConnectionStatus('failed');
      setTestMessage('Tempel raw API Key (bukan prefix) sebelum Test Connection.');
      return;
    }

    const testApiKey = snippetApiKey.trim();
    const testRunId = Date.now().toString(36);
    const visUid = `vis_test_${testRunId}`;
    const sesUid = `ses_test_${testRunId}`;
    const base = collectorUrl;

    try {
      const collectRes = await fetch(`${base}/api/v1/collect/pageview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testApiKey,
        },
        body: JSON.stringify({
          visitorUid: visUid,
          sessionUid: sesUid,
          url: `https://${site.domain}/test-connection-live`,
          path: '/test-connection-live',
          title: 'Live Connection Test Page',
          referrer: 'https://pulse-dashboard/test-connection',
          device_type: 'desktop',
          browser: 'Chrome',
          operating_system: 'Unknown',
        }),
      });

      const collectData = await collectRes.json().catch(() => ({}));
      if (![200, 202].includes(collectRes.status) || !collectData.success || !collectData.page_view_id) {
        throw new Error(
          collectData.error ||
            collectData.message ||
            `Pageview failed (HTTP ${collectRes.status})`
        );
      }

      const eventRes = await fetch(`${base}/api/v1/collect/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testApiKey,
        },
        body: JSON.stringify({
          visitorUid: visUid,
          sessionUid: sesUid,
          page_view_id: collectData.page_view_id,
          event_name: 'test_connection_ping',
          event_category: 'diagnostic',
          event_action: 'ping',
          event_label: 'Collector API Verified',
          event_value: 1,
        }),
      });

      const eventData = await eventRes.json().catch(() => ({}));
      if (![200, 202].includes(eventRes.status) || !eventData.success) {
        throw new Error(
          eventData.error || eventData.message || `Event failed (HTTP ${eventRes.status})`
        );
      }

      const hbRes = await fetch(`${base}/api/v1/collect/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': testApiKey,
        },
        body: JSON.stringify({
          visitorUid: visUid,
          sessionUid: sesUid,
          page_view_id: collectData.page_view_id,
          duration_seconds: 15,
          scroll_depth: 85,
        }),
      });

      const hbData = await hbRes.json().catch(() => ({}));
      if (![200, 202].includes(hbRes.status) || !hbData.success) {
        throw new Error(
          hbData.error || hbData.message || `Heartbeat failed (HTTP ${hbRes.status})`
        );
      }

      setConnectionStatus('receiving_data');
      setTestMessage(
        `Connection Successful � pageview ${collectData.page_view_id}, event ${eventData.event_id}, heartbeat OK.`
      );
      setLastEvent({
        time: 'Baru saja',
        type: 'test_connection_ping',
        path: '/test-connection-live',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setConnectionStatus('failed');
      setTestMessage(message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Code className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Installation Manager</h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Pasang tracker pada{' '}
              <span className="font-mono text-zinc-200 font-semibold">{site.domain}</span>. Snippet
              memakai Collector URL dari <span className="font-mono">VITE_COLLECTOR_URL</span> dan
              raw API Key yang Anda tempel (bukan prefix tampilan).
            </p>
          </div>

          <button
            id="test-connection-btn"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-md disabled:opacity-50 shrink-0 self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Menguji Koneksi...' : 'Test Connection'}</span>
          </button>
        </div>

        {!collectorUrl && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-mono">
            VITE_COLLECTOR_URL belum diset — snippet dan Test Connection tidak dapat berjalan.
          </div>
        )}

        {testMessage && (
          <div
            className={`p-3 rounded-xl border text-xs font-mono ${
              connectionStatus === 'failed'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {testMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-zinc-800/80">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-mono text-zinc-500">Status Koneksi</span>
              <div className="flex items-center space-x-2">
                {connectionStatus === 'receiving_data' && (
                  <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400 font-mono">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span>Receiving Data</span>
                  </span>
                )}
                {connectionStatus === 'connected' && (
                  <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Connected</span>
                  </span>
                )}
                {connectionStatus === 'testing' && (
                  <span className="flex items-center space-x-1.5 text-xs font-bold text-amber-400 font-mono">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Pinging...</span>
                  </span>
                )}
                {connectionStatus === 'failed' && (
                  <span className="flex items-center space-x-1.5 text-xs font-bold text-rose-400 font-mono">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Failed</span>
                  </span>
                )}
                {connectionStatus === 'not_connected' && (
                  <span className="flex items-center space-x-1.5 text-xs font-bold text-zinc-400 font-mono">
                    <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Not Connected</span>
                  </span>
                )}
              </div>
            </div>
            <Activity className="w-4 h-4 text-zinc-600" />
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-zinc-500">Collector URL</span>
            <div className="text-xs font-mono font-bold text-zinc-200 truncate">
              {collectorUrl || '(missing)'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-zinc-500">Site ID</span>
            <div className="text-xs font-mono font-bold text-zinc-200 truncate">{site.id}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-zinc-500">Last Test Event</span>
            <div className="text-xs font-mono text-zinc-300 flex items-center justify-between">
              <span className="text-emerald-400 font-bold">{lastEvent?.time || 'None'}</span>
              <span className="text-[10px] text-zinc-500 truncate max-w-[100px]">
                {lastEvent?.path || ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-zinc-400">
              Raw API Key untuk snippet &amp; Test Connection
            </label>
            <input
              type="password"
              value={snippetApiKey}
              onChange={(e) => setSnippetApiKey(e.target.value)}
              placeholder={API_KEY_PLACEHOLDER}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-zinc-500">
              Salin secret penuh saat Generate API Key (sekali tampil). Prefix tampilan tidak dapat
              dipakai untuk autentikasi produksi.
            </p>
          </div>
          {apiKeys.length > 0 && (
            <div className="text-[11px] text-zinc-500 font-mono self-center">
              {apiKeys.length} active key(s) on this site
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-200">Platform / Framework</h3>
          <span className="text-xs font-mono text-zinc-500">{FRAMEWORKS.length} opsi</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
          {FRAMEWORKS.map((fw) => {
            const isActive = activeFramework === fw.id;
            return (
              <button
                key={fw.id}
                id={`framework-tab-${fw.id}`}
                type="button"
                onClick={() => setActiveFramework(fw.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-md font-bold'
                    : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <span className="text-xs font-semibold">{fw.name}</span>
                <span className="text-[9px] font-mono text-zinc-500 mt-0.5">{fw.category}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
        <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-zinc-200 font-mono">
              Instalasi {FRAMEWORKS.find((f) => f.id === activeFramework)?.name}
            </span>
          </div>

          <button
            id="copy-installation-code-btn"
            type="button"
            onClick={handleCopyCode}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-semibold font-mono transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Copy Code'}</span>
          </button>
        </div>

        <div className="p-5 bg-zinc-950 overflow-x-auto">
          <pre className="text-xs font-mono text-emerald-300 leading-relaxed selection:bg-emerald-500 selection:text-zinc-950">
            {getCodeSnippet(activeFramework)}
          </pre>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-zinc-300">
          <HelpCircle className="w-4 h-4 text-sky-400" />
          <span>Verifikasi instalasi</span>
        </div>
        <ol className="list-decimal list-inside text-xs text-zinc-400 space-y-1 pl-1 leading-relaxed">
          <li>Generate API Key di tab API Keys, salin raw secret.</li>
          <li>Tempel raw secret di kolom di atas, salin snippet, pasang di website.</li>
          <li>
            Klik <strong>Test Connection</strong> — mengirim pageview, event, dan heartbeat ke{' '}
            <span className="font-mono">{collectorUrl || 'VITE_COLLECTOR_URL'}</span>.
          </li>
          <li>
            Buka tab <strong>Integration Verification</strong> dan Realtime untuk melihat data masuk.
          </li>
        </ol>
      </div>
    </div>
  );
};
