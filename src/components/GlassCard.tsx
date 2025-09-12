import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div className={`
      bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl 
      border border-slate-200/70 dark:border-slate-700/70 
      rounded-xl sm:rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-slate-900/20
      ${hover ? 'hover:shadow-2xl hover:shadow-slate-200/30 dark:hover:shadow-slate-900/30 hover:-translate-y-1 transition-all duration-300' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default GlassCard;