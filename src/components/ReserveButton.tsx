import React from 'react';

interface ReserveButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  fullText?: string;
  shortText?: string;
}

const ReserveButton: React.FC<ReserveButtonProps> = ({ 
  onClick,
  className = '',
  disabled = false,
  fullText = 'Reserve 6 Months Free',
  shortText = 'Reserve Free'
}) => {
  return (
    <button 
      className={`bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-3 py-2 sm:px-6 sm:py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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

export default ReserveButton;