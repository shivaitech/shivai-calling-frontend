import React from "react";
import { ArrowLeft, Bot, Save } from "lucide-react";
import GlassCard from "../GlassCard";

interface AgentFormHeaderProps {
  agentName: string;
  isCreate: boolean;
  onBack: () => void;
  onSave: () => void;
}

const AgentFormHeader: React.FC<AgentFormHeaderProps> = ({
  agentName,
  isCreate,
  onBack,
  onSave,
}) => {
  return (
    <GlassCard>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Main agent info section */}
          <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={onBack}
              className="common-button-bg2 p-2 sm:p-2.5 rounded-xl flex-shrink-0 touch-manipulation"
            >
              <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-300" />
            </button>

            <div className="flex items-start gap-3 sm:gap-4 lg:gap-4 min-w-0 flex-1">
              {/* Agent avatar/icon */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 common-bg-icons flex items-center justify-center flex-shrink-0 rounded-xl">
                <Bot className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-black dark:text-white" />
              </div>

              {/* Agent details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white mb-1 truncate">
                      {agentName || (isCreate ? "New AI Employee" : "Edit Agent")}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {isCreate
                        ? "Configure your AI agent's settings and personality"
                        : "Update your agent's configuration"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons - Mobile stacked */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={onBack}
              className="flex-1 sm:flex-none common-button-bg2 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px]"
            >
              <span className="text-xs sm:text-sm font-medium">Cancel</span>
            </button>

            <button
              onClick={onSave}
              className="flex-1 sm:flex-none common-button-bg flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px]"
            >
              <Save className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">
                {isCreate ? "Create" : "Save"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default AgentFormHeader;
