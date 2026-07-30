/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_COLLECTOR_URL: string;
  readonly VITE_PULSE_SDK_VERSION: string;
  readonly VITE_PULSE_COLLECTOR_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
