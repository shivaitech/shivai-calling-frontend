import { useEffect, useState } from 'react';
import { Upload, Check, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { tenantAPI } from '../../services/tenantAPI';
import Logo from '../../resources/images/ShivaiLogo.svg';

const DEFAULT_PRIMARY = '#7c3aed';
const DEFAULT_ACCENT = '#4f46e5';

/**
 * "Panel Branding" — Main Business logo/theme customization (spec §4.2).
 * Applies to this tenant AND all its sub-tenants (branding is never
 * re-brandable per-sub-tenant, spec §6.3). The "Powered by ShivAI" preview
 * below is shown exactly as it renders in the real Sidebar/TopBar — it is
 * NOT editable or toggle-able anywhere in this UI, by design (spec §6.2).
 */
const BrandingTab = () => {
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const tenantId = user?.tenantId || 'tenant-main-demo';

  useEffect(() => {
    tenantAPI
      .getBranding(tenantId)
      .then((branding) => {
        if (branding) {
          setLogoUrl(branding.logoUrl);
          setPrimaryColor(branding.primaryColor || DEFAULT_PRIMARY);
          setAccentColor(branding.accentColor || DEFAULT_ACCENT);
        }
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogoUpload = (file: File) => {
    // No upload endpoint yet — preview locally via object URL. Swapping in a
    // real upload (e.g. presigned S3 URL) only changes this handler.
    const url = URL.createObjectURL(file);
    setLogoUrl(url);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await tenantAPI.setBranding(tenantId, { logoUrl, faviconUrl: null, primaryColor, accentColor });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Panel Branding</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Customize the logo and colors your sub-tenants see when they log into their panel.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Logo</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                ) : (
                  <img src={Logo} alt="Default ShivAI logo" className="max-w-[70%] max-h-[70%] object-contain dark:invert" />
                )}
              </div>
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
              </label>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  Reset to default
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-2.5 py-2 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 px-2.5 py-2 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
            {isSaving ? 'Saving…' : saved ? 'Saved' : 'Save Branding'}
          </button>
        </div>

        {/* Live preview — mirrors the real Sidebar header exactly */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Preview</label>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
            <div className="flex flex-col items-start">
              <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden mb-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="max-w-full max-h-full object-contain" />
                ) : (
                  <img src={Logo} alt="" className="max-w-[70%] max-h-[70%] object-contain dark:invert" />
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Client Dashboard</p>
            </div>
            <div className="mt-4 space-y-2">
              <div
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white text-center"
                style={{ backgroundColor: primaryColor }}
              >
                Primary Button
              </div>
              <div
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-center border"
                style={{ borderColor: accentColor, color: accentColor }}
              >
                Accent Highlight
              </div>
            </div>

            {/* Non-removable ShivAI mark — exact render, not editable (spec §6.2) */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
              <Zap className="w-3 h-3" /> Powered by ShivAI
            </div>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            The "Powered by ShivAI" mark always appears beneath your logo and cannot be removed or customized.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrandingTab;
