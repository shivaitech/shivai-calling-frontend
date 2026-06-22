import { useState } from 'react';
import { ChevronDown, Info, Sparkles } from 'lucide-react';

interface ColumnAutoClassifyGuideProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const ColumnAutoClassifyGuide = ({
  open: openProp,
  onOpenChange,
  className = '',
}: ColumnAutoClassifyGuideProps) => {
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
        className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        aria-expanded={open}
      >
        <Info className="w-3.5 h-3.5 flex-shrink-0" />
        <span>What is auto-classify (Cls)?</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-violet-200/80 dark:border-violet-800/50 bg-violet-50/40 dark:bg-violet-950/20 p-3 space-y-2.5">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-[11px] leading-snug">
              <p className="text-slate-700 dark:text-slate-200">
                <span className="font-semibold">Auto-classify</span> means the AI fills this
                column from the conversation — extracting or inferring the value naturally,
                not only from a fixed script.
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <span className="font-medium">Turn on</span> for Caller columns the agent should
                capture: name, phone, category, description, company, etc. Templates enable this
                automatically for AI-filled fields.
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <span className="font-medium">Leave off</span> for System, Internal, and Tracking
                columns — IDs, timestamps, assignees, and status are handled elsewhere.
              </p>
              <p className="text-slate-500 dark:text-slate-400 italic">
                Example: caller says &ldquo;my internet keeps dropping&rdquo; → Category is set
                to Technical without asking a separate category question. Used for staff routing
                when auto-assign is on.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnAutoClassifyGuide;
