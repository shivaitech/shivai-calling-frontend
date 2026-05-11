import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  Globe,
  ChevronDown,
  Grid,
  FileText,
  Link2,
  Key,
  Phone,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  children?: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, setCollapsed }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const expandItem = (path: string) => {
    setExpandedItems(prev => ({ ...prev, [path]: true }));
  };

  // Auto-expand parent when navigating to a child route
  useEffect(() => {
    if (location.pathname === '/workflows') {
      expandItem('/workflows');
    }
    if (location.pathname === '/settings') {
      expandItem('/settings');
    }
  }, [location.pathname]);

  // Returns true when the hash link is the currently active child
  const isHashActive = (path: string) => {
    const idx = path.indexOf('#');
    if (idx === -1) return false;
    return (
      location.pathname === path.slice(0, idx) &&
      location.hash === '#' + path.slice(idx + 1)
    );
  };

  useEffect(() => {
    setCollapsed(isCollapsed);
  }, [isCollapsed, setCollapsed]);

  const navItems: NavItem[] = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/agents", icon: Bot, label: "AI Employees" },
    { path: "/training", icon: Brain, label: "Training" },
    {
      path: "/workflows",
      icon: Workflow,
      label: "Workflows",
      children: [
        { path: "/workflows#canvas", icon: Grid, label: "Canvas Builder" },
        { path: "/workflows#workflows", icon: Workflow, label: "My Workflows" },
        { path: "/workflows#documents", icon: FileText, label: "AI Docs" },
        { path: "/workflows#callsetup", icon: Phone, label: "Call Setup" },
      ],
    },
    { path: "/websites", icon: Globe, label: "Website Builder" },
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
            <div key={item.path}>
              {/* Parent Item */}
              <div className="flex items-center">
                <NavLink
                  to={item.path}
                  onClick={() => {
                    if (item.children) {
                      // Navigate + always open the dropdown
                      expandItem(item.path);
                    } else {
                      onClose();
                    }
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex-1 flex items-center ${
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
                {/* Expand/Collapse Toggle — chevron only */}
                {item.children && !isCollapsed && (
                  <button
                    onClick={() => toggleExpanded(item.path)}
                    className="px-2 py-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expandedItems[item.path] ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>

              {/* Child Items */}
              {item.children && expandedItems[item.path] && !isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1 mt-1 ml-2 border-l border-slate-200 dark:border-slate-700 pl-3"
                >
                  {item.children.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      onClick={() => onClose()}
                      className={() =>
                        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          isHashActive(child.path)
                            ? "font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                        }`
                      }
                    >
                      <child.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="whitespace-nowrap overflow-hidden">{child.label}</span>
                    </NavLink>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </nav>

        {/* Additional Settings */}
        <div
          className={`${
            isCollapsed ? "mt-4 pt-4" : "mt-6 pt-6"
          } border-t border-slate-200 dark:border-slate-700`}
        >
          <div className="flex items-center">
            <NavLink
              to="/settings"
              onClick={() => expandItem('/settings')}
              title={isCollapsed ? "Settings" : undefined}
              className={({ isActive }) =>
                `flex-1 flex items-center ${
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
            {!isCollapsed && (
              <button
                onClick={() => toggleExpanded('/settings')}
                className="px-2 py-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    expandedItems['/settings'] ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>

          {/* Settings Submenu */}
          {expandedItems['/settings'] && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-1 mt-1 ml-2 border-l border-slate-200 dark:border-slate-700 pl-3"
            >
              {[
                { path: "/settings#profile",  icon: User,  label: "Profile"            },
                { path: "/settings#security", icon: Globe, label: "Security"            },
                { path: "/settings#accounts", icon: Link2, label: "Connected Accounts"  },
                { path: "/settings#api",      icon: Key,   label: "API Keys"            },
              ].map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  onClick={() => onClose()}
                  className={() =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      isHashActive(child.path)
                        ? "font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                    }`
                  }
                >
                  <child.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap overflow-hidden">{child.label}</span>
                </NavLink>
              ))}
            </motion.div>
          )}
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
