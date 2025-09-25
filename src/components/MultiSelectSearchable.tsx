import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Plus } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  group?: string;
}

interface MultiSelectSearchableProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  onOptionsChange?: (options: Option[]) => void;
  placeholder?: string;
  className?: string;
  groupBy?: boolean;
  allowCustom?: boolean;
  maxSelections?: number;
}

const MultiSelectSearchable: React.FC<MultiSelectSearchableProps> = ({
  options,
  value,
  onChange,
  onOptionsChange,
  placeholder = 'Select options...',
  className = '',
  groupBy = false,
  allowCustom = false,
  maxSelections
}) => {
  const [internalOptions, setInternalOptions] = useState<Option[]>(options);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');

  // Update internal options when props change and restore custom options from selected values
  useEffect(() => {
    let mergedOptions = [...options];
    
    // Check for selected values that don't exist in options (custom options)
    const missingOptions = value.filter(selectedValue => 
      !options.some(opt => opt.value === selectedValue)
    );
    
    // Add missing options as custom options at the top
    if (missingOptions.length > 0) {
      const customOptions = missingOptions.map(val => ({
        value: val,
        label: val,
        group: 'Custom'
      }));
      mergedOptions = [...customOptions, ...options];
    }
    
    setInternalOptions(mergedOptions);
  }, [options, value]);

  const filteredOptions = internalOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add custom option if allowCustom and searchTerm doesn't exist
  const hasCustomOption = allowCustom && 
    searchTerm && 
    !internalOptions.some(opt => opt.label.toLowerCase() === searchTerm.toLowerCase());

  // Sort filtered options to put Custom group items at the top
  const sortedFilteredOptions = filteredOptions.sort((a, b) => {
    const aIsCustom = a.group === 'Custom';
    const bIsCustom = b.group === 'Custom';
    
    if (aIsCustom && !bIsCustom) return -1;
    if (!aIsCustom && bIsCustom) return 1;
    return 0;
  });

  const allFilteredOptions = hasCustomOption 
    ? [{ value: searchTerm, label: searchTerm, group: 'Custom' }, ...sortedFilteredOptions]
    : sortedFilteredOptions;

  const groupedOptions = groupBy
    ? allFilteredOptions.reduce((acc, option) => {
        const group = option.group || 'Other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(option);
        return acc;
      }, {} as Record<string, Option[]>)
    : { '': allFilteredOptions };

  // Ensure Custom group appears first if it exists
  const sortedGroups = Object.keys(groupedOptions).sort((a, b) => {
    if (a === 'Custom' && b !== 'Custom') return -1;
    if (a !== 'Custom' && b === 'Custom') return 1;
    return 0;
  });

  // Create selected options including any that might not be in internalOptions yet
  const selectedOptions = value.map(selectedValue => {
    const existingOption = internalOptions.find(opt => opt.value === selectedValue);
    return existingOption || { value: selectedValue, label: selectedValue, group: 'Custom' };
  });

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

  const handleSelect = (optionValue: string, isCustom = false) => {
    if (value.includes(optionValue)) {
      // Remove if already selected
      onChange(value.filter(v => v !== optionValue));
    } else {
      // Add if not selected and within limit
      if (!maxSelections || value.length < maxSelections) {
        // If it's a custom option, add it to the options list first at the top
        if (isCustom && !internalOptions.some(opt => opt.value === optionValue)) {
          const newOption = { value: optionValue, label: optionValue, group: 'Custom' };
          // Put custom options at the beginning
          const updatedOptions = [newOption, ...internalOptions];
          setInternalOptions(updatedOptions);
          
          // Notify parent if callback provided
          if (onOptionsChange) {
            onOptionsChange(updatedOptions);
          }
        }
        
        // Auto-select the option (including custom ones)
        onChange([...value, optionValue]);
        
        // Clear search term after selection
        setSearchTerm('');
      }
    }
  };

  const handleRemove = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const canAddMore = !maxSelections || value.length < maxSelections;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        onClick={handleToggle}
        className="w-full min-h-[40px] px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent cursor-pointer bg-white hover:border-gray-400 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 flex flex-wrap gap-2">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-md"
                >
                  {option.label}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(option.value);
                    }}
                    className="hover:bg-emerald-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">{placeholder}</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

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
                placeholder="Search or type to add..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 text-sm"
              />
            </div>
            {maxSelections && (
              <p className="text-xs text-gray-500 mt-2">
                {value.length}/{maxSelections} selected
              </p>
            )}
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            {sortedGroups.map((group) => (
              <div key={group}>
                {groupedOptions[group].map((option) => {
                  const isSelected = value.includes(option.value);
                  const isDisabled = !canAddMore && !isSelected;
                  const isCustomOption = Boolean(hasCustomOption && option.value === searchTerm);
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => !isDisabled && handleSelect(option.value, isCustomOption)}
                      disabled={isDisabled}
                      className={`w-full text-left px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-150 flex items-center gap-3 text-sm border-l-2 border-transparent hover:border-emerald-500 ${
                        isSelected 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-500' 
                          : isDisabled 
                          ? 'text-gray-400 cursor-not-allowed hover:bg-white hover:text-gray-400 hover:border-transparent' 
                          : 'text-gray-700'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                        isSelected 
                          ? 'bg-emerald-600 border-emerald-600' 
                          : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      
                      <span className="flex items-center gap-2 flex-1">
                        {isCustomOption && (
                          <Plus className="w-4 h-4 text-emerald-600" />
                        )}
                        {option.label}
                      </span>
                    </button>
                  );
                })}
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

export default MultiSelectSearchable;