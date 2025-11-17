import React from "react";
import { Shield, Info } from "lucide-react";
import GlassCard from "../GlassCard";
import Tooltip from "../Tooltip";

interface AgentGuardrailsSectionProps {
  guardrailsLevel: string;
  onGuardrailsChange: (value: string) => void;
}

const AgentGuardrailsSection: React.FC<AgentGuardrailsSectionProps> = ({
  guardrailsLevel,
  onGuardrailsChange,
}) => {
  const levels = [
    {
      value: "Low",
      label: "Low",
      desc: "Minimal restrictions, maximum flexibility",
    },
    {
      value: "Medium",
      label: "Medium",
      desc: "Balanced approach with reasonable limits",
    },
    {
      value: "High",
      label: "High",
      desc: "Strict guidelines, maximum safety",
    },
  ];

  return (
    <GlassCard>
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
            Guardrails Level
          </h3>
          <Tooltip content="Guardrails control how strictly the agent follows guidelines and handles sensitive topics. Higher levels provide more restrictions but may limit flexibility.">
            <Info className="w-4 h-4 text-slate-400 cursor-help" />
          </Tooltip>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {levels.map((level) => (
            <label
              key={level.value}
              className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl cursor-pointer transition-all ${
                guardrailsLevel === level.value
                  ? "common-button-bg shadow-md"
                  : "common-bg-icons hover:shadow-sm"
              }`}
            >
              <input
                type="radio"
                name="guardrails"
                value={level.value}
                checked={guardrailsLevel === level.value}
                onChange={() => onGuardrailsChange(level.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <p
                  className={`font-medium text-sm ${
                    guardrailsLevel === level.value
                      ? "text-white"
                      : "text-slate-800 dark:text-white"
                  }`}
                >
                  {level.label}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    guardrailsLevel === level.value
                      ? "text-white/80"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {level.desc}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};

export default AgentGuardrailsSection;
