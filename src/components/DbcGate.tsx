import { Navigate, useLocation } from "react-router-dom";
import DbcLockedPage from "./DbcLockedPage";
import DbcPlatformHome from "./DbcPlatformHome";
import { DBC_HOME, dbcModuleName, useDbcAccess } from "../permissions/dbcAccess";

/**
 * Wraps the dashboard's routes. Digital Business Card accounts (userBase "DBC") land in the
 * card app, get a tour of ShivAI as their dashboard, and see a lock screen on modules they
 * can't use.
 * Everyone else passes straight through.
 */
export default function DbcGate({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { isDbc, ready, lockFor } = useDbcAccess();
  if (!isDbc) return <>{children}</>;
  if (pathname === "/") return <Navigate to={DBC_HOME} replace />;
  // Their "Main Dashboard": a tour of ShivAI's modules, locked ones marked.
  if (pathname === "/dashboard") return <DbcPlatformHome />;
  const lock = lockFor(pathname);
  if (!lock) return <>{children}</>;
  // Signature / Prestige open AI Employees and Analytics: wait for the plan before deciding.
  if (lock === "upgrade" && !ready) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-400 border-t-transparent" />
      </div>
    );
  }
  return <DbcLockedPage lock={lock} moduleName={dbcModuleName(pathname)} />;
}
