import React from "react";
import { Plus } from "lucide-react";

interface AgentListHeaderProps {
  totalAgents: number;
  publishedAgents: number;
  trainingAgents: number;
  isDeveloper: boolean;
  onCreateClick: () => void;
}

const AgentListHeader: React.FC<AgentListHeaderProps> = ({
  totalAgents,
  publishedAgents,
  trainingAgents,
  isDeveloper,
  onCreateClick,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4 flex-1">
        <div className="bg-white/50 flex items-center justify-center gap-2 dark:bg-slate-800/50 rounded-xl px-4 lg:px-6 py-2.5 lg:py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
          <p className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white">
            {totalAgents}
          </p>
          <p className="text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-400">
            Total Agents
          </p>
        </div>
        <div className="bg-white/50 flex items-center justify-center gap-2 dark:bg-slate-800/50 rounded-xl px-4 lg:px-6 py-2.5 lg:py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
          <p className="text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">
            {publishedAgents}
          </p>
          <p className="text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-400">
            Published
          </p>
        </div>
        <div className="bg-white/50 flex items-center justify-center gap-2 dark:bg-slate-800/50 rounded-xl px-4 lg:px-6 py-2.5 lg:py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
          <p className="text-xl lg:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {trainingAgents}
          </p>
          <p className="text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-400">
            Training
          </p>
        </div>
      </div>

      {/* Create Button */}
      <button
        onClick={() => isDeveloper && onCreateClick()}
        disabled={!isDeveloper}
        className={`flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl transition-all duration-200 shadow-sm whitespace-nowrap ${
          isDeveloper
            ? "common-button-bg transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50"
        }`}
      >
        <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
        <span className="text-sm lg:text-base font-medium">
          Create AI Employee
        </span>
      </button>
    </div>
  );
};

export default AgentListHeader;
