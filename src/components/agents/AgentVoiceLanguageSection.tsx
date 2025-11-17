import React from "react";
import { MessageSquare } from "lucide-react";
import GlassCard from "../GlassCard";

interface AgentVoiceLanguageSectionProps {
  language: string;
  voice: string;
  onLanguageChange: (value: string) => void;
  onVoiceChange: (value: string) => void;
}

const AgentVoiceLanguageSection: React.FC<AgentVoiceLanguageSectionProps> = ({
  language,
  voice,
  onLanguageChange,
  onVoiceChange,
}) => {
  const languageOptions = [
    { value: "Hindi", label: "Hindi", group: "India" },
    { value: "Punjabi", label: "Punjabi", group: "India" },
    { value: "Tamil", label: "Tamil", group: "India" },
    { value: "Telugu", label: "Telugu", group: "India" },
    { value: "Bengali", label: "Bengali", group: "India" },
    { value: "Marathi", label: "Marathi", group: "India" },
    { value: "Gujarati", label: "Gujarati", group: "India" },
    { value: "Kannada", label: "Kannada", group: "India" },
    { value: "Malayalam", label: "Malayalam", group: "India" },
    { value: "Odia", label: "Odia", group: "India" },
    { value: "Urdu", label: "Urdu", group: "India" },
    { value: "Arabic", label: "Arabic", group: "Middle East" },
    { value: "Persian", label: "Persian", group: "Middle East" },
    { value: "Hebrew", label: "Hebrew", group: "Middle East" },
    { value: "Turkish", label: "Turkish", group: "Middle East" },
    { value: "English (UK)", label: "English (UK)", group: "Europe" },
    { value: "French", label: "French", group: "Europe" },
    { value: "German", label: "German", group: "Europe" },
    { value: "Spanish", label: "Spanish", group: "Europe" },
    { value: "Italian", label: "Italian", group: "Europe" },
    { value: "Dutch", label: "Dutch", group: "Europe" },
    { value: "English (US)", label: "English (US)", group: "Americas" },
    { value: "Spanish (MX)", label: "Spanish (MX)", group: "Americas" },
    { value: "Portuguese (BR)", label: "Portuguese (BR)", group: "Americas" },
    { value: "French (CA)", label: "French (CA)", group: "Americas" },
    { value: "Chinese (Mandarin)", label: "Chinese (Mandarin)", group: "APAC" },
    { value: "Japanese", label: "Japanese", group: "APAC" },
    { value: "Korean", label: "Korean", group: "APAC" },
    { value: "Thai", label: "Thai", group: "APAC" },
    { value: "Vietnamese", label: "Vietnamese", group: "APAC" },
  ];

  const voiceOptions = [
    { value: "Sarah - Professional", label: "Sarah - Professional", group: "English" },
    { value: "John - Friendly", label: "John - Friendly", group: "English" },
    { value: "Emma - Warm", label: "Emma - Warm", group: "English" },
    { value: "Arjun - Friendly", label: "Arjun - Friendly", group: "Hindi" },
    { value: "Priya - Professional", label: "Priya - Professional", group: "Hindi" },
    { value: "Raj - Confident", label: "Raj - Confident", group: "Hindi" },
  ];

  // Group languages by region
  const groupedLanguages = languageOptions.reduce((acc, option) => {
    if (!acc[option.group]) {
      acc[option.group] = [];
    }
    acc[option.group].push(option);
    return acc;
  }, {} as Record<string, typeof languageOptions>);

  // Group voices
  const groupedVoices = voiceOptions.reduce((acc, option) => {
    if (!acc[option.group]) {
      acc[option.group] = [];
    }
    acc[option.group].push(option);
    return acc;
  }, {} as Record<string, typeof voiceOptions>);

  return (
    <GlassCard>
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
            Voice & Language
          </h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Configure language and voice settings
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Language *
            </label>
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="common-bg-icons w-full px-3 sm:px-4 py-3 rounded-xl text-slate-800 dark:text-white text-base sm:text-sm transition-all duration-200 touch-manipulation appearance-none bg-no-repeat bg-right"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 0.75rem center",
                backgroundSize: "1.25rem 1.25rem",
              }}
            >
              <option value="">Select language...</option>
              {Object.entries(groupedLanguages).map(([group, options]) => (
                <optgroup key={group} label={group}>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Voice *
            </label>
            <select
              value={voice}
              onChange={(e) => onVoiceChange(e.target.value)}
              className="common-bg-icons w-full px-3 sm:px-4 py-3 rounded-xl text-slate-800 dark:text-white text-base sm:text-sm transition-all duration-200 touch-manipulation appearance-none bg-no-repeat bg-right"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 0.75rem center",
                backgroundSize: "1.25rem 1.25rem",
              }}
            >
              <option value="">Select voice...</option>
              {Object.entries(groupedVoices).map(([group, options]) => (
                <optgroup key={group} label={group}>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default AgentVoiceLanguageSection;
