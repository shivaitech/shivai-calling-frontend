import React, { useEffect, useMemo, useState } from "react";
import { Loader2, AlertTriangle, Sparkles, Play, Square } from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { agentAPI, VoiceCatalog, VoiceCatalogProvider, TtsConfig } from "../services/agentAPI";

export interface TTSVoiceSelectorValue {
  provider: string;
  model: string;
  voice_id: string;
  language: string;
  speed: number;
  emotion_enabled: boolean;
  emotion_profile: string;
}

interface TTSVoiceSelectorProps {
  value: TTSVoiceSelectorValue;
  onChange: (value: TTSVoiceSelectorValue) => void;
  /** Filter voices to this gender when the catalog voice provides one (best-effort, not all providers return gender). */
  genderFilter?: string;
  /** Voice preview — only meaningful for providers the preview backend supports (currently google_chirp only). */
  onTestVoice?: (voiceId: string) => void;
  onStopTestVoice?: () => void;
  isTesting?: boolean;
  isLoadingTest?: boolean;
  testSupportedProviders?: string[];
  className?: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  google_chirp: "Google Chirp",
  cartesia: "Cartesia",
  openai: "OpenAI",
};

/**
 * Provider → Model → Voice cascading selector backed by GET /api/v1/voice/catalog.
 * The catalog is fetched once (cached in agentAPI) and is a control-plane
 * request only — never called during agent creation/update or a live call.
 */
