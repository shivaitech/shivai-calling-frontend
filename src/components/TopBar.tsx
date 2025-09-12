import React, { useState } from 'react';
import { Bell, ChevronDown, Moon, Sun, Globe, Menu } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext'; // Add this import

interface TopBarProps {
  onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth(); // Get user and logout from context
  const [selectedTenant, setSelectedTenant] = useState('ShivAI Tech');
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [selectedRegion] = useState('IN');

  const tenants = ['ShivAI Tech', 'TechStart Inc', 'Global Solutions'];
  const regions = {
    IN: 'India',
    UAE: 'UAE',
    EU: 'Europe',
    US: 'United States'
  };

  const handleLogout = async () => {
    try {
      await logout(); // Use context logout method
      window.location.href = '/landing';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/landing'; // Force redirect even if logout fails
    }
  };

  // Extract user details with fallbacks
  const userName = user?.fullName || 'User';
  const userEmail = user?.email || 'user@example.com';
  const userInitials = userName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="fixed top-0 right-0 left-0 lg:left-64 h-16 sm:h-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 z-30">
      <div className="flex items-center justify-between h-full px-3 sm:px-4 lg:px-6">
        {/* Left side content remains the same */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onMenuClick}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>

          <div className="relative hidden sm:block">
            <button
              onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
              className="flex items-center justify-between bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer min-w-[120px]"
            >
              <span>{selectedTenant}</span>
              <ChevronDown className={`w-3 sm:w-4 h-3 sm:h-4 text-slate-400 ml-2 transition-transform ${tenantDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {tenantDropdownOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-[99999] overflow-hidden">
                {tenants.map(tenant => (
                  <button
                    key={tenant}
                    onClick={() => {
                      setSelectedTenant(tenant);
                      setTenantDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 sm:px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs sm:text-sm ${
                      selectedTenant === tenant ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tenant}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-green-100/50 dark:bg-green-900/20 rounded-lg">
            <Globe className="w-3 sm:w-4 h-3 sm:h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
              {regions[selectedRegion as keyof typeof regions]}
            </span>
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
              <div className="text-left hidden sm:block">
                <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  {userName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.emailVerified ? 'Verified' : 'Admin'}
                </p>
              </div>
              <ChevronDown className={`w-3 sm:w-4 h-3 sm:h-4 text-slate-400 hidden sm:block transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {profileDropdownOpen && (
              <div className="absolute top-full mt-1 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-[99999] overflow-hidden min-w-[200px]">
                {/* Updated profile info with real data */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                  <p className="font-medium text-slate-800 dark:text-white">{userName}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{userEmail}</p>
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
