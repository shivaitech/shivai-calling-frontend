import { useEffect, useState } from 'react';
import { Upload, Check, Loader2, Zap, Globe2, Building2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { tenantAPI } from '../../services/tenantAPI';
import { useTheme, BACKGROUND_TEXTURE_CSS, BACKGROUND_TEXTURE_SIZE } from '../../contexts/ThemeContext';
import type { Tenant, TenantBackgroundTexture } from '../../permissions/types';
import ModalOverlay from '../../components/ModalOverlay';
import Logo from '../../resources/images/ShivaiLogo.svg';

type BrandingScope = 'all' | 'tenant-only';

const DEFAULT_PRIMARY = '#7c3aed';
const DEFAULT_ACCENT = '#4f46e5';
const DEFAULT_BACKGROUND = '#ffffff';
const DEFAULT_HEADING = '#1e293b';
const DEFAULT_TEXT = '#64748b';
const DEFAULT_CARD_SURFACE = '#ffffff';

const TEXTURE_OPTIONS: Array<{ value: TenantBackgroundTexture; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'dots', label: 'Dots' },
  { value: 'lines', label: 'Lines' },
  { value: 'grid', label: 'Grid' },
];

/**
 * "Panel Branding" — Main Business logo/theme customization (spec §4.2).
 * Applies to this tenant AND all its sub-tenants (branding is never
 * re-brandable per-sub-tenant, spec §6.3). The "Powered by ShivAI" preview
 * below is shown exactly as it renders in the real Sidebar/TopBar — it is
 * NOT editable or toggle-able anywhere in this UI, by design (spec §6.2).
 */
