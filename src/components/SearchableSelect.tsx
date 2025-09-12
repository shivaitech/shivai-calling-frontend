import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  group?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  groupBy?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className = '',
  groupBy = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedOptions = groupBy
    ? filteredOptions.reduce((acc, option) => {
        const group = option.group || 'Other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(option);
        return acc;
      }, {} as Record<string, Option[]>)
    : { '': filteredOptions };

  const selectedOption = options.find(opt => opt.value === value);

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

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
      >
        <span className={selectedOption ? '' : 'text-slate-500 dark:text-slate-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className={`absolute left-0 right-0 ${
            dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
          } bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-80 overflow-hidden z-[999999]`}
        >
          {/* Search */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            {Object.entries(groupedOptions).map(([group, groupOptions]) => (
              <div key={group}>
                {groupBy && group && (
                  <div className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                    {group}
                  </div>
                )}
                {groupOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between text-sm ${
                      value === option.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{option.label}</span>
                    {value === option.value && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            ))}
            
            {filteredOptions.length === 0 && (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                No options found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;