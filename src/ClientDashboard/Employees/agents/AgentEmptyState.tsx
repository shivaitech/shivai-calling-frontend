import React from "react";
import { Bot } from "lucide-react";

interface AgentEmptyStateProps {
  hasFilters: boolean;
  isDeveloper: boolean;
  onCreateClick: () => void;
  onClearFilters: () => void;
}

const AgentEmptyState: React.FC<AgentEmptyStateProps> = ({
  hasFilters,
  isDeveloper,
  onCreateClick,
  onClearFilters,
}) => {
  return (
    <div className="text-center py-12 lg:py-16 px-4">
      <Bot className="w-20 lg:w-24 h-20 lg:h-24 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
      <h3 className="text-xl lg:text-2xl font-medium text-slate-600 dark:text-slate-400 mb-3">
        {hasFilters ? "No agents found" : "No agents created yet"}
      </h3>
      <p className="text-sm lg:text-base text-slate-500 dark:text-slate-500 max-w-md lg:max-w-lg mx-auto mb-6 leading-relaxed">
        {hasFilters
          ? "Try adjusting your search or filter criteria to find what you're looking for"
          : "Create your first AI agent to get started with automated conversations and boost your business efficiency"}
      </p>
      {!hasFilters && isDeveloper && (
        <div className="space-y-3">
          <button
            onClick={onCreateClick}
            className="w-full sm:w-auto common-button-bg px-6 py-3 rounded-xl shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Your First Agent
          </button>
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">
            Get started in just 2 minutes ⚡
          </p>
        </div>
      )}
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="w-full sm:w-auto common-button-bg2 px-6 py-2.5 rounded-lg"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};

export default AgentEmptyState;
