import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hover = false }) => {
  const { branding } = useTheme();
  // Card content (headings/body text) is written by ~49 different consumer
  // files with their own hardcoded text-slate-800/text-slate-500 etc.
  // classes — rather than editing all of them, force those classes to the
  // tenant's heading/text color ONLY while a custom card surface is active,
  // via the same scoped-override technique as Sidebar/TopBar (see
  // .tenant-card-branded rules in src/index.css).
  const isCardBranded = Boolean(branding?.cardSurfaceColor);

  return (
    <div className={`
      bg-surface backdrop-blur-xl
      border border-surface-border
      rounded-xl sm:rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-slate-900/20
      ${hover ? 'hover:shadow-2xl hover:shadow-slate-200/30 dark:hover:shadow-slate-900/30 hover:-translate-y-1 transition-all duration-300' : ''}
      ${isCardBranded ? 'tenant-card-branded' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default GlassCard;