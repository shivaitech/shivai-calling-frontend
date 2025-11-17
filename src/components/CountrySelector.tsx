import { useState, useRef, useEffect } from "react";
import USFlag from "./icons/USFlag";
import ChevronDown from "./icons/ChevronDown";
import { Country, defaultCountries } from "../types/country";

interface CountrySelectorProps {
  className?: string;
  onCountryChange?: (country: Country) => void;
  selectedCountry?: Country;
}

export default function CountrySelector({ 
  className = "",
  onCountryChange,
  selectedCountry = defaultCountries[0]
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDialCode, setEditingDialCode] = useState(false);
  const [customDialCode, setCustomDialCode] = useState(selectedCountry.dialCode);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCountries = defaultCountries.filter(
    country =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm) ||
      country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    setCustomDialCode(selectedCountry.dialCode);
  }, [selectedCountry]);

  const handleCountrySelect = (country: Country) => {
    try {
      setCustomDialCode(country.dialCode);
      setEditingDialCode(false);
      onCountryChange?.(country);
      setIsOpen(false);
      setSearchTerm("");
    } catch (error) {
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const handleDialCodeEdit = () => {
    setEditingDialCode(true);
    setIsOpen(false);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const handleDialCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    if (!value.startsWith('+')) {
      value = '+' + value.replace(/^\+*/, '');
    }
    
    value = '+' + value.slice(1).replace(/\D/g, '');
    setCustomDialCode(value);
  };

  const handleDialCodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      setEditingDialCode(false);
      
      const matchingCountry = defaultCountries.find(c => c.dialCode === customDialCode);
      if (matchingCountry) {
        onCountryChange?.(matchingCountry);
      } else {
        const customCountry: Country = {
          code: "XX",
          name: "Custom",
          flag: "🌐",
          dialCode: customDialCode
        };
        onCountryChange?.(customCountry);
      }
    } else if (e.key === 'Escape') {
      setEditingDialCode(false);
      setCustomDialCode(selectedCountry.dialCode);
    }
  };

  const handleDialCodeBlur = () => {
    setEditingDialCode(false);
    
    const matchingCountry = defaultCountries.find(c => c.dialCode === customDialCode);
    if (matchingCountry) {
      onCountryChange?.(matchingCountry);
    } else {
      const customCountry: Country = {
        code: "XX",
        name: "Custom",
        flag: "🌐",
        dialCode: customDialCode
      };
      onCountryChange?.(customCountry);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex items-center">
        {editingDialCode ? (
          <input
            ref={inputRef}
            type="text"
            value={customDialCode}
            onChange={handleDialCodeChange}
            onKeyDown={handleDialCodeSubmit}
            onBlur={handleDialCodeBlur}
            className="w-[60px] sm:w-[70px] md:w-[80px] h-[38px] sm:h-[44px] md:h-[54px] lg:h-12 px-1 sm:px-2 text-[10px] sm:text-xs md:text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="+1"
          />
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            onDoubleClick={handleDialCodeEdit}
            className={`flex items-center justify-center gap-0.5 sm:gap-1 w-[60px] sm:w-[70px] md:w-[80px] h-[34px] md:h-[34px] lg:h-[35px] bg-white rounded-lg border border-gray-300 flex-shrink-0 hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 relative ${isOpen ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : ''}`}
            title="Click to select country, double-click to edit"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            {selectedCountry.code === "US" ? (
              <USFlag className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            ) : (
              <span className="text-[10px] sm:text-xs flex-shrink-0">{selectedCountry.flag}</span>
            )}
            <span className="text-[8px] sm:text-[10px] md:text-xs font-medium text-gray-700 truncate max-w-[24px] sm:max-w-[32px]">
              {customDialCode.replace('+', '')}
            </span>
            <ChevronDown className={`w-2 h-2 sm:w-3 sm:h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {isOpen && !editingDialCode && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-[99998] sm:hidden lg:w-auto" 
            onClick={() => setIsOpen(false)} 
            onTouchStart={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 sm:right-auto mt-2 w-[50vw]  md:w-72 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-hidden z-[99999]">
            <div className="p-2 sm:p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                    setSearchTerm("");
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    // Select first filtered country if any
                    if (filteredCountries.length > 0) {
                      handleCountrySelect(filteredCountries[0]);
                    }
                  }
                }}
                className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            <div className="max-h-48 overflow-y-auto " role="listbox">
              {filteredCountries.length > 0 ? (
                filteredCountries.slice(0, 12).map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCountrySelect(country);
                    }}
                    className={`w-full flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-left hover:bg-blue-50 active:bg-blue-100 transition-all duration-150 ${
                      selectedCountry.code === country.code ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                    role="option"
                    aria-selected={selectedCountry.code === country.code}
                  >
                    {country.code === "US" ? (
                      <USFlag className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    ) : (
                      <span className="text-sm sm:text-base flex-shrink-0">{country.flag}</span>
                    )}
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate pr-2">
                        {country.name}
                      </p>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 flex-shrink-0">
                        {country.dialCode}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-xs sm:text-sm text-gray-500">
                  No countries found
                </div>
              )}
              {filteredCountries.length > 12 && (
                <div className="px-2 sm:px-3 py-2 text-center text-xs text-gray-400 border-t border-gray-100">
                  {filteredCountries.length - 12} more results...
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                onClick={handleDialCodeEdit}
                className="w-full flex items-center gap-1.5 text-left text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1.5 rounded transition-colors"
              >
                <span className="text-sm">🌐</span>
                <span>Custom code</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
