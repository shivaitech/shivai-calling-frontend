import React, { Suspense, lazy, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Sparkles } from "lucide-react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import {
  getAppById,
  DEFAULT_WORKSPACE_SECTION,
  WorkspaceSection,
  getVisibleApps,
} from "../marketplace/apps";
import { useInstalledApps } from "../marketplace/useInstalledApps";
import { useAuth } from "../contexts/AuthContext";

// Lazily load each app's main surface. Add a case here when an app goes live.
const appComponents: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  "website-builder": lazy(
    () => import("../ClientDashboard/WebsiteBuilder/WebsiteBuilder")
  ),
  "google-sheets": lazy(
    () => import("../ClientDashboard/GoogleSheets/GoogleSheetsManager")
  ),
  "support-crm": lazy(
    () => import("../ClientDashboard/apps/SupportCRM/SupportCRM")
  ),
};

// Apps that render ALL their own sections (including "settings") internally.
// For these, the workspace must not substitute the generic settings placeholder.
const APPS_OWNING_SECTIONS = new Set<string>(["support-crm"]);

function Spinner() {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-[3px] border-slate-400 dark:border-slate-500 border-t-transparent animate-spin" />
    </div>
  );
}

const AppWorkspace: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInstalled } = useInstalledApps();

  // Same shell state as the main dashboard (App.tsx AppContent).
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const app = appId ? getAppById(appId) : undefined;
  const visibleApps = useMemo(() => getVisibleApps(user?.email), [user?.email]);
  const isAppVisible = app && visibleApps.some((a) => a.id === app.id);

  const sections: WorkspaceSection[] = useMemo(
    () => (app?.workspaceSections?.length ? app.workspaceSections : [DEFAULT_WORKSPACE_SECTION]),
    [app]
  );

  const activeSection = searchParams.get("section") || sections[0].key;
  const AppComponent = app ? appComponents[app.id] : undefined;

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!app) {
    return (
      <WorkspaceEmpty
        title="App not found"
        subtitle="This app doesn't exist or has been removed."
        onBack={() => navigate("/marketplace")}
      />
    );
  }
  if (!isAppVisible) {
    return (
      <WorkspaceEmpty
        title="App not available"
        subtitle="This app is not available for your account."
        onBack={() => navigate("/marketplace")}
      />
    );
  }
  if (app.status !== "live" || !AppComponent) {
    return (
      <WorkspaceEmpty
        title={`${app.name} is coming soon`}
        subtitle="This app isn't available to open yet."
        onBack={() => navigate("/marketplace")}
      />
    );
  }
  if (!isInstalled(app.id)) {
    return (
      <WorkspaceEmpty
        title={`Install ${app.name} first`}
        subtitle="Add this app to your library to open its workspace."
        actionLabel="Go to Marketplace"
        onBack={() => navigate(`/marketplace/${app.id}`)}
      />
    );
  }

  // ── Layout: identical shell to the main dashboard (App.tsx) ────────────────
  return (
    <div className="bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 transition-colors duration-300 min-h-screen">
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          setCollapsed={setCollapsed}
          appMode={{
            appName: app.name,
            sections,
            activeSection,
            onSelectSection: (key) => {
              const next = new URLSearchParams(searchParams);
              next.set("section", key);
              setSearchParams(next, { replace: true });
            },
          }}
        />
        <div
          className={`flex-1 min-w-0 relative ${
            collapsed ? "ml-0 lg:ml-14 pl-0 lg:pl-2" : "ml-0 lg:ml-64 pl-2 lg:pl-8"
          }`}
        >
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          <main className="px-4 sm:px-6 lg:px-6 py-2 lg:py-6 pt-16 sm:pt-[70px] lg:pt-[105px] pl-2 min-w-0 max-w-full overflow-hidden">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === "settings" && !APPS_OWNING_SECTIONS.has(app.id) ? (
                <WorkspaceSettings appName={app.name} />
              ) : (
                <Suspense fallback={<Spinner />}>
                  <AppComponent section={activeSection} />
                </Suspense>
              )}
            </motion.div>
          </main>
        </div>
      </div>

      {/* Mobile overlay — same as dashboard */}
      {sidebarOpen && (
        <div className="flex">
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

// ── Per-app settings placeholder (until each app ships its own) ─────────────
const WorkspaceSettings: React.FC<{ appName: string }> = ({ appName }) => (
  <div className="max-w-2xl mx-auto">
    <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 p-8 text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center mb-4">
        <SettingsIcon className="w-6 h-6 text-slate-400" />
      </div>
      <h2 className="text-base font-semibold text-slate-800 dark:text-white">{appName} settings</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
        App-specific settings will live here. Nothing to configure yet.
      </p>
    </div>
  </div>
);

// ── Shared empty/guard state ────────────────────────────────────────────────
const WorkspaceEmpty: React.FC<{
  title: string;
  subtitle: string;
  actionLabel?: string;
  onBack: () => void;
}> = ({ title, subtitle, actionLabel = "Back to Marketplace", onBack }) => (
  <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 px-6 text-center">
    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
      <Sparkles className="w-7 h-7 text-slate-400" />
    </div>
    <div>
      <h1 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
    </div>
    <button
      onClick={onBack}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium common-button-bg"
    >
      {actionLabel}
    </button>
  </div>
);

export default AppWorkspace;
