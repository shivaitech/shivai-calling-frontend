import { useState, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AgentProvider } from "./contexts/AgentContext";
import ScrollToTop from "./components/ScrollToTop";
import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import GoogleCallback from "./components/GoogleCallback";
import { oceanDepthsPreset, Orb } from "react-ai-orb";

const Landing = lazy(() => import("./pages/Website/Landing"));
const Onboarding = lazy(() => import("./pages/Website/Onboarding"));
const Sidebar = lazy(() => import("./components/Sidebar"));
const TopBar = lazy(() => import("./components/TopBar"));
const Overview = lazy(() => import("./ClientDashboard/Dashboard/Overview"));
const AgentManagement = lazy(() => import("./ClientDashboard/Employees/AgentManagement"));
const Training = lazy(() => import("./ClientDashboard/Training/Training"));
const Workflows = lazy(() => import("./ClientDashboard/Workflows/Workflows"));
const Monitoring = lazy(() => import("./ClientDashboard/Monitoring/Monitoring"));
const Billing = lazy(() => import("./ClientDashboard/Billing/Billing"));
const Settings = lazy(() => import("./ClientDashboard/Settings/Settings"));
const ResetPassword = lazy(() => import("./components/ResetPassword"));

function LoadingFallback() {
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
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isLandingPage =
    location.pathname === "/landing" || location.pathname === "/";
  const isAuthCallback = location.pathname === "/auth/google/callback";
  const isResetPassword = location.pathname.startsWith("/reset-password");
  const isOnboarding =
    location.pathname === "/onboarding" || location.pathname === "/onBoarding";
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      {isLandingPage || isAuthCallback || isResetPassword || isOnboarding ? (
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
              path="/onboarding"
              element={
                <PublicRoute>
                  <Onboarding />
                </PublicRoute>
              }
            />
            <Route
              path="/onBoarding"
              element={
                <PublicRoute>
                  <Onboarding />
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
                  <main className="px-4 sm:px-6 lg:px-6 py-2 lg:py-6 pt-16 lg:pt-[105px] pl-2 min-w-0 max-w-full overflow-hidden">
                    <Routes>
                      <Route path="/dashboard" element={<Overview />} />
                      <Route
                        path="/agents"
                        element={<AgentManagement key="list" />}
                      />
                      <Route
                        path="/agents/create"
                        element={<AgentManagement />}
                      />
                      <Route path="/agents/:id" element={<AgentManagement />} />
                      <Route
                        path="/agents/:id/edit"
                        element={<AgentManagement />}
                      />
                      <Route path="/agents/:id/train" element={<Training />} />
                      <Route path="/training" element={<Training />} />
                      <Route path="/workflows" element={<Workflows />} />
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

function App() {
  return (
    <AuthProvider>
      {" "}
      {/* Wrap with AuthProvider */}
      <ThemeProvider>
        <Router>
          <AgentProvider>
            <ScrollToTop />
            <AppContent />
          </AgentProvider>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
