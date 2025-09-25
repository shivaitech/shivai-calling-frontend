import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Plus } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  group?: string;
}

interface EnhancedSearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  groupBy?: boolean;
  allowCustom?: boolean;
  customLabel?: string;
}

const EnhancedSearchableSelect: React.FC<EnhancedSearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select or type option...',
  className = '',
  groupBy = false,
  allowCustom = false,
  customLabel = 'Add custom:'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add custom option if allowCustom and searchTerm doesn't exist
  const hasCustomOption = allowCustom && 
    searchTerm && 
    !options.some(opt => opt.label.toLowerCase() === searchTerm.toLowerCase());

  const allFilteredOptions = hasCustomOption 
    ? [...filteredOptions, { value: searchTerm, label: `${customLabel} "${searchTerm}"`, group: 'Custom' }]
    : filteredOptions;

  const groupedOptions = groupBy
    ? allFilteredOptions.reduce((acc, option) => {
        const group = option.group || 'Other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(option);
        return acc;
      }, {} as Record<string, Option[]>)
    : { '': allFilteredOptions };

  const selectedOption = options.find(opt => opt.value === value) || 
    (allowCustom && value ? { value, label: value } : null);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 300;
      
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && allowCustom && searchTerm && hasCustomOption) {
      handleSelect(searchTerm);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-left text-sm hover:border-gray-400 transition-colors"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className={`absolute left-0 right-0 ${
            dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
          } bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden z-50`}
        >
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={allowCustom ? "Search or type to add..." : "Search..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            {Object.entries(groupedOptions).map(([group, groupOptions]) => (
              <div key={group}>
                {groupOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-left px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-150 flex items-center justify-between text-sm border-l-2 border-transparent hover:border-emerald-500 ${
                      value === option.value ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'text-gray-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {hasCustomOption && option.value === searchTerm && (
                        <Plus className="w-4 h-4 text-emerald-600" />
                      )}
                      {option.label}
                    </span>
                    {value === option.value && (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            ))}
            
            {allFilteredOptions.length === 0 && (
              <div className="p-6 text-center text-gray-500 text-sm">
                {allowCustom ? `Press Enter to add "${searchTerm}"` : `No options found matching "${searchTerm}"`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchableSelect;