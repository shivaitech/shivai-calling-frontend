import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "../resources/images/ShivaiLogo.svg";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useCanAccess } from "../permissions/usePermission";
import { useInstalledApps } from "../marketplace/useInstalledApps";
import { APPS, openAppWorkspace, getVisibleApps } from "../marketplace/apps";
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
  Sparkles,
  Package,
  Calendar,
  Zap,
  Building2,
} from "lucide-react";

// Static shortcut list — each opens its dedicated connection page directly
// (both handle the not-connected state too), same spirit as My Apps.
const CONNECTION_SHORTCUTS = [
  { path: "/zoho", icon: Zap, label: "Zoho CRM", permissionKey: "module:zoho" },
  { path: "/google-calendar", icon: Calendar, label: "Google Calendar", permissionKey: "module:google-calendar" },
] as const;

interface AppSection {
  key: string;
  label: string;
  icon: React.ElementType;
}

interface AppModeConfig {
  appName: string;
  sections: AppSection[];
  activeSection: string;
  onSelectSection: (key: string) => void;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  setCollapsed: (collapsed: boolean) => void;
  /**
   * When set, the sidebar runs in "app workspace" mode: the dashboard nav
   * (Dashboard…Billing), the My Apps group, and the Settings block are hidden,
   * and the app's own sections are shown instead. Shell (logo, search, profile)
   * stays identical.
   */
  appMode?: AppModeConfig;
}

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  children?: NavItem[];
  highlight?: boolean; // gives the item a subtle accent treatment
  /** module:* or module:*.page:* key from permissions/registry.ts — item is
   * hidden entirely (not disabled) when the current tenant lacks this grant.
   * Omit for items every tenant can always see (Dashboard, Settings). */
  permissionKey?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, setCollapsed, appMode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { installedIds } = useInstalledApps();
  const canAccess = useCanAccess();
  const { branding } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Installed marketplace apps shown under the "My Apps" group, filtered by visibility.
  const visibleApps = getVisibleApps(user?.email);
  const installedApps = visibleApps.filter(
    (a) => installedIds.includes(a.id) && a.status === "live"
  );

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

  const rawNavItems: NavItem[] = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/agents", icon: Bot, label: "AI Employees", permissionKey: "module:employees" },
    { path: "/training", icon: Brain, label: "Training", permissionKey: "module:employees.page:training" },
    {
      path: "/call-setup",
      icon: Phone,
      label: "Call Setup - In/Outbound",
      permissionKey: "module:workflows.page:call-setup",
    },
    {
      path: "/workflows",
      icon: Workflow,
      label: "Workflows",
      permissionKey: "module:workflows",
      children: [
        { path: "/workflows#canvas", icon: Grid, label: "Canvas Builder", permissionKey: "module:workflows.page:canvas" },
        { path: "/workflows#workflows", icon: Workflow, label: "My Workflows" },
        { path: "/workflows#documents", icon: FileText, label: "AI Docs", permissionKey: "module:workflows.page:documents" },
      ],
    },
    { path: "/marketplace", icon: Sparkles, label: "Feature Marketplace", highlight: true, permissionKey: "module:marketplace" },
    { path: "/analytics", icon: History, label: "Analytics & Call History", permissionKey: "module:analytics" },
    { path: "/monitoring", icon: BarChart3, label: "Monitoring & Reports", permissionKey: "module:monitoring" },
    { path: "/billing", icon: CreditCard, label: "Billing", permissionKey: "module:billing" },
    // TODO(sub-tenants backend): re-gate on tenantRole === MAIN_OWNER/MAIN_ADMIN
    // once real tenant assignment exists. Shown to everyone for now since no
    // account has a tenantRole yet — there's no backend/login flow to set one,
    // so gating it today would make the module unreachable for everyone,
    // including during review/dev. See SUB_TENANTS_MODULE_SPEC.md §2, §4.1.
    { path: "/sub-tenants", icon: Building2, label: "Sub Tenants" },
  ];

  // Hide (not disable) items the current tenant lacks — spec §4.3 point 2:
  // "modules/pages/buttons not granted simply don't render." Items with no
  // permissionKey (Dashboard, Settings, Sub Tenants) are always visible.
  const navItems: NavItem[] = rawNavItems
    .filter((item) => !item.permissionKey || canAccess(item.permissionKey))
    .map((item) =>
      item.children
        ? { ...item, children: item.children.filter((c) => !c.permissionKey || canAccess(c.permissionKey)) }
        : item
    );

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
      } lg:translate-x-0 flex flex-col overflow-hidden ${
        branding?.headingColor || branding?.textColor ? "tenant-branded" : ""
      }`}
      style={
        branding?.backgroundColor
          ? {
              backgroundColor: 'var(--tenant-bg)',
              backgroundImage: 'var(--tenant-bg-texture)',
              backgroundSize: 'var(--tenant-bg-texture-size)',
            }
          : undefined
      }
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
                navigate("/dashboard");
                onClose();
              }
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer  flex flex-col items-start"
          >
            <motion.img
              src={branding?.logoUrl || Logo}
              alt={branding?.logoUrl ? "Business logo" : "ShivAi Logo"}
              animate={{
                opacity: isCollapsed ? 0 : 1,
                height: isCollapsed ? 0 : 32,
              }}
              transition={{ duration: 0.3 }}
              className={`w-auto max-h-8 object-contain ${branding?.logoUrl ? "" : "dark:invert"} ${
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
              {!isCollapsed && (appMode ? appMode.appName : "Client Dashboard")}
            </motion.p>
          </motion.div>
          {/* Non-removable ShivAI mark (spec §6.2) — hardcoded here, not a
              themeable field: no API field, no admin toggle, no CSS override
              hook. Always shown beneath the (possibly re-branded) logo above. */}
          {!isCollapsed && branding?.logoUrl && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> Powered by ShivAI
            </p>
          )}
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
          {/* App workspace mode: show the app's own sections instead of dashboard nav */}
          {appMode ? (
            <>
              <button
                type="button"
                onClick={() => {
                  navigate("/dashboard");
                  onClose();
                }}
                title={isCollapsed ? "Main Dashboard" : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"
                } rounded-lg transition-all duration-200 group mb-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-700/80`}
              >
                <Home className="w-5 h-5 flex-shrink-0" />
                <motion.span
                  animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
                  transition={{ duration: 0.2 }}
                  className="text-sm whitespace-nowrap overflow-hidden text-left"
                >
                  Main Dashboard
                </motion.span>
              </button>
              {appMode.sections.map((s) => {
              const active = s.key === appMode.activeSection;
              return (
                <button
                  key={s.key}
                  onClick={() => {
                    appMode.onSelectSection(s.key);
                    onClose();
                  }}
                  title={isCollapsed ? s.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"
                  } rounded-lg transition-all duration-200 group ${
                    active
                      ? "font-medium common-bg-icons"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <s.icon className="w-5 h-5 flex-shrink-0" />
                  <motion.span
                    animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
                    transition={{ duration: 0.2 }}
                    className="text-sm whitespace-nowrap overflow-hidden text-left"
                  >
                    {s.label}
                  </motion.span>
                </button>
              );
            })}
            </>
          ) : (
          navItems.map((item) => (
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
                        : item.highlight
                          ? "font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-500/10 ring-1 ring-inset ring-indigo-200/70 dark:ring-indigo-500/20 hover:bg-indigo-100/70 dark:hover:bg-indigo-500/20"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                    }`
                  }
                >
                  {item.highlight && !isCollapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-indigo-500" />
                  )}
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${item.highlight ? "text-indigo-500 dark:text-indigo-400" : ""}`} />
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
                  {item.highlight && !isCollapsed && (
                    <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/20 px-1.5 py-0.5 rounded-full">New</span>
                  )}
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
          ))
          )}
        </nav>

        {/* ── My Apps (installed marketplace apps) — hidden in app workspace mode ── */}
        {!appMode && installedApps.length > 0 && (
          <div className={`${isCollapsed ? "mt-4 pt-4" : "mt-6 pt-6"} border-t border-slate-200 dark:border-slate-700`}>
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-4 mb-2">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  My Apps
                </span>
              </div>
            )}
            <nav className="space-y-1">
              {installedApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => {
                    openAppWorkspace(app.id, undefined, navigate);
                    onClose();
                  }}
                  title={isCollapsed ? app.name : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-2.5"
                  } rounded-lg transition-all duration-200 group text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white`}
                >
                  <app.icon className="w-5 h-5 flex-shrink-0" />
                  <motion.span
                    animate={{
                      opacity: isCollapsed ? 0 : 1,
                      width: isCollapsed ? 0 : "auto",
                    }}
                    transition={{ duration: 0.2 }}
                    className="text-sm whitespace-nowrap overflow-hidden flex-1 text-left"
                  >
                    {app.name}
                  </motion.span>
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* ── Connections (quick shortcuts to Settings > Accounts) — hidden in app workspace mode ── */}
        {!appMode && (
          <div className={`${isCollapsed ? "mt-4 pt-4" : "mt-6 pt-6"} border-t border-slate-200 dark:border-slate-700`}>
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-4 mb-2">
                <Link2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Connections
                </span>
              </div>
            )}
            <nav className="space-y-1">
              {CONNECTION_SHORTCUTS.filter((conn) => canAccess(conn.permissionKey)).map((conn) => (
                <NavLink
                  key={conn.label}
                  to={conn.path}
                  onClick={() => onClose()}
                  title={isCollapsed ? conn.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-2.5"
                  } rounded-lg transition-all duration-200 group text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white`}
                >
                  <conn.icon className="w-5 h-5 flex-shrink-0" />
                  <motion.span
                    animate={{
                      opacity: isCollapsed ? 0 : 1,
                      width: isCollapsed ? 0 : "auto",
                    }}
                    transition={{ duration: 0.2 }}
                    className="text-sm whitespace-nowrap overflow-hidden flex-1 text-left"
                  >
                    {conn.label}
                  </motion.span>
                </NavLink>
              ))}
              {!isCollapsed && (
                <NavLink
                  to="/settings#accounts"
                  onClick={() => {
                    expandItem('/settings');
                    onClose();
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  View more
                  <ChevronRight className="w-3 h-3" />
                </NavLink>
              )}
            </nav>
          </div>
        )}

        {/* Additional Settings — hidden in app workspace mode */}
        {!appMode && (
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
        )}
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
