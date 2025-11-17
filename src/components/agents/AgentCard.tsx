import React from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Eye, Edit, Zap, Play, Pause, Copy, Trash2, Globe } from "lucide-react";
import GlassCard from "../GlassCard";

interface Agent {
  id: string;
  name: string;
  status: string;
  persona: string;
  language: string;
  voice: string;
  stats: {
    conversations: number;
    successRate: number;
    avgResponseTime: number;
    activeUsers: number;
  };
}

interface AgentCardProps {
  agent: Agent;
  onPublish: (id: string) => void;
  onPause: (id: string) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onPublish, onPause }) => {
  const navigate = useNavigate();

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
    <GlassCard hover>
      <div className="p-4 sm:p-5 lg:p-6">
        {/* Agent Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 sm:w-12 h-10 sm:h-12 common-bg-icons rounded-xl flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 sm:w-6 h-5 sm:h-6 text-slate-900 dark:text-slate-100" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-1 text-sm sm:text-base truncate">
              {agent.name}
            </h3>
            <span
              className={`inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(
                agent.status
              )}`}
            >
              {agent.status}
            </span>
          </div>
        </div>

        {/* Agent Details */}
        <div className="space-y-2 mb-4 sm:mb-5">
          <div className="flex items-center justify-start text-xs sm:text-sm">
            <span className="text-slate-500 dark:text-slate-400 w-20 sm:w-24">
              Persona:
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {agent.persona}
            </span>
          </div>
          <div className="flex items-center justify-start text-xs sm:text-sm">
            <span className="text-slate-500 dark:text-slate-400 w-20 sm:w-24">
              Language:
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {agent.language}
            </span>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigate(`/agents/${agent.id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 text-sm font-medium active:scale-[0.98]"
          >
            <Eye className="w-4 h-4" />
            View
          </button>

          <button
            onClick={() => navigate(`/agents/${agent.id}/edit`)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 text-sm font-medium active:scale-[0.98]"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>

          <button
            onClick={() =>
              navigate(`/agents/${agent.id}/train`, {
                state: { from: "list" },
              })
            }
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200 text-sm font-medium active:scale-[0.98]"
          >
            <Zap className="w-4 h-4" />
            Train
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="flex items-center gap-2">
          {agent.status === "Published" ? (
            <button
              onClick={() => onPause(agent.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors text-sm font-medium active:scale-[0.98]"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          ) : (
            <button
              onClick={() => onPublish(agent.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium active:scale-[0.98]"
            >
              <Play className="w-4 h-4" />
              Publish
            </button>
          )}

          <button className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95">
            <Copy className="w-4 h-4" />
          </button>

          <button className="p-2.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

export default AgentCard;
