import React from "react";
import { ArrowLeft, Bot, Edit, QrCode, Play, Pause } from "lucide-react";
import GlassCard from "../GlassCard";

interface Agent {
  id: string;
  name: string;
  status: string;
  persona: string;
  language: string;
}

interface AgentViewHeaderProps {
  agent: Agent;
  onBack: () => void;
  onEdit: () => void;
  onShowQR: () => void;
  onPublish: () => void;
  onPause: () => void;
}

const AgentViewHeader: React.FC<AgentViewHeaderProps> = ({
  agent,
  onBack,
  onEdit,
  onShowQR,
  onPublish,
  onPause,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "training":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    }
  };

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
              <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 common-bg-icons flex items-center justify-center flex-shrink-0 rounded-xl">
                <Bot className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-black dark:text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white mb-2 truncate">
                  {agent.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(
                      agent.status
                    )}`}
                  >
                    {agent.status}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {agent.persona}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {agent.language}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={onEdit}
              className="flex-1 sm:flex-none common-button-bg2 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px]"
            >
              <Edit className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">Edit</span>
            </button>
            <button
              onClick={onShowQR}
              className="flex-1 sm:flex-none common-button-bg2 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px]"
            >
              <QrCode className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">View QR</span>
            </button>
            {agent.status === "Published" ? (
              <button
                onClick={onPause}
                className="flex-1 sm:flex-none common-button-bg2 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px]"
              >
                <Pause className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">Pause</span>
              </button>
            ) : (
              <button
                onClick={onPublish}
                className="flex-1 sm:flex-none common-button-bg flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl touch-manipulation min-h-[40px]"
              >
                <Play className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">Publish</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default AgentViewHeader;