const TTSVoiceSelector: React.FC<TTSVoiceSelectorProps> = ({
  value,
  onChange,
  genderFilter,
  onTestVoice,
  onStopTestVoice,
  isTesting = false,
  isLoadingTest = false,
  testSupportedProviders = ["google_chirp"],
  className = "",
}) => {
  const [catalog, setCatalog] = useState<VoiceCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    agentAPI
      .getVoiceCatalog()
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load voice options. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const retry = () => {
    setIsLoading(true);
    setError(null);
    agentAPI
      .getVoiceCatalog({ forceRefresh: true })
      .then(setCatalog)
      .catch(() => setError("Couldn't load voice options. Please try again."))
      .finally(() => setIsLoading(false));
  };

  const providers = catalog?.providers || [];

  // Once the catalog arrives, fill in model/voice/language for the current
  // provider if they're still empty (e.g. a fresh "Create Agent" form whose
  // initial state only knows the default provider id, not its models yet).
  // Never overwrites an already-selected value (e.g. one loaded from an
  // existing agent's saved tts config).
  useEffect(() => {
    if (!catalog) return;
    const provider = providers.find((p) => p.id === value.provider) || providers[0];
    if (!provider) return;

    const needsModel = !value.model || !provider.models.some((m) => m.id === value.model);
    const model = needsModel ? provider.models[0] : provider.models.find((m) => m.id === value.model);
    const needsVoice = needsModel || !value.voice_id || !(model?.voices || []).some((v) => v.id === value.voice_id);
    const needsLanguage = !value.language && catalog.languages.length > 0;

    if (needsModel || needsVoice || provider.id !== value.provider || needsLanguage) {
      onChange({
        ...value,
        provider: provider.id,
        model: model?.id || "",
        voice_id: needsVoice ? model?.voices[0]?.id || "" : value.voice_id,
        language: needsLanguage ? catalog.languages[0] : value.language,
        emotion_profile: value.emotion_profile || provider.emotion_profiles?.[0] || "neutral",
      });
    }
    // Only re-run when the catalog itself changes — value changes are driven
    // by this effect and the user handlers below, not the other way round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog]);

  const selectedProvider = providers.find((p) => p.id === value.provider);
  const models = selectedProvider?.models || [];
  const selectedModel = models.find((m) => m.id === value.model);
  const allVoices = selectedModel?.voices || [];
  const voices = useMemo(() => {
    if (!genderFilter) return allVoices;
    const filtered = allVoices.filter(
      (v) => !v.gender || v.gender.toLowerCase() === genderFilter.toLowerCase()
    );
    // Fall back to the unfiltered list rather than showing an empty picker
    // if this provider/model doesn't return gender-tagged voices matching it.
    return filtered.length > 0 ? filtered : allVoices;
  }, [allVoices, genderFilter]);

  const providerOptions = providers.map((p) => ({
    value: p.id,
    label: `${PROVIDER_LABELS[p.id] || p.name}${p.configured ? "" : " (not configured)"}`,
  }));

  const modelOptions = models.map((m) => ({
    value: m.id,
    label: m.name,
  }));

  const voiceOptions = voices.map((v) => ({
    value: v.id,
    label: v.gender ? `${v.name} — ${v.gender}` : v.name,
  }));

  const handleProviderChange = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    const firstModel = provider?.models[0];
    const firstVoice = firstModel?.voices[0];
    onChange({
      ...value,
      provider: providerId,
      model: firstModel?.id || "",
      voice_id: firstVoice?.id || "",
      emotion_enabled: false,
      emotion_profile: provider?.emotion_profiles?.[0] || "neutral",
    });
  };

  const handleModelChange = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    const firstVoice = model?.voices[0];
    onChange({ ...value, model: modelId, voice_id: firstVoice?.id || "" });
  };

  const handleVoiceChange = (voiceId: string) => {
    onChange({ ...value, voice_id: voiceId });
  };

  const canPreview =
    !!onTestVoice && !!value.voice_id && testSupportedProviders.includes(value.provider);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 px-4 py-6 justify-center text-slate-500 dark:text-slate-400 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading voice options…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl ${className}`}>
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
        <button
          type="button"
          onClick={retry}
          className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline flex-shrink-0"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Provider + Model + Language */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            TTS Provider
          </label>
          <SearchableSelect
            options={providerOptions}
            value={value.provider}
            onChange={handleProviderChange}
            placeholder="Select provider..."
          />
          {selectedProvider && !selectedProvider.configured && (
            <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              Not configured — voices may be unavailable.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Model
          </label>
          <SearchableSelect
            options={modelOptions}
            value={value.model}
            onChange={handleModelChange}
            placeholder="Select model..."
            disabled={modelOptions.length === 0}
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            TTS Language
          </label>
          <SearchableSelect
            options={(catalog?.languages || []).map((l) => ({ value: l, label: l }))}
            value={value.language}
            onChange={(language) => onChange({ ...value, language })}
            placeholder="Select language..."
            disabled={!catalog?.languages?.length}
          />
        </div>
      </div>

      {/* Voice + Test */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Voice
        </label>
        <div className="flex gap-2">
          <SearchableSelect
            options={voiceOptions}
            value={value.voice_id}
            onChange={handleVoiceChange}
            placeholder={voiceOptions.length === 0 ? "No voices available" : "Select voice..."}
            disabled={voiceOptions.length === 0}
            className="flex-1"
          />
          {onTestVoice && (
            <button
              type="button"
              disabled={!canPreview || isLoadingTest}
              onClick={() => {
                if (isTesting) {
                  onStopTestVoice?.();
                } else {
                  onTestVoice(value.voice_id);
                }
              }}
              title={
                canPreview
                  ? undefined
                  : "Preview is currently only available for Google Chirp voices"
              }
              className={`px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-all flex items-center gap-2 flex-shrink-0 ${
                !canPreview || isLoadingTest
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  : isTesting
                    ? "bg-red-500 hover:bg-red-600 text-white hover:scale-[1.02] active:scale-[0.98]"
                    : "common-button-bg hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {isLoadingTest ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isTesting ? (
                <Square className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{isTesting ? "Stop" : "Test"}</span>
            </button>
          )}
        </div>
        {selectedProvider?.id === "cartesia" && (
          <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">
            Cartesia voices are fetched securely from your account — the API key never reaches the browser.
          </p>
        )}
      </div>

      {/* Speed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
            Speed
          </label>
          <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
            {value.speed.toFixed(1)}x
          </span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={value.speed}
          onChange={(e) => onChange({ ...value, speed: parseFloat(e.target.value) })}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600"
          style={{
            background: `linear-gradient(to right, #2563eb ${((value.speed - 0.5) / (2.0 - 0.5)) * 100}%, #e2e8f0 ${((value.speed - 0.5) / (2.0 - 0.5)) * 100}%)`,
          }}
        />
        <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">
          <span>Slower (0.5x)</span>
          <span>Normal (1.0x)</span>
          <span>Faster (2.0x)</span>
        </div>
      </div>

      {/* Emotion — only for providers that support it */}
      {selectedProvider?.supports_emotions && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              Emotion
            </label>
            <button
              type="button"
              onClick={() => onChange({ ...value, emotion_enabled: !value.emotion_enabled })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                value.emotion_enabled ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  value.emotion_enabled ? "translate-x-4.5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {value.emotion_enabled && (
            <SearchableSelect
              options={selectedProvider.emotion_profiles.map((p) => ({
                value: p,
                label: p.charAt(0).toUpperCase() + p.slice(1),
              }))}
              value={value.emotion_profile}
              onChange={(profile) => onChange({ ...value, emotion_profile: profile })}
              placeholder="Select emotion..."
            />
          )}
        </div>
      )}
    </div>
  );
};

/** Build the tts payload object from selector state, ready to send to create/update agent. */
export function toTtsConfig(v: TTSVoiceSelectorValue): TtsConfig {
  return {
    provider: v.provider as TtsConfig["provider"],
    model: v.model,
    voice_id: v.voice_id,
    language: v.language,
    speed: v.speed,
    emotion_enabled: v.emotion_enabled,
    emotion_profile: v.emotion_profile,
  };
}

export default TTSVoiceSelector;
