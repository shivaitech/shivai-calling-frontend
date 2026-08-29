import React from 'react';

/** Matches the standardized page-header treatment used across Workflows/Training
 * (slate gradient badge, bold title, muted subtitle) — see CallSetup.tsx. */
const SectionHeader: React.FC<{ icon: React.ElementType; title: string; subtitle: string }> = ({
  icon: Icon,
  title,
  subtitle,
}) => (
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700 flex items-center justify-center shadow-sm flex-shrink-0">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  </div>
);

export default SectionHeader;
