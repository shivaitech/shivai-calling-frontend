import React from "react";
import { Bot } from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import SearchableSelect from "../../../components/SearchableSelect";

interface AgentIdentitySectionProps {
  name: string;
  gender: string;
  persona: string;
  onNameChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onPersonaChange: (value: string) => void;
}

const AgentIdentitySection: React.FC<AgentIdentitySectionProps> = ({
  name,
  gender,
  persona,
  onNameChange,
  onGenderChange,
  onPersonaChange,
}) => {
  const genderOptions = [
    { value: "Female", label: "Female" },
    { value: "Male", label: "Male" },
    { value: "Non-binary", label: "Non-binary" },
    { value: "Other", label: "Other" },
  ];

  const personaOptions = [
    { value: "Empathetic", label: "Empathetic" },
    { value: "Professional", label: "Professional" },
    { value: "Friendly", label: "Friendly" },
    { value: "Enthusiastic", label: "Enthusiastic" },
    { value: "Reassuring (Support)", label: "Reassuring (Support)" },
    { value: "Persuasive (Sales)", label: "Persuasive (Sales)" },
  ];

  return (
    <GlassCard>
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
            Identity
          </h3>
        </div>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
          Define your agent's basic identity and personality
        </p>

        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Enter a descriptive name for your agent"
                className="common-bg-icons w-full px-3 sm:px-4 py-3 sm:py-3 rounded-xl text-slate-800 dark:text-white text-base sm:text-sm transition-all duration-200 touch-manipulation"
              />
              {!name && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  Agent name is required
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Gender
              </label>
              <SearchableSelect
                options={genderOptions}
                value={gender}
                onChange={onGenderChange}
                placeholder="Select gender..."
              />
            </div>
          </div>

          <div className="col-span-full">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Persona *
            </label>
            <SearchableSelect
              options={personaOptions}
              value={persona}
              onChange={onPersonaChange}
              placeholder="Select persona..."
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Choose a personality that aligns with your brand and use case
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default AgentIdentitySection;
