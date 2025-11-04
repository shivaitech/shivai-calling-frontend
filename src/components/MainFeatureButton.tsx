import React from 'react';

interface MainFeatureButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  fullText: string;
  shortText: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
}

const MainFeatureButton: React.FC<MainFeatureButtonProps> = ({ 
  onClick,
  className = '',
  disabled = false,
  fullText,
  shortText,
  variant = 'primary'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-blue-500 to-cyan-400';
      case 'secondary':
        return 'bg-gradient-to-r from-purple-500 to-pink-400';
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-400';
      case 'warning':
        return 'bg-gradient-to-r from-orange-500 to-yellow-400';
      default:
        return 'bg-gradient-to-r from-blue-500 to-cyan-400';
    }
  };

  return (
    <button 
      className={`${getVariantClasses()} text-white px-3 py-2 sm:px-6 sm:py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      onClick={onClick}
      disabled={disabled}
      tabIndex={0}
      style={{ transform: 'none' }}
    >
      <span className="hidden sm:inline">{fullText}</span>
      <span className="sm:hidden">{shortText}</span>
    </button>
  );
};

export default MainFeatureButton;