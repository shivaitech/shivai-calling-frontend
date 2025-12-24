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
  History,
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
    { path: "/agents", icon: Bot, label: "AI Employees" },
    { path: "/training", icon: Brain, label: "Training" },
    { path: "/workflows", icon: Workflow, label: "Workflows" },
    { path: "/analytics", icon: History, label: "Analytics & Call History" },
    { path: "/monitoring", icon: BarChart3, label: "Monitoring & Reports" },
    { path: "/billing", icon: CreditCard, label: "Billing" },
  ];

  return (
    <motion.div
      initial={false}
      animate={{
        width: isCollapsed ? 64 : 288, // 16rem = 256px + padding
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1], // cubic-bezier for smooth easing
      }}
      className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-40 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 flex flex-col overflow-hidden`}
    >
      {/* Header Section */}
      <div
        className={`border-b border-slate-200 dark:border-slate-700 ${
          isCollapsed ? "p-6 flex items-center" : "p-6"
        }`}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
        >
          <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>

        {/* Collapse toggle button - Desktop only */}
        <motion.button
          onClick={toggleCollapse}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`hidden lg:flex absolute top-4 ${
            isCollapsed ? "right-4" : "right-4"
          } p-2 transition-all common-bg-icons cursor-pointer rounded-lg`}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </motion.div>
        </motion.button>

        {/* Logo Section */}
        <div
          className={`mb-4 flex flex-col ${
            isCollapsed ? "items-start" : "items-start"
          }`}
        >
          <motion.div
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
              } else {
                window.location.href = "/";
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer  flex flex-col items-start"
          >
            <motion.img
              src={Logo}
              alt="ShivAi Logo"
              animate={{
                opacity: isCollapsed ? 0 : 1,
                height: isCollapsed ? 0 : 32,
              }}
              transition={{ duration: 0.3 }}
              className={`w-auto dark:invert ${
                isCollapsed ? "hidden" : "block"
              }`}
            />
            <motion.p
              animate={{
                opacity: isCollapsed ? 0 : 1,
                height: isCollapsed ? 0 : "auto",
              }}
              transition={{ duration: 0.2 }}
              className="text-xs text-slate-500 dark:text-slate-400 mt-2 overflow-hidden"
            >
              {!isCollapsed && "Client Dashboard"}
            </motion.p>
          </motion.div>
        </div>

        {/* Search Bar - Hidden when collapsed */}
        <motion.div
          animate={{
            opacity: isCollapsed ? 0 : 1,
            height: isCollapsed ? 0 : "auto",
          }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden"
        >
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
        </motion.div>
      </div>

      {/* Navigation Section */}
      <div
        className={`flex-1 ${
          isCollapsed ? "px-2 py-4" : "p-6"
        } overflow-y-auto no-scrollbar`}
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
                  isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"
                } rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? "font-medium common-bg-icons"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <motion.span
                animate={{
                  opacity: isCollapsed ? 0 : 1,
                  width: isCollapsed ? 0 : "auto",
                }}
                transition={{ duration: 0.2 }}
                className="text-sm whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            </NavLink>
          ))}
        </nav>

        {/* Additional Settings */}
        <div
          className={`${
            isCollapsed ? "mt-4 pt-4" : "mt-6 pt-6"
          } border-t border-slate-200 dark:border-slate-700`}
        >
          <NavLink
            to="/settings"
            onClick={() => onClose()}
            title={isCollapsed ? "Settings" : undefined}
            className={({ isActive }) =>
              `flex items-center ${
                isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"
              } rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
              }`
            }
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <motion.span
              animate={{
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? 0 : "auto",
              }}
              transition={{ duration: 0.2 }}
              className="text-sm whitespace-nowrap overflow-hidden"
            >
              Settings
            </motion.span>
          </NavLink>
        </div>
      </div>

      {/* User Profile Section */}
      <div
        className={`${
          isCollapsed ? "p-3" : "p-6"
        } border-t border-slate-200 dark:border-slate-700`}
      >
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <div className="border p-2 rounded-lg  flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white  ">
            <User className="w-5 h-5 text-gray-500" />
          </div>
          <motion.div
            animate={{
              opacity: isCollapsed ? 0 : 1,
              width: isCollapsed ? 0 : "auto",
            }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-w-0 overflow-hidden"
          >
            {!isCollapsed && (
              <>
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user?.fullName || "Admin User"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || "atharkatheri@gmail.com"}
                </p>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
