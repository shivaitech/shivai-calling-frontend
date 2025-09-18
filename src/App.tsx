import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext"; // Add AuthProvider
import { ThemeProvider } from "./contexts/ThemeContext";
import { AgentProvider } from "./contexts/AgentContext";

import Landing from "./pages/Landing";
import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import GoogleCallback from "./components/GoogleCallback";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Overview from "./pages/Overview";
import AgentManagement from "./pages/AgentManagement";
import Training from "./pages/Training";
import Workflows from "./pages/Workflows";
import Monitoring from "./pages/Monitoring";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import ResetPassword from "./components/ResetPassword";

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isLandingPage =
    location.pathname === "/landing" || location.pathname === "/";
  const isAuthCallback = location.pathname === "/auth/google/callback";
  const isResetPassword = location.pathname.startsWith("/reset-password");

  return (
    <div className="min-h-screen">
      {isLandingPage || isAuthCallback || isResetPassword ? (
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
        </Routes>
      ) : (
        <ProtectedRoute>
          <div className="bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 transition-colors duration-300 min-h-screen">
            <div className="flex">
              <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
              <div className="flex-1 min-w-0 lg:pl-64">
                <TopBar onMenuClick={() => setSidebarOpen(true)} />
                <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pt-20 sm:pt-24 min-w-0 max-w-full overflow-hidden">
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
        <AgentProvider>
          <Router>
            <AppContent />
          </Router>
        </AgentProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
