import React from "react";
import { Zap, FileText, BarChart3 } from "lucide-react";
import GlassCard from "../../../components/GlassCard";

interface AgentQuickActionsProps {
  agentId: string;
  onTrainClick: () => void;
}

const AgentQuickActions: React.FC<AgentQuickActionsProps> = ({
  agentId,
  onTrainClick,
}) => {
  return (
    <GlassCard>
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
            Quick Actions
          </h3>
        </div>

        <div className="space-y-3">
          <button
            onClick={onTrainClick}
            className="w-full common-bg-icons hover:shadow-md transition-all duration-200 p-4 rounded-xl touch-manipulation group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-800 dark:text-white text-sm">
                  Train Agent
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Improve responses with new data
                </p>
              </div>
            </div>
          </button>

          <button className="w-full common-bg-icons hover:shadow-md transition-all duration-200 p-4 rounded-xl touch-manipulation group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-800 dark:text-white text-sm">
                  View Logs
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Check conversation history
                </p>
              </div>
            </div>
          </button>

          <button className="w-full common-bg-icons hover:shadow-md transition-all duration-200 p-4 rounded-xl touch-manipulation group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-800 dark:text-white text-sm">
                  Analytics
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  View detailed performance
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

export default AgentQuickActions;
