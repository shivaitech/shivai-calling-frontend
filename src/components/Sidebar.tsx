import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "../resources/images/ShivaiLogo.svg";
import { useAuth } from "../contexts/AuthContext";
import {
  Home,
  Brain,
  Workflow,
  BarChart3,
  CreditCard,
  Settings,
  Bot,
  X,
  Search,
  User,
  LogOut,
  Moon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, setCollapsed }) => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  useEffect(() => {
    setCollapsed(isCollapsed);
  }, [isCollapsed, setCollapsed]);

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/agents", icon: Bot, label: "AI Employees", highlighted: true },
    { path: "/training", icon: Brain, label: "Training" },
    { path: "/workflows", icon: Workflow, label: "Workflows" },
    { path: "/monitoring", icon: BarChart3, label: "Monitoring & Analytics" },
    { path: "/billing", icon: CreditCard, label: "Billing" },
  ];

  return (
    <div
      className={`fixed left-0 top-0 h-full ${
        isCollapsed ? "w-16 lg:w-16" : "w-72 lg:w-72"
      } bg-white dark:bg-slate-900 border-r  border-slate-200 dark:border-slate-700 z-40 transform transition-all duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 flex flex-col`}
    >
      {/* Header Section */}
      <div
        className={`${
          isCollapsed ? "p-3" : "p-6"
        } border-b border-slate-200 dark:border-slate-700 transition-all duration-300`}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>

        {/* Collapse toggle button - Desktop only */}
        <div
          onClick={toggleCollapse}
          className="hidden lg:flex absolute top-4 right-4 p-2 transition-colors common-bg-icons cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          )}
        </div>

        {/* Logo Section */}
        <div
          className={`${isCollapsed ? "mb-4" : "mb-4"} flex ${
            isCollapsed ? "justify-center" : "flex-col items-start"
          }`}
        >
          <motion.div
            onClick={() => {
              isCollapsed
                ? setIsCollapsed(false)
                : (window.location.href = "/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
          >
            <img
              src={Logo}
              alt="ShivAi Logo"
              className={`${
                isCollapsed ? "h-6 opacity-0" : "h-8"
              } w-auto transition-all duration-300 dark:invert`}
            />
            {!isCollapsed && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Client Dashboard
              </p>
            )}
          </motion.div>
        </div>

        {/* Search Bar - Hidden when collapsed */}
        {!isCollapsed && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>
        )}
      </div>

      {/* Navigation Section */}
      <div
        className={`flex-1 ${
          isCollapsed ? "p-3" : "p-6"
        } overflow-y-auto transition-all duration-300 no-scrollbar`}
      >
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center ${
                  isCollapsed ? "justify-center px-3 py-3" : "gap-3 px-4 py-3"
                } rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? "font-medium common-bg-icons"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                } ${
                  item.highlighted
                    ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium"
                    : ""
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm">{item.label}</span>}
              {item.highlighted && !isCollapsed && (
                <div className="ml-auto flex-shrink-0">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                </div>
              )}
              {item.highlighted && isCollapsed && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Additional Settings */}
        <div
          className={`${
            isCollapsed ? "mt-4 pt-4" : "mt-2 pt-2"
          } border-t border-slate-200 dark:border-slate-700 transition-all duration-300`}
        >
          <NavLink
            to="/settings"
            onClick={() => onClose()}
            title={isCollapsed ? "Settings" : undefined}
            className={({ isActive }) =>
              `flex items-center ${
                isCollapsed ? "justify-center px-3 py-3" : "gap-3 px-4 py-3"
              } rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
              }`
            }
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm">Settings</span>}
          </NavLink>
        </div>
      </div>

      {/* User Profile Section */}
      <div
        className={`${
          isCollapsed ? "p-3" : "p-6"
        } border-t border-slate-200 dark:border-slate-700 transition-all duration-300`}
      >
        {isCollapsed ? (
          /* Collapsed Profile */
          <div className="flex flex-col items-center space-y-3">
             <div
                style={{
                  padding: "0",
                }}
                className="w-10 h-10 common-button-bg  rounded-full flex items-center justify-center"
              >
                <User className="w-5 h-5 text-white " />
              </div>
          </div>
        ) : (
          /* Expanded Profile */
          <>
            <div className="flex items-center gap-3 mb-4">
              <div
                style={{
                  padding: "0",
                }}
                className="w-10 h-10 common-button-bg  rounded-full flex items-center justify-center"
              >
                <User className="w-5 h-5 text-white " />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {user?.fullName || "Admin User"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || "atharkatheri@gmail.com"}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
