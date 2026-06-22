import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { COLUMN_ROLE_GUIDE, roleBadgeClass } from './sheetColumnUtils';

interface ColumnRoleGuideProps {
  /** When set, visibility is controlled by the parent (e.g. Role header info icon). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const ColumnRoleGuide = ({ open: openProp, onOpenChange, className = '' }: ColumnRoleGuideProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;

  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (openProp === undefined) setInternalOpen(next);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        aria-expanded={open}
      >
        <Info className="w-3.5 h-3.5 flex-shrink-0" />
        <span>What do column roles mean?</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/50 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
            {COLUMN_ROLE_GUIDE.map((item, i) => (
              <div
                key={item.role}
                className={`p-3 ${i === COLUMN_ROLE_GUIDE.length - 1 && COLUMN_ROLE_GUIDE.length % 2 === 1 ? 'sm:col-span-2' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${roleBadgeClass(item.role)}`}
                  >
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {item.filledBy}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  {item.description}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  e.g. {item.examples}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnRoleGuide;
