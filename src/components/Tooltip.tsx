import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top',
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-800 dark:border-t-slate-200',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-800 dark:border-b-slate-200',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-800 dark:border-l-slate-200',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-800 dark:border-r-slate-200'
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div className={`absolute z-[999999] ${positionClasses[position]} pointer-events-none`}>
          <div className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-sm px-4 py-3 rounded-lg shadow-2xl max-w-sm whitespace-normal leading-relaxed border border-slate-700 dark:border-slate-300">
            {content}
            <div className={`absolute w-0 h-0 border-[6px] ${arrowClasses[position]}`}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;