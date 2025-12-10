import React from "react";
import { LucideIcon } from "lucide-react";

interface AgentStatsCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconBgColor: string;
  iconColor: string;
}

const AgentStatsCard: React.FC<AgentStatsCardProps> = ({
  icon: Icon,
  value,
  label,
  trend,
  iconBgColor,
  iconColor,
}) => {
  return (
    <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 sm:p-5 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
        </div>
        <div className="text-right">
          <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white">
            {value}
          </p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {label}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {trend ? (
          <>
            <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend.value}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-500">
              vs last month
            </span>
          </>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-500">
            No data yet
          </span>
        )}
      </div>
    </div>
  );
};

export default AgentStatsCard;
