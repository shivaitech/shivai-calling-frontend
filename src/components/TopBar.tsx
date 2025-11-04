import React, { useState } from "react";
import { Bell, ChevronDown, Moon, Sun, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

interface TopBarProps {
  onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth(); // Get user and logout from context
  const location = useLocation();
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Function to get current module name based on route
  const getCurrentModule = () => {
    const path = location.pathname;
    
    if (path === "/dashboard") return "Dashboard";
    if (path.includes("/agents")) {
      if (path.includes("/create")) return "Create Employee";
      if (path.includes("/edit")) return "Edit Employee";
      if (path.includes("/train")) return "Employee Training";
      if (path.match(/\/agents\/[^/]+$/)) return "Employee Details";
      return "AI Employees";
    }
    if (path === "/training") return "Training Center";
    if (path === "/workflows") return "Workflows";
    if (path === "/monitoring") return "Monitoring";
    if (path === "/billing") return "Billing";
    if (path === "/settings") return "Settings";
    
    return "Dashboard"; // Default fallback
  };

  const handleLogout = async () => {
    try {
      await logout(); // Use context logout method
      window.location.href = "/landing";
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/landing"; // Force redirect even if logout fails
    }
  };

  // Extract user details with fallbacks
  const userName = user?.fullName || "User";
  const userEmail = user?.email || "user@example.com";
  const userInitials = userName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="absolute w-full  top-0 right-0 pl-0 lg:pl-5 h-12 lg:h-20 py-2 lg:py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 z-30">
      <div className="flex items-center justify-between h-full px-3 sm:px-4 lg:px-6">
        {/* Left side - Mobile and Desktop */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onMenuClick}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>

          {/* Mobile Module Display */}
          <div className="block sm:hidden">
            <h1 className="text-base font-bold text-slate-800 dark:text-white truncate max-w-[200px]">
              {getCurrentModule()}
            </h1>
          </div>

          {/* Desktop Module Display */}
          <div className="relative hidden sm:block pl-2">
            <div className="mb-4 lg:mb-0 px-1">
              <h1 className="text-sm lg:text-2xl font-bold text-slate-800 dark:text-white break-words max-w-full">
                {getCurrentModule()}
              </h1>
              <p className="hidden lg:block text-sm lg:text-sm text-slate-600 dark:text-slate-400 break-words max-w-full">
                {(() => {
                  const path = location.pathname;
                  if (path === "/dashboard") return "Here's what's happening with your AI Employees and Customers.";
                  if (path.includes("/agents")) {
                    if (path.includes("/create")) return "Configure and customize your new AI agent.";
                    if (path.includes("/edit")) return "Modify your AI agent's settings and capabilities.";
                    if (path.includes("/train")) return "Enhance your AI agent's knowledge and responses.";
                    if (path.match(/\/agents\/[^/]+$/)) return "View detailed information about your AI agent.";
                    return "Manage and monitor all your AI agents.";
                  }
                  if (path === "/training") return "Upload documents and train your AI agents.";
                  if (path === "/workflows") return "Design and automate your business processes.";
                  if (path === "/monitoring") return "Track performance and analyze AI agent metrics.";
                  if (path === "/billing") return "Manage your subscription and usage costs.";
                  if (path === "/settings") return "Configure your account and system preferences.";
                  
                  return "Here's what's happening with your AI Employees and Customers.";
                })()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
          >
            {isDark ? (
              <Sun className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-500" />
            ) : (
              <Moon className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600" />
            )}
          </button>

          <button className="relative p-1.5 sm:p-2 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors">
            <Bell className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-300" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </button>

          {/* Updated Profile Section with Real User Data */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
            >
              {/* User Avatar with dynamic initials or profile picture */}
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={userName}
                  className="w-6 sm:w-8 h-6 sm:h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs sm:text-sm font-semibold">
                    {userInitials}
                  </span>
                </div>
              )}

              {/* User Info with real data */}
              <div className="text-left hidden sm:block"></div>
              <ChevronDown
                className={`w-3 sm:w-4 h-3 sm:h-4 text-slate-400 hidden sm:block transition-transform ${
                  profileDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileDropdownOpen && (
              <div className="absolute top-full mt-1 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-[99999] overflow-hidden min-w-[200px]">
                {/* Updated profile info with real data */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                  <p className="font-medium text-slate-800 dark:text-white">
                    {userName}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {userEmail}
                  </p>
                  {user?.emailVerified && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      ✓ Verified Account
                    </p>
                  )}
                </div>
                <div className="p-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      // Add profile settings logic here
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm text-slate-700 dark:text-slate-300"
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm text-red-600 dark:text-red-400"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside handlers remain the same */}
      {profileDropdownOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setProfileDropdownOpen(false)}
        />
      )}
      {tenantDropdownOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setTenantDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default TopBar;
