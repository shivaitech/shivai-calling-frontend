import React from "react";
import { Search, Filter, X } from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import SearchableSelect from "../../../components/SearchableSelect";

interface AgentSearchFilterProps {
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClearFilters: () => void;
}

const AgentSearchFilter: React.FC<AgentSearchFilterProps> = ({
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onClearFilters,
}) => {
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "published", label: "Published" },
    { value: "draft", label: "Draft" },
    { value: "training", label: "Training" },
  ];

  return (
    <GlassCard>
      <div className="p-4 lg:p-6">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 lg:py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-slate-800 dark:text-white text-sm transition-all duration-200"
            />
          </div>

          {/* Status Filter */}
          <div className="hidden lg:block min-w-[180px]">
            <SearchableSelect
              options={statusOptions}
              value={statusFilter}
              onChange={onStatusChange}
              placeholder="Filter by status..."
            />
          </div>

          {/* Filter Button - Mobile Only */}
          <button className="lg:hidden flex items-center justify-center common-button-bg2 p-2.5 rounded-lg active:scale-95">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || statusFilter !== "all") && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Active filters:
            </span>
            {searchTerm && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs flex items-center gap-1">
                "{searchTerm}"
                <button
                  onClick={() => onSearchChange("")}
                  className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs flex items-center gap-1">
                Status: {statusFilter}
                <button
                  onClick={() => onStatusChange("all")}
                  className="hover:bg-green-200 dark:hover:bg-green-800/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={onClearFilters}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default AgentSearchFilter;
