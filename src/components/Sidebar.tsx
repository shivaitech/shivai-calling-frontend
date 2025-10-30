import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../resources/images/ShivaiLogo.svg';
import { 
  Home, 
  Sparkles, 
  Brain, 
  Workflow, 
  BarChart3, 
  CreditCard, 
  Settings,
  Bot,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Overview' },
    { path: '/agents', icon: Bot, label: 'Agent Management', highlighted: true },
    { path: '/training', icon: Brain, label: 'Training' },
    { path: '/workflows', icon: Workflow, label: 'Workflows' },
    { path: '/monitoring', icon: BarChart3, label: 'Monitoring & Analytics' },
    { path: '/billing', icon: CreditCard, label: 'Billing' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className={`fixed left-0 top-0 h-full w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/70 dark:border-slate-700/70 z-40 transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0`}>
      <div className="p-6">
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>

        <motion.div
          onClick={() => {
            window.location.href = "/";
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-start mb-8 cursor-pointer"
        >
          <img
            src={Logo}
            alt="ShivAi Logo"
            className="h-6 w-auto lg:h-8 xl:h-10 mb-2"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">Client Dashboard</p>
        </motion.div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/10'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                } ${
                  item.highlighted
                    ? 'ring-2 ring-yellow-400/20 bg-gradient-to-r from-yellow-400/5 to-orange-400/5'
                    : ''
                }`
              }
            >
              <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                item.highlighted ? 'text-yellow-500' : ''
              }`} />
              <span className="font-medium text-sm sm:text-base">{item.label}</span>
              {item.highlighted && (
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;