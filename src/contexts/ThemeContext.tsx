import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { tenantAPI } from '../services/tenantAPI';
import type { TenantBackgroundTexture, TenantBranding } from '../permissions/types';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  /** Current tenant's branding (falls back to the parent's if the user is a
   * sub-tenant, per spec §6.4) — null while unresolved or for accounts with
   * no tenant context, in which case default ShivAI branding is used as-is. */
  branding: TenantBranding | null;
  /** Re-fetches and re-applies branding for the logged-in user's own tenant —
   * call after BrandingTab saves so the change shows up live without a
   * reload (the initial fetch only runs once per user.tenantId change). */
  refreshBranding: () => void;
}

const DEFAULT_FAVICON = '/Shivai1.png';

/** Preset repeating-pattern CSS for the panel background — kept as plain
 * `background-image` values (radial/linear gradients, fixed low-opacity
 * black so it reads on any background color) so no image assets are
 * needed, and layered above `--tenant-bg` by consumers. */
const TEXTURE_INK = 'rgba(0,0,0,0.06)';
export const BACKGROUND_TEXTURE_CSS: Record<TenantBackgroundTexture, string> = {
  none: '',
  dots: `radial-gradient(${TEXTURE_INK} 1px, transparent 1px)`,
  lines: `repeating-linear-gradient(45deg, ${TEXTURE_INK} 0, ${TEXTURE_INK} 1px, transparent 1px, transparent 12px)`,
  grid: `linear-gradient(${TEXTURE_INK} 1px, transparent 1px), linear-gradient(90deg, ${TEXTURE_INK} 1px, transparent 1px)`,
};
export const BACKGROUND_TEXTURE_SIZE: Record<TenantBackgroundTexture, string> = {
  none: '',
  dots: '16px 16px',
  lines: '',
  grid: '24px 24px',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) {
        return saved === 'dark';
      }
      // Always default to light theme instead of system preference
      return false;
    }
    return false;
  });
  const [branding, setBranding] = useState<TenantBranding | null>(null);

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Fetch and apply tenant branding (spec §6.4). tenantAPI.getBranding
  // resolves to the MAIN tenant's branding even when called with a
  // sub-tenant's id — sub-tenants inherit their parent's branding rather
  // than having their own (spec §6.3, decided against sub-branding for v1).
  // No account has a real tenantRole/tenantId assigned yet (no backend
  // tenant assignment exists) — fall back to the same demo id BrandingTab
  // uses, so branding saved there is actually read back here.
  const effectiveTenantId = user?.tenantId || (user ? 'tenant-main-demo' : undefined);

  const fetchBranding = () => {
    if (!effectiveTenantId) {
      setBranding(null);
      return;
    }
    tenantAPI
      .getBranding(effectiveTenantId)
      .then(setBranding)
      .catch(() => setBranding(null));
  };

  useEffect(fetchBranding, [effectiveTenantId]);

  useEffect(() => {
    const root = document.documentElement;
    const setOrClear = (prop: string, value?: string | null) => {
      if (value) root.style.setProperty(prop, value);
      else root.style.removeProperty(prop);
    };

    setOrClear('--brand-primary', branding?.primaryColor);
    setOrClear('--brand-accent', branding?.accentColor);
    document.body.classList.toggle('tenant-primary-branded', Boolean(branding?.primaryColor));
    setOrClear('--tenant-bg', branding?.backgroundColor);
    setOrClear('--tenant-heading', branding?.headingColor);
    setOrClear('--tenant-text', branding?.textColor);
    // Border intentionally keeps its :root/:root.dark default (not
    // overridden here) — a border matching the custom surface fill exactly
    // would look borderless, so only the fill itself is tenant-controlled.
    setOrClear('--tenant-surface', branding?.cardSurfaceColor);
    const texture = branding?.backgroundTexture || 'none';
    setOrClear('--tenant-bg-texture', BACKGROUND_TEXTURE_CSS[texture]);
    setOrClear('--tenant-bg-texture-size', BACKGROUND_TEXTURE_SIZE[texture]);

    // Favicon can't be server-rendered per-tenant with a static index.html,
    // so swap the <link> at runtime instead (spec §6.4).
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (link) link.href = branding?.faviconUrl || DEFAULT_FAVICON;
  }, [branding]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, branding, refreshBranding: fetchBranding }}>
      {children}
    </ThemeContext.Provider>
  );
};
