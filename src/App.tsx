import { useState, useEffect, useRef, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AgentProvider } from "./contexts/AgentContext";
import ScrollToTop from "./components/ScrollToTop";
import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import GoogleCallback from "./components/GoogleCallback";

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
const Sidebar = lazy(() => import("./components/Sidebar"));
const TopBar = lazy(() => import("./components/TopBar"));
const Overview = lazy(() => import("./ClientDashboard/Dashboard/Overview"));
const AgentManagement = lazy(() => import("./ClientDashboard/Employees/AgentManagement"));
const CreateAgent = lazy(() => import("./ClientDashboard/Employees/CreateAgent"));
const EditAgent = lazy(() => import("./ClientDashboard/Employees/EditAgent"));
const Training = lazy(() => import("./ClientDashboard/Training/Training"));
const Workflows = lazy(() => import("./ClientDashboard/Workflows/Workflows"));
const WebsiteBuilder = lazy(() => import("./ClientDashboard/WebsiteBuilder/WebsiteBuilder"));
const WebsitePreview = lazy(() => import("./pages/WebsitePreview"));
const Analytics = lazy(() => import("./ClientDashboard/Analytics/Analytics"));
const Monitoring = lazy(() => import("./ClientDashboard/Monitoring/Monitoring"));
const Billing = lazy(() => import("./ClientDashboard/Billing/Billing"));
const Settings = lazy(() => import("./ClientDashboard/Settings/Settings"));
const ResetPassword = lazy(() => import("./components/ResetPassword"));
const AgentPublicPage = lazy(() => import("./pages/AgentPublicPage"));

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
  const isWebsitePreview = location.pathname.startsWith("/website-preview");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      {isLandingPage || isAuthCallback || isResetPassword || isAgentPublicPage || isWebsitePreview ? (
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

            {/* Website preview - no auth required, opens in new tab */}
            <Route path="/website-preview" element={<WebsitePreview />} />

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
            <div className="bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 transition-colors duration-300 min-h-screen">
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
                      <Route path="/dashboard" element={<Overview />} />
                      <Route
                        path="/agents"
                        element={<AgentManagement key="list" />}
                      />
                      <Route
                        path="/agents/create"
                        element={<CreateAgent />}
                      />
                      <Route path="/agents/:id" element={<AgentManagement />} />
                      <Route
                        path="/agents/:id/edit"
                        element={<EditAgent />}
                      />
                      <Route path="/agents/:id/train" element={<Training />} />
                      <Route path="/training" element={<Training />} />
                      <Route path="/workflows" element={<Workflows />} />
                      <Route path="/websites" element={<WebsiteBuilder />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/monitoring" element={<Monitoring />} />
                      <Route path="/billing" element={<Billing />} />
                      <Route path="/settings" element={<Settings />} />

                      {/* Default route for authenticated users */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />

                      {/* Redirect routes to home */}
                      <Route
                        path="/ai-employee"
                        element={<Navigate to="/dashboard" replace />}
                      />
                      <Route
                        path="/pricing"
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
    <AuthProvider>
      {" "}
      {/* Wrap with AuthProvider */}
      <ThemeProvider>
        <Router>
          <AgentProvider>
            <ScrollToTop />
            <AppContent />
            <Toaster
              position="top-right"
              toastOptions={{ duration: 4000 }}
              containerStyle={{ zIndex: 99999 }}
            />
          </AgentProvider>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
