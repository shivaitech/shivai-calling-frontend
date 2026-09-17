import { Eye, X } from 'lucide-react';
import { useTenantView } from '../permissions/TenantViewContext';

/**
 * Persistent bar shown across the whole authed shell while a Main Business
 * admin is in "Enter Tenant View" observer mode (spec §8.1). Deliberately
 * NOT dismissible except via the explicit Exit action, so it's always clear
 * whose data is currently being viewed.
 */
const TenantViewBanner = () => {
  const { tenant, isViewing, exitView } = useTenantView();
  if (!isViewing || !tenant) return null;

  return (
    <div className="sticky top-0 z-[60] bg-violet-600 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm shadow-md">
      <Eye className="w-4 h-4 flex-shrink-0" />
      <span className="font-medium">
        You are viewing <span className="font-bold">{tenant.name}</span>'s panel as an observer.
      </span>
      <button
        type="button"
        onClick={exitView}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 transition-colors font-semibold"
      >
        <X className="w-3.5 h-3.5" /> Exit
      </button>
    </div>
  );
};

export default TenantViewBanner;
