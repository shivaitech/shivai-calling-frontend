import React from "react";
import { Settings } from "lucide-react";
import GlassCard from "../../../components/GlassCard";

interface AgentConfigSectionProps {
  persona: string;
  language: string;
  voice: string;
}

const AgentConfigSection: React.FC<AgentConfigSectionProps> = ({
  persona,
  language,
  voice,
}) => {
  const ConfigItem: React.FC<{ label: string; value: string }> = ({
    label,
    value,
  }) => (
    <div className="flex items-start justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
        {label}
      </span>
      <span className="text-sm text-slate-800 dark:text-white font-semibold text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );

  return (
    <GlassCard>
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
            Configuration
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-0">
            <ConfigItem label="Persona" value={persona} />
            <ConfigItem label="Language" value={language} />
          </div>
          <div className="space-y-0">
            <ConfigItem label="Voice" value={voice} />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default AgentConfigSection;
