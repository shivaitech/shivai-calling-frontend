import { useState, useEffect, useRef, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AgentProvider } from "./contexts/AgentContext";
import { TenantPermissionsProvider } from "./permissions/TenantPermissionsContext";
import { TenantViewProvider } from "./permissions/TenantViewContext";
import TenantViewBanner from "./components/TenantViewBanner";
import ScrollToTop from "./components/ScrollToTop";
import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import PermissionRoute from "./components/PermissionRoute";
import HomeRedirect from "./components/HomeRedirect";
import GoogleCallback from "./components/GoogleCallback";
import { saveLastRoute } from "./utils/homeRoute";

// Lazy-load orb so it is NOT in the main bundle critical path
const OrbFallback = lazy(() =>
  import("react-ai-orb").then(({ Orb, oceanDepthsPreset }) => ({
    default: function OrbFallbackInner() {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
          <div className="scale-50">
            <Orb {...oceanDepthsPreset} />
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-xs font-small relative -top-2">
            callshivai.com
          </p>
        </div>
      );
    },
  }))
);

const Landing = lazy(() => import("./pages/Website/Landing"));
const Pricing = lazy(() => import("./pages/Website/PricingPage"));
const FAQPage = lazy(() => import("./pages/Website/FAQPage"));
const SolutionsPage = lazy(() => import("./pages/Website/SolutionsPage"));
const Sidebar = lazy(() => import("./components/Sidebar"));
const TopBar = lazy(() => import("./components/TopBar"));
const Overview = lazy(() => import("./ClientDashboard/Dashboard/Overview"));
const DashboardEntry = lazy(() => import("./components/DashboardEntry"));
const AgentManagement = lazy(() => import("./ClientDashboard/Employees/AgentManagement"));
const CreateAgent = lazy(() => import("./ClientDashboard/Employees/CreateAgent"));
const EditAgent = lazy(() => import("./ClientDashboard/Employees/EditAgent"));
const Training = lazy(() => import("./ClientDashboard/Training/Training"));
const Workflows = lazy(() => import("./ClientDashboard/Workflows/Workflows"));
const CallSetup = lazy(() => import("./ClientDashboard/Workflows/CallSetup"));
const Marketplace = lazy(() => import("./ClientDashboard/Marketplace/Marketplace"));
const AppDetail = lazy(() => import("./ClientDashboard/Marketplace/AppDetail"));
const WebsitePreview = lazy(() => import("./pages/WebsitePreview"));
const AppWorkspace = lazy(() => import("./pages/AppWorkspace"));
const CampaignDetail = lazy(() => import("./ClientDashboard/Workflows/CampaignDetail"));
const ContactCallHistory = lazy(() => import("./ClientDashboard/Workflows/ContactCallHistory"));
const Analytics = lazy(() => import("./ClientDashboard/Analytics/Analytics"));
const Monitoring = lazy(() => import("./ClientDashboard/Monitoring/Monitoring"));
const Billing = lazy(() => import("./ClientDashboard/Billing/Billing"));
const Settings = lazy(() => import("./ClientDashboard/Settings/Settings"));
const GoogleSheetsManager = lazy(() => import("./ClientDashboard/GoogleSheets/GoogleSheetsManager"));
const GoogleSheetView = lazy(() => import("./ClientDashboard/GoogleSheets/GoogleSheetView"));
const ZohoManager = lazy(() => import("./ClientDashboard/Zoho/ZohoManager"));
const GoogleCalendarManager = lazy(() => import("./ClientDashboard/Zoho/GoogleCalendarManager"));
const SubTenantsList = lazy(() => import("./ClientDashboard/SubTenants/SubTenantsList"));
const SubTenantDetail = lazy(() => import("./ClientDashboard/SubTenants/SubTenantDetail"));
const InviteAcceptPage = lazy(() => import("./pages/InviteAcceptPage"));
const ResetPassword = lazy(() => import("./components/ResetPassword"));
const AgentPublicPage = lazy(() => import("./pages/AgentPublicPage"));
const DoctorCalendarPublicPage = lazy(() => import("./pages/DoctorCalendarPublicPage"));
const DoctorCalendarPWALauncher = lazy(() => import("./pages/DoctorCalendarPWALauncher"));

function LoadingFallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <p className="text-slate-700 dark:text-slate-300 text-xs">callshivai.com</p>
      </div>
    }>
      <OrbFallback />
    </Suspense>
  );
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isLandingPage =
    location.pathname === "/landing" || location.pathname === "/";
  const isAuthCallback = location.pathname === "/auth/google/callback";
  const isResetPassword = location.pathname.startsWith("/reset-password");
  const isAgentPublicPage = location.pathname.startsWith("/MyAIEmployee");
  const isDoctorCalendarPage = location.pathname.startsWith("/doctor-calendar");
  const isWebsitePreview = location.pathname.startsWith("/website-preview");
  // Standalone app workspace — auth-protected but rendered without dashboard chrome.
  const isAppWorkspace = location.pathname.startsWith("/app/");
  // Public marketing pages — SEO-indexable, no dashboard chrome, no auth required.
  const isMarketingPage =
    location.pathname === "/pricing" ||
    location.pathname === "/faq" ||
    location.pathname === "/solutions";
  // Sub-tenant invite-accept — public, pre-auth (spec §9).
  const isInviteAcceptPage = location.pathname.startsWith("/invite/");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (
      isLandingPage ||
      isAuthCallback ||
      isResetPassword ||
      isAgentPublicPage ||
      isDoctorCalendarPage ||
      isWebsitePreview ||
      isAppWorkspace ||
      isMarketingPage ||
      isInviteAcceptPage
    ) {
      return;
    }
    saveLastRoute(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search, isLandingPage, isAuthCallback, isResetPassword, isAgentPublicPage, isDoctorCalendarPage, isWebsitePreview, isAppWorkspace, isMarketingPage, isInviteAcceptPage]);

  return (
    <div className="min-h-dvh">
      {isLandingPage || isAuthCallback || isResetPassword || isAgentPublicPage || isDoctorCalendarPage || isWebsitePreview || isAppWorkspace || isMarketingPage || isInviteAcceptPage ? (
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route
              path="/"
              element={
                <PublicRoute>
                  <Landing />
                </PublicRoute>
              }
            />
            <Route
              path="/landing"
              element={
                <PublicRoute>
                  <Landing />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />

            {/* Public agent test page - no auth required */}
            <Route path="/MyAIEmployee/:agentId" element={<AgentPublicPage />} />

            {/* Doctor personal calendar PWA — launcher + per-doctor calendar */}
            <Route path="/doctor-calendar" element={<DoctorCalendarPWALauncher />} />
            <Route path="/doctor-calendar/:staffId" element={<DoctorCalendarPublicPage />} />

            {/* Website preview - no auth required, opens in new tab */}
            <Route path="/website-preview" element={<WebsitePreview />} />

            {/* Public marketing pages — dedicated routes for SEO/AI-answer indexing */}
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/solutions" element={<SolutionsPage />} />

            {/* Sub-tenant invite-accept — public, pre-auth (spec §9) */}
            <Route path="/invite/:slug/:token" element={<InviteAcceptPage />} />

            {/* Standalone app workspace — auth required, opens in new tab, no dashboard chrome */}
            <Route
              path="/app/:appId"
              element={
                <ProtectedRoute>
                  <AppWorkspace />
                </ProtectedRoute>
              }
            />

            {/* Catch all other public routes and redirect to landing */}
            <Route path="*" element={<Navigate to="/landing" replace />} />

            {/* Redirect routes to home */}
            <Route
              path="/ai-calling-app"
              element={<Navigate to="/landing" replace />}
            />
            <Route
              path="/voice-assistant"
              element={<Navigate to="/landing" replace />}
            />
            <Route path="/about" element={<Navigate to="/landing" replace />} />
            <Route path="/contact" element={<Navigate to="/landing" replace />} />
          </Routes>
        </Suspense>
      ) : (
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <div className="bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 transition-colors duration-300 min-h-dvh">
              <TenantViewBanner />
              <div className="flex">
                <Sidebar
                  isOpen={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                  setCollapsed={setCollapsed}
                />
                <div
                  className={`flex-1 min-w-0 relative ${
                    collapsed
                      ? "ml-0 lg:ml-14 pl-0 lg:pl-2"
                      : "ml-0 lg:ml-64 pl-2 lg:pl-8"
                  }`}
                >
                  <TopBar onMenuClick={() => setSidebarOpen(true)} />
                  <main className="px-4 sm:px-6 lg:px-6 py-2 lg:py-6 pt-16 sm:pt-[70px] lg:pt-[105px] pl-2 min-w-0 max-w-full overflow-hidden">
                    <Routes>
                      <Route path="/dashboard" element={<DashboardEntry />} />
                      <Route
                        path="/agents"
                        element={<PermissionRoute requires="module:employees"><AgentManagement key="list" /></PermissionRoute>}
                      />
                      <Route
                        path="/agents/create"
                        element={<PermissionRoute requires="module:employees.page:list.action:create"><CreateAgent /></PermissionRoute>}
                      />
                      <Route path="/agents/:id" element={<PermissionRoute requires="module:employees"><AgentManagement /></PermissionRoute>} />
                      <Route
                        path="/agents/:id/edit"
                        element={<PermissionRoute requires="module:employees.page:edit-agent"><EditAgent /></PermissionRoute>}
                      />
                      <Route path="/agents/:id/train" element={<PermissionRoute requires="module:employees.page:training"><Training /></PermissionRoute>} />
                      <Route path="/training" element={<PermissionRoute requires="module:employees.page:training"><Training /></PermissionRoute>} />
                      <Route path="/call-setup" element={<PermissionRoute requires="module:workflows.page:call-setup"><CallSetup /></PermissionRoute>} />
                      <Route path="/workflows" element={<PermissionRoute requires="module:workflows"><Workflows /></PermissionRoute>} />
                      <Route path="/campaigns/:campaignId" element={<PermissionRoute requires="module:workflows.page:call-setup"><CampaignDetail /></PermissionRoute>} />
                      <Route path="/contacts/:contactId/call-history" element={<PermissionRoute requires="module:workflows.page:call-setup"><ContactCallHistory /></PermissionRoute>} />
                      <Route path="/marketplace" element={<PermissionRoute requires="module:marketplace"><Marketplace /></PermissionRoute>} />
                      <Route path="/marketplace/:appId" element={<PermissionRoute requires="module:marketplace"><AppDetail /></PermissionRoute>} />
                      {/* Website Builder now lives in its standalone workspace — redirect legacy route */}
                      <Route path="/websites" element={<Navigate to="/app/website-builder" replace />} />
                      <Route path="/analytics" element={<PermissionRoute requires="module:analytics"><Analytics /></PermissionRoute>} />
                      <Route path="/monitoring" element={<PermissionRoute requires="module:monitoring"><Monitoring /></PermissionRoute>} />
                      <Route path="/billing" element={<PermissionRoute requires="module:billing"><Billing /></PermissionRoute>} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/google-sheets" element={<GoogleSheetsManager />} />
                      <Route path="/google-sheets/:id/view" element={<GoogleSheetView />} />
                      <Route path="/zoho" element={<PermissionRoute requires="module:zoho"><ZohoManager /></PermissionRoute>} />
                      <Route path="/google-calendar" element={<PermissionRoute requires="module:google-calendar"><GoogleCalendarManager /></PermissionRoute>} />
                      <Route path="/sub-tenants" element={<SubTenantsList />} />
                      <Route path="/sub-tenants/:tenantId" element={<SubTenantDetail />} />

                      {/* Default route for authenticated users */}
                      <Route path="/" element={<HomeRedirect />} />

                      {/* Redirect routes to home */}
                      <Route
                        path="/ai-employee"
                        element={<Navigate to="/dashboard" replace />}
                      />
                      <Route
                        path="/about"
                        element={<Navigate to="/dashboard" replace />}
                      />
                      <Route
                        path="/contact"
                        element={<Navigate to="/dashboard" replace />}
                      />
                      
                      {/* Catch all other routes and redirect to dashboard */}
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
              {/* Mobile overlay */}
              {sidebarOpen && (
                <div className="flex">
                  <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                  />
                </div>
              )}
            </div>
          </Suspense>
        </ProtectedRoute>
      )}
    </div>
  );
}

// Checks /version.json only when the user returns to the tab after being away.
// Never interrupts an active session — no polling interval.
// Covers both "opened after a day" (long absence) and silent new deployments.
function useVersionCheck() {
  const initialBuildTime = useRef<number | null>(null);
  const lastActiveTime = useRef<number>(Date.now());

  useEffect(() => {
    // Fetch and compare version — reloads only if a new deploy is detected
    const checkVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data: { buildTime: number } = await res.json();
        if (initialBuildTime.current === null) {
          // Store the build time seen on first load
          initialBuildTime.current = data.buildTime;
        } else if (data.buildTime !== initialBuildTime.current) {
          // New deployment detected — reload to get fresh chunks
          window.location.reload();
        }
      } catch {
        // Network offline — ignore silently
      }
    };

    // Record the build time on first load (no reload here)
    checkVersion();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const hiddenFor = Date.now() - lastActiveTime.current;
        // Only check if the user was away for at least 5 minutes
        if (hiddenFor > 5 * 60 * 1000) {
          checkVersion();
        }
      } else {
        // Tab going hidden — record time
        lastActiveTime.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
}

function App() {
  useVersionCheck();
  return (
    <HelmetProvider>
      <AuthProvider>
        {" "}
        {/* Wrap with AuthProvider */}
        <ThemeProvider>
          <Router>
            <TenantPermissionsProvider>
              <TenantViewProvider>
                <AgentProvider>
                  <ScrollToTop />
                  <AppContent />
                  <Toaster
                    position="top-right"
                    toastOptions={{ duration: 4000 }}
                    containerStyle={{ zIndex: 2147483646 }}
                    containerClassName="!z-[2147483646]"
                  />
                </AgentProvider>
              </TenantViewProvider>
            </TenantPermissionsProvider>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