const BrandingTab = () => {
  const { user } = useAuth();
  const { refreshBranding } = useTheme();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND);
  const [backgroundTexture, setBackgroundTexture] = useState<TenantBackgroundTexture>('none');
  const [headingColor, setHeadingColor] = useState(DEFAULT_HEADING);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT);
  const [cardSurfaceColor, setCardSurfaceColor] = useState(DEFAULT_CARD_SURFACE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [scope, setScope] = useState<BrandingScope>('all');
  const [subTenants, setSubTenants] = useState<Tenant[]>([]);
  const [selectedSubTenantId, setSelectedSubTenantId] = useState<string>('');

  const mainTenantId = user?.tenantId || 'tenant-main-demo';
  // Which record we're editing/reading right now — the Main Business's shared
  // branding, or one specific sub-tenant's own override.
  const activeTenantId = scope === 'tenant-only' && selectedSubTenantId ? selectedSubTenantId : mainTenantId;

  useEffect(() => {
    tenantAPI.listSubTenants().then((tenants) => {
      setSubTenants(tenants);
      setSelectedSubTenantId((prev) => prev || tenants[0]?.id || '');
    });
  }, []);

  const loadBranding = (id: string) => {
    setIsLoading(true);
    tenantAPI
      .getBranding(id)
      .then((branding) => {
        setLogoUrl(branding?.logoUrl ?? null);
        setPrimaryColor(branding?.primaryColor || DEFAULT_PRIMARY);
        setAccentColor(branding?.accentColor || DEFAULT_ACCENT);
        setBackgroundColor(branding?.backgroundColor || DEFAULT_BACKGROUND);
        setBackgroundTexture(branding?.backgroundTexture || 'none');
        setHeadingColor(branding?.headingColor || DEFAULT_HEADING);
        setTextColor(branding?.textColor || DEFAULT_TEXT);
        setCardSurfaceColor(branding?.cardSurfaceColor || DEFAULT_CARD_SURFACE);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!activeTenantId) return;
    loadBranding(activeTenantId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId]);

  const handleLogoUpload = (file: File) => {
    // No upload endpoint yet — preview locally via object URL. Swapping in a
    // real upload (e.g. presigned S3 URL) only changes this handler.
    const url = URL.createObjectURL(file);
    setLogoUrl(url);
  };

  const handleSave = async () => {
    if (!activeTenantId) return;
    setIsSaving(true);
    try {
      await tenantAPI.setBranding(
        activeTenantId,
        {
          logoUrl,
          faviconUrl: null,
          primaryColor,
          accentColor,
          backgroundColor: backgroundColor !== DEFAULT_BACKGROUND ? backgroundColor : undefined,
          backgroundTexture: backgroundTexture !== 'none' ? backgroundTexture : undefined,
          headingColor: headingColor !== DEFAULT_HEADING ? headingColor : undefined,
          textColor: textColor !== DEFAULT_TEXT ? textColor : undefined,
          cardSurfaceColor: cardSurfaceColor !== DEFAULT_CARD_SURFACE ? cardSurfaceColor : undefined,
        },
        scope,
      );
      refreshBranding();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetConfirm = async () => {
    if (!activeTenantId) return;
    setIsResetting(true);
    try {
      await tenantAPI.setBranding(
        activeTenantId,
        { logoUrl: null, faviconUrl: null, primaryColor: DEFAULT_PRIMARY, accentColor: DEFAULT_ACCENT },
        scope,
      );
      setLogoUrl(null);
      setPrimaryColor(DEFAULT_PRIMARY);
      setAccentColor(DEFAULT_ACCENT);
      setBackgroundColor(DEFAULT_BACKGROUND);
      setBackgroundTexture('none');
      setHeadingColor(DEFAULT_HEADING);
      setTextColor(DEFAULT_TEXT);
      setCardSurfaceColor(DEFAULT_CARD_SURFACE);
      refreshBranding();
      setShowResetConfirm(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Panel Branding</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Customize the logo and colors shown across your panel and your sub-tenants'.
        </p>
      </div>

      {/* Scope selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setScope('all')}
          className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-colors ${
            scope === 'all'
              ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${
            scope === 'all' ? 'border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
          }`}>
            <Globe2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">Update whole UI</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Applies to your panel and every sub-tenant that has no branding of their own.</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setScope('tenant-only')}
          className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-colors ${
            scope === 'tenant-only'
              ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${
            scope === 'tenant-only' ? 'border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
          }`}>
            <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">Only update sub-tenant panel</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pick one sub-tenant and give just their panel its own look.</p>
          </div>
        </button>
      </div>

      {scope === 'tenant-only' && (
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Sub-Tenant</label>
          <select
            value={selectedSubTenantId}
            onChange={(e) => setSelectedSubTenantId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {subTenants.length === 0 && <option value="">No sub-tenants yet</option>}
            {subTenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : (
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

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Panel Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1 px-2.5 py-2 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              />
              {backgroundColor !== DEFAULT_BACKGROUND && (
                <button
                  type="button"
                  onClick={() => setBackgroundColor(DEFAULT_BACKGROUND)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Background Texture</label>
            <div className="grid grid-cols-4 gap-2">
              {TEXTURE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBackgroundTexture(opt.value)}
                  className={`rounded-lg border px-2 py-2 text-center transition-colors ${
                    backgroundTexture === opt.value
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div
                    className="w-full h-6 rounded mb-1 border border-slate-200 dark:border-slate-700"
                    style={{
                      backgroundColor,
                      backgroundImage: BACKGROUND_TEXTURE_CSS[opt.value],
                      backgroundSize: BACKGROUND_TEXTURE_SIZE[opt.value] || 'auto',
                    }}
                  />
                  <span className="text-[10px] font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Heading Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={headingColor}
                  onChange={(e) => setHeadingColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={headingColor}
                  onChange={(e) => setHeadingColor(e.target.value)}
                  className="flex-1 px-2.5 py-2 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="flex-1 px-2.5 py-2 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Card Surface Color</label>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1.5">
              Background used by cards, stat tiles, and list rows throughout the panel.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={cardSurfaceColor}
                onChange={(e) => setCardSurfaceColor(e.target.value)}
                className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={cardSurfaceColor}
                onChange={(e) => setCardSurfaceColor(e.target.value)}
                className="flex-1 px-2.5 py-2 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              />
              {cardSurfaceColor !== DEFAULT_CARD_SURFACE && (
                <button
                  type="button"
                  onClick={() => setCardSurfaceColor(DEFAULT_CARD_SURFACE)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !activeTenantId}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
              {isSaving
                ? 'Saving…'
                : saved
                ? 'Saved'
                : scope === 'tenant-only'
                ? `Save for ${subTenants.find((t) => t.id === selectedSubTenantId)?.name || 'sub-tenant'}`
                : 'Save for Everyone'}
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              disabled={!activeTenantId}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
            </button>
          </div>
        </div>

        {/* Live preview — mirrors the real Sidebar header exactly */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Preview</label>
          <div
            className="rounded-xl border border-slate-200 dark:border-slate-700 p-6"
            style={{
              backgroundColor,
              backgroundImage: BACKGROUND_TEXTURE_CSS[backgroundTexture],
              backgroundSize: BACKGROUND_TEXTURE_SIZE[backgroundTexture] || 'auto',
            }}
          >
            <div className="flex flex-col items-start">
              <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden mb-3 bg-white">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="max-w-full max-h-full object-contain" />
                ) : (
                  <img src={Logo} alt="" className="max-w-[70%] max-h-[70%] object-contain" />
                )}
              </div>
              <p className="text-base font-bold" style={{ color: headingColor }}>Client Dashboard</p>
              <p className="text-xs mt-0.5" style={{ color: textColor }}>Here's what's happening today.</p>
            </div>

            {/* Card preview — mirrors GlassCard's bg-surface/border-surface-border */}
            <div
              className="mt-4 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70"
              style={{ backgroundColor: cardSurfaceColor }}
            >
              <p className="text-xs font-semibold" style={{ color: headingColor }}>Total Agents</p>
              <p className="text-lg font-bold mt-0.5" style={{ color: headingColor }}>10</p>
              <p className="text-[11px] mt-0.5" style={{ color: textColor }}>+2 this month</p>
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
      )}

      <ModalOverlay open={showResetConfirm} onClose={() => (isResetting ? undefined : setShowResetConfirm(false))} closeOnBackdrop={!isResetting} panelClassName="max-w-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">Reset to Default?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This clears the logo, colors, background, and texture{' '}
                {scope === 'tenant-only'
                  ? `for ${subTenants.find((t) => t.id === selectedSubTenantId)?.name || 'this sub-tenant'}`
                  : 'for everyone'}{' '}
                and restores the default ShivAI look.
              </p>
            </div>
          </div>
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-2.5">
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              disabled={isResetting}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetConfirm}
              disabled={isResetting}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50"
            >
              {isResetting ? 'Resetting…' : 'Reset'}
            </button>
          </div>
        </div>
      </ModalOverlay>
    </div>
  );
};

export default BrandingTab;
