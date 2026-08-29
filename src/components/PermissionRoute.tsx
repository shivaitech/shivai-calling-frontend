import React from 'react';
import { Navigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { usePermission } from '../permissions/usePermission';

interface PermissionRouteProps {
  requires: string;
  children: React.ReactNode;
  /** Where to send the user if denied. Defaults to showing an inline notice
   * rather than redirecting, since this route is already inside the authed
   * dashboard shell (sidebar/topbar) and a full redirect would be jarring. */
  redirectTo?: string;
}

/**
 * Route guard so a permission denial can't be bypassed by typing the URL
 * directly, even when the sidebar already hides the nav item. See
 * SUB_TENANTS_MODULE_SPEC.md §5.3 — this is a UX safeguard, not the actual
 * security boundary (the backend must independently enforce every grant).
 */
const PermissionRoute: React.FC<PermissionRouteProps> = ({ requires, children, redirectTo }) => {
  const allowed = usePermission(requires);

  if (!allowed) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Not available</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This page isn't included in your current access. Contact your account admin if you need it.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PermissionRoute;
