import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Plus, 
  Copy, 
  Check, 
  ShieldCheck, 
  Terminal, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  Trash2, 
  Eye, 
  EyeOff, 
  X,
  Lock,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { ApiKey, Site } from '../types/analytics';
import { 
  fetchApiKeysData, 
  createApiKeyData, 
  revokeApiKeyData, 
  regenerateApiKeyData 
} from '../lib/analytics';

interface ApiKeysViewProps {
  site: Site;
}

export const ApiKeysView: React.FC<ApiKeysViewProps> = ({ site }) => {
  const collectorUrl = import.meta.env.VITE_COLLECTOR_URL;
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Dialogs
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);
  const [isRevokeConfirmOpen, setIsRevokeConfirmOpen] = useState(false);
  const [targetKey, setTargetKey] = useState<ApiKey | null>(null);

  // Raw secret key modal state (SHOW ONCE)
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<{
    secretKey: string;
    keyName: string;
    actionType: 'created' | 'regenerated';
  } | null>(null);

  // Form State
  const [keyName, setKeyName] = useState('');
  const [expirationOption, setExpirationOption] = useState<'never' | '30' | '60' | '90' | '365'>('365');

  // Copy Feedback State
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const loadKeys = async () => {
    setLoading(true);
    const apiKeys = await fetchApiKeysData(site.id);
    setKeys(apiKeys);
    setLoading(false);
  };

  useEffect(() => {
    loadKeys();
  }, [site.id]);

  // Handle Generate Key
  const handleOpenGenerate = () => {
    setKeyName(`Ingestion Key - ${new Date().toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}`);
    setExpirationOption('365');
    setIsGenerateOpen(true);
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    let expiresAt: string | null = null;
    if (expirationOption !== 'never') {
      const days = parseInt(expirationOption, 10);
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + days);
      expiresAt = expDate.toISOString();
    }

    const result = await createApiKeyData(site.id, keyName, expiresAt);
    await loadKeys();
    setIsGenerateOpen(false);

    // Show raw secret key ONLY ONCE
    setNewlyCreatedSecret({
      secretKey: result.rawSecret,
      keyName: result.apiKey.name,
      actionType: 'created',
    });
  };

  // Handle Regenerate Key
  const handleOpenRegenerate = (key: ApiKey) => {
    setTargetKey(key);
    setIsRegenerateConfirmOpen(true);
  };

  const handleConfirmRegenerate = async () => {
    if (!targetKey) return;
    const result = await regenerateApiKeyData(site.id, targetKey.id);
    await loadKeys();
    setIsRegenerateConfirmOpen(false);

    if (result) {
      setNewlyCreatedSecret({
        secretKey: result.rawSecret,
        keyName: result.apiKey.name,
        actionType: 'regenerated',
      });
    }
  };

  // Handle Revoke Key
  const handleOpenRevoke = (key: ApiKey) => {
    setTargetKey(key);
    setIsRevokeConfirmOpen(true);
  };

  const handleConfirmRevoke = async () => {
    if (!targetKey) return;
    await revokeApiKeyData(site.id, targetKey.id);
    await loadKeys();
    setIsRevokeConfirmOpen(false);
  };

  // Copy helper
  const handleCopyText = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedKeyId(id);
      setTimeout(() => setCopiedKeyId(null), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const getStatusBadge = (key: ApiKey) => {
    const isExpired = key.expires_at && new Date(key.expires_at) < new Date();
    const effectiveStatus = isExpired ? 'expired' : key.status;

    if (effectiveStatus === 'active') {
      return (
        <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Active</span>
        </span>
      );
    }
    if (effectiveStatus === 'expired') {
      return (
        <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>Expired</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
        <ShieldAlert className="w-3 h-3 text-rose-400" />
        <span>Revoked</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-400" />
            <span>Sistem Manajemen API Keys</span>
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Kelola kunci autentikasi ingestion data server-side untuk website <span className="font-mono text-zinc-200 font-semibold">{site.domain}</span>. API key disimpan secara terenkripsi menggunakan SHA-256 Hash.
          </p>
        </div>

        <button
          id="generate-api-key-btn"
          onClick={handleOpenGenerate}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-md shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate API Key Baru</span>
        </button>
      </div>

      {/* API Keys Table / Card List */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/90 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Daftar API Key Terdaftar</h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">Database Contract: `api_keys`</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Memuat API Keys...</span>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Key className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-mono">Belum ada API Key yang dibuat untuk site ini.</p>
            <button
              onClick={handleOpenGenerate}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-semibold font-mono transition-colors"
            >
              + Generate Kunci Pertama
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {keys.map((k) => {
              const isRevoked = k.status === 'revoked';
              const isExpired = k.expires_at && new Date(k.expires_at) < new Date();

              return (
                <div key={k.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-sm text-white">{k.name || 'API Key'}</span>
                      {getStatusBadge(k)}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400">
                      <span className="bg-zinc-950 px-2 py-1 rounded border border-zinc-800/80 text-zinc-300 font-bold">
                        Prefix: {k.key_prefix || `pa_live_${k.id.slice(0, 6)}...`}
                      </span>
                      <span className="text-zinc-500">&bull;</span>
                      <span>Hash: <code className="text-zinc-500 text-[10px]">{k.key_hash ? `${k.key_hash.substring(0, 12)}...` : 'sha256_e3b0c442...'}</code></span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-zinc-500 font-mono">
                      <span>Dibuat: {new Date(k.created_at).toLocaleDateString('id-ID')}</span>
                      <span>
                        Kadaluarsa:{' '}
                        {k.expires_at
                          ? new Date(k.expires_at).toLocaleDateString('id-ID')
                          : 'Selamanya (Never)'}
                      </span>
                      <span>
                        Terakhir Digunakan:{' '}
                        {k.last_used_at
                          ? new Date(k.last_used_at).toLocaleDateString('id-ID')
                          : 'Belum Pernah'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleCopyText(k.key_prefix || k.id, k.id)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-colors"
                      title="Salin Key Prefix"
                    >
                      {copiedKeyId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKeyId === k.id ? 'Tersalin' : 'Copy Prefix'}</span>
                    </button>

                    {!isRevoked && (
                      <button
                        onClick={() => handleOpenRegenerate(k)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-amber-500/10 hover:text-amber-400 text-xs font-mono text-zinc-300 border border-transparent hover:border-amber-500/30 transition-all"
                        title="Regenerate Key Rahasia Baru"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Regenerate</span>
                      </button>
                    )}

                    {!isRevoked && (
                      <button
                        onClick={() => handleOpenRevoke(k)}
                        className="p-1.5 rounded-xl bg-zinc-800 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-transparent hover:border-rose-500/30 transition-all"
                        title="Revoke / Batalkan Key Ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Code Snippet Example */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center space-x-2 text-sm font-semibold text-zinc-200">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Server-Side Ingestion Authorization Header Example</span>
        </div>

        <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
{`curl -X POST ${collectorUrl}/api/v1/collect/event \\
  -H "Authorization: Bearer <YOUR_RAW_SECRET_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "site_id": "${site.id}",
    "event_name": "checkout_completed",
    "event_value": 499000
  }'`}
        </pre>
      </div>

      {/* Modal 1: Generate API Key */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Key className="w-5 h-5 text-emerald-400" />
                <span>Generate Ingestion API Key</span>
              </h3>
              <button
                onClick={() => setIsGenerateOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Nama Key / Identifier
                </label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="Misal: Production Backend Ingestion"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Masa Berlaku (Expiration)
                </label>
                <select
                  value={expirationOption}
                  onChange={(e) => setExpirationOption(e.target.value as 'never' | '30' | '60' | '90' | '365')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="30">30 Hari</option>
                  <option value="60">60 Hari</option>
                  <option value="90">90 Hari</option>
                  <option value="365">1 Tahun (365 Hari)</option>
                  <option value="never">Tanpa Batas Waktu (Never Expire)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed space-y-1">
                <div className="font-semibold flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Keamanan Hash SHA-256</span>
                </div>
                <p className="text-[11px] text-amber-200/80">
                  Value rahasia kunci asli hanya disimpan dalam bentuk Hash. Setelah dibuat, kunci rahasia hanya ditampilkan sekali.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: RAW Secret Display Modal (SHOWN ONLY ONCE) */}
      {newlyCreatedSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-zinc-900 border border-emerald-500/50 rounded-2xl p-6 space-y-5 animate-scale-up shadow-2xl">
            <div className="flex items-center space-x-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">
                  API Key Berhasil Di-{newlyCreatedSecret.actionType === 'created' ? 'buat' : 'regenerate'}!
                </h3>
                <p className="text-xs text-zinc-400 font-mono">{newlyCreatedSecret.keyName}</p>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>PENTING: SIMPAN KUNCI INI SEKARANG!</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-200/90">
                Nilai rahasia (raw secret key) di bawah ini <strong>HANYA DITAMPILKAN SATU KALI SAJA</strong>. Kami tidak menyimpan kunci mentah ini di database kami. Salin dan simpan di environment variable aman Anda.
              </p>
            </div>

            {/* Raw Key Display Box */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Raw Secret Key:
              </label>
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-emerald-400 font-bold break-all selection:bg-emerald-500 selection:text-zinc-950">
                  {newlyCreatedSecret.secretKey}
                </code>
                <button
                  onClick={() => handleCopyText(newlyCreatedSecret.secretKey)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shrink-0 transition-all shadow"
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSecret ? 'Tersalin!' : 'Copy Secret'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setNewlyCreatedSecret(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all"
              >
                Saya Sudah Menyimpan Secret Key Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Regenerate Confirmation Modal */}
      {isRegenerateConfirmOpen && targetKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <RefreshCw className="w-6 h-6 flex-shrink-0 animate-spin-slow" />
              <h3 className="text-base font-bold text-white">Konfirmasi Regenerate API Key</h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Apakah Anda yakin ingin melakukan regenerate untuk kunci <strong className="text-white font-mono">{targetKey.name}</strong>?
            </p>
            <p className="text-xs text-amber-300/90 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 leading-relaxed">
              <strong>Peringatan:</strong> Tindakan ini akan membatalkan (revoke) kunci rahasia lama dan menerbitkan kunci rahasia baru. Seluruh server atau skrip yang menggunakan kunci lama akan ditolak hingga diperbarui.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRegenerateConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRegenerate}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold"
              >
                Regenerate Kunci
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Revoke Confirmation Modal */}
      {isRevokeConfirmOpen && targetKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-rose-500/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-white">Konfirmasi Revoke API Key</h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Apakah Anda yakin ingin mencabut (revoke) API Key <strong className="text-white font-mono">{targetKey.name}</strong>?
            </p>
            <p className="text-xs text-rose-300/90 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 leading-relaxed">
              Kunci ini akan dinonaktifkan secara permanen dan permintaan API yang menggunakan kunci ini akan ditolak.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRevokeConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold"
              >
                Ya, Revoke Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
