import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { tenantAPI } from '../services/tenantAPI';
import type { TenantBranding } from '../permissions/types';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  /** Current tenant's branding (falls back to the parent's if the user is a
   * sub-tenant, per spec §6.4) — null while unresolved or for accounts with
   * no tenant context, in which case default ShivAI branding is used as-is. */
  branding: TenantBranding | null;
}

const DEFAULT_FAVICON = '/Shivai1.png';

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
  useEffect(() => {
    if (!user?.tenantId) {
      setBranding(null);
      return;
    }
    tenantAPI
      .getBranding(user.tenantId)
      .then(setBranding)
      .catch(() => setBranding(null));
  }, [user?.tenantId]);

  useEffect(() => {
    const root = document.documentElement;
    if (branding?.primaryColor) root.style.setProperty('--brand-primary', branding.primaryColor);
    else root.style.removeProperty('--brand-primary');
    if (branding?.accentColor) root.style.setProperty('--brand-accent', branding.accentColor);
    else root.style.removeProperty('--brand-accent');

    // Favicon can't be server-rendered per-tenant with a static index.html,
    // so swap the <link> at runtime instead (spec §6.4).
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (link) link.href = branding?.faviconUrl || DEFAULT_FAVICON;
  }, [branding]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, branding }}>
      {children}
    </ThemeContext.Provider>
  );
};
