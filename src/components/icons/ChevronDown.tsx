interface ChevronDownProps {
  className?: string;
}

export default function ChevronDown({ className = "w-6 h-6 text-gray-400" }: ChevronDownProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 36 36" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Dropdown arrow"
    >
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M18.3009 22.735L26.6791 14.359L25.1422 12.8198L18.3009 19.6611L11.4617 12.8198L9.92261 14.359L18.3009 22.735Z" 
        fill="currentColor"
      />
    </svg>
  );
}