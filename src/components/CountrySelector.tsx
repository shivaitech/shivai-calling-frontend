import USFlag from "./icons/USFlag";
import ChevronDown from "./icons/ChevronDown";

interface CountrySelectorProps {
  className?: string;
}

export default function CountrySelector({ className = "" }: CountrySelectorProps) {
  return (
    <button
      type="button"
      className={`flex items-center justify-center w-[40px] sm:w-[48px] md:w-[56px] lg:w-24 h-[32px] sm:h-[40px] md:h-[48px] lg:h-14 bg-white rounded-full border border-black flex-shrink-0 hover:bg-gray-50 transition-colors ${className}`}
      aria-label="Select country code"
    >
      <div className="flex items-center gap-1">
        <USFlag />
        <ChevronDown className="hidden sm:block w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-gray-400" />
      </div>
    </button>
  );
}