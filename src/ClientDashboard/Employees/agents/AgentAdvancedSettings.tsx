import React from "react";
import { Settings } from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import SearchableSelect from "../../../components/SearchableSelect";

interface AgentAdvancedSettingsProps {
  customInstructions: string;
  responseStyle: string;
  maxResponseLength: string;
  temperature: number;
  contextWindow: string;
  onCustomInstructionsChange: (value: string) => void;
  onResponseStyleChange: (value: string) => void;
  onMaxResponseLengthChange: (value: string) => void;
  onTemperatureChange: (value: number) => void;
  onContextWindowChange: (value: string) => void;
}

const AgentAdvancedSettings: React.FC<AgentAdvancedSettingsProps> = ({
  customInstructions,
  responseStyle,
  maxResponseLength,
  temperature,
  contextWindow,
  onCustomInstructionsChange,
  onResponseStyleChange,
  onMaxResponseLengthChange,
  onTemperatureChange,
  onContextWindowChange,
}) => {
  const responseStyleOptions = [
    { value: "Concise", label: "Concise" },
    { value: "Balanced", label: "Balanced" },
    { value: "Detailed", label: "Detailed" },
  ];

  const maxResponseOptions = [
    { value: "Short (50 words)", label: "Short (50 words)" },
    { value: "Medium (150 words)", label: "Medium (150 words)" },
    { value: "Long (300 words)", label: "Long (300 words)" },
  ];

  const contextWindowOptions = [
    { value: "Small (4K tokens)", label: "Small (4K tokens)" },
    { value: "Standard (8K tokens)", label: "Standard (8K tokens)" },
    { value: "Large (16K tokens)", label: "Large (16K tokens)" },
  ];

  const getTemperatureLabel = (temp: number) => {
    if (temp < 30) return "Very Consistent";
    if (temp < 50) return "Consistent";
    if (temp < 70) return "Balanced";
    if (temp < 90) return "Creative";
    return "Very Creative";
  };

  return (
    <GlassCard>
      <div className="p-4 sm:p-5 lg:p-6 z-[99] relative">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
            Advanced Settings
          </h3>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Custom Instructions
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => onCustomInstructionsChange(e.target.value)}
              placeholder="Add specific instructions for your agent..."
              rows={4}
              className="common-bg-icons w-full px-3 sm:px-4 py-3 rounded-xl resize-none text-sm sm:text-base transition-all duration-200"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Provide specific guidelines, rules, or context for your agent's
              responses
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Response Style
              </label>
              <SearchableSelect
                options={responseStyleOptions}
                value={responseStyle}
                onChange={onResponseStyleChange}
                placeholder="Select response style..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Max Response Length
              </label>
              <SearchableSelect
                options={maxResponseOptions}
                value={maxResponseLength}
                onChange={onMaxResponseLengthChange}
                placeholder="Select max length..."
              />
            </div>
          </div>

          <div className="common-bg-icons p-4 rounded-xl">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
              Temperature (Creativity): {temperature}% -{" "}
              <span className="text-blue-600 dark:text-blue-400">
                {getTemperatureLabel(temperature)}
              </span>
            </label>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={temperature}
                  onChange={(e) => onTemperatureChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  style={{
                    background: `linear-gradient(to right, rgb(37, 99, 235) 0%, rgb(37, 99, 235) ${temperature}%, rgb(226, 232, 240) ${temperature}%, rgb(226, 232, 240) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>Conservative</span>
                  <span>Creative</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 text-xs">
                {["0%", "25%", "50%", "75%", "100%"].map((value, index) => (
                  <button
                    key={value}
                    onClick={() => onTemperatureChange(index * 25)}
                    className="common-bg-icons py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              Lower values for more consistent responses, higher for more
              creative answers
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Context Window
            </label>
            <SearchableSelect
              options={contextWindowOptions}
              value={contextWindow}
              onChange={onContextWindowChange}
              placeholder="Select context window..."
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default AgentAdvancedSettings;
