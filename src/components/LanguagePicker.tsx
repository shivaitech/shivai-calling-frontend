import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface LanguagePickerProps {
  value: string;
  onChange: (language: string) => void;
  className?: string;
}

const LanguagePicker: React.FC<LanguagePickerProps> = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const languageGroups = {
    'India': [
      'Hindi', 'Punjabi', 'Tamil', 'Telugu', 'Bengali', 
      'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Odia', 'Urdu'
    ],
    'Middle East': ['Arabic', 'Persian', 'Hebrew', 'Turkish'],
    'Europe': ['English (UK)', 'French', 'German', 'Spanish', 'Italian', 'Dutch'],
    'Americas': ['English (US)', 'Spanish (MX)', 'Portuguese (BR)', 'French (CA)'],
    'APAC': ['Chinese (Mandarin)', 'Japanese', 'Korean', 'Thai', 'Vietnamese']
  };

  const filteredGroups = Object.entries(languageGroups).reduce((acc, [group, languages]) => {
    const filtered = languages.filter(lang => 
      lang.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[group] = filtered;
    }
    return acc;
  }, {} as Record<string, string[]>);

  const updateDropdownPosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 300;
      
      const position = spaceBelow < dropdownHeight && rect.top > dropdownHeight ? 'top' : 'bottom';
      setDropdownPosition(position);
      
      setDropdownStyle({
        left: rect.left,
        width: rect.width,
        top: position === 'top' ? rect.top - dropdownHeight : rect.bottom + 4
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, updateDropdownPosition]);

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

  const handleSelect = (language: string) => {
    onChange(language);
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
        <span className={value ? '' : 'text-slate-500 dark:text-slate-400'}>
          {value || 'Select Language'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="fixed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-80 overflow-y-auto z-[999999]"
          style={dropdownStyle}
        >
          {/* Search */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search languages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Language Groups */}
          <div className="max-h-64 overflow-y-auto">
            {Object.entries(filteredGroups).map(([group, languages]) => (
              <div key={group}>
                <div className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                  {group}
                </div>
                <div className="p-1">
                  {languages.map((language) => (
                    <button
                      key={language}
                      onClick={() => handleSelect(language)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                        value === language
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            {Object.keys(filteredGroups).length === 0 && (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                No languages found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguagePicker;