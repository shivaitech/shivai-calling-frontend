import React, { useState, useEffect } from "react";
import {
  Plus,
  X,
  Edit2,
  Save,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Volume2,
  Settings,
  BookOpen,
  Shield,
  PhoneOff,
  Zap,
} from "lucide-react";
import GlassCard from "../../components/GlassCard";
import appToast from "../../components/AppToast";

interface ConversationExample {
  id: string;
  userMessage: string;
  agentResponse: string;
}

interface ObjectionHandling {
  id: string;
  objection: string;
  response: string;
}

interface DataField {
  id: string;
  name: string;
  type: "text" | "number" | "select";
  required: boolean;
  description: string;
}

interface PronunciationRule {
  id: string;
  word: string;
  phonetic: string;
}

interface TrainingConfig {
  conversationGoal: {
    primaryGoal: string;
    successCriteria: string[];
  };
  conversationExamples: ConversationExample[];
  objectionHandling: ObjectionHandling[];
  dataCollection: DataField[];
  keywords: {
    triggerKeywords: string[];
    doNotSay: string[];
    sensitiveTopics: string[];
  };
  escalation: {
    triggerPhrases: string[];
    escalationAction: string;
    callEndingConditions: string;
  };
  pronunciation: PronunciationRule[];
  behaviorSettings: {
    patience: number; // 1-10 seconds
    creativity: number; // 0-1
    maxTurns: number; // 5-50
    confirmBeforeAction: boolean;
    rePromptOnSilence: boolean;
    collectName: boolean;
    collectEmail: boolean;
    endAfterGoal: boolean;
    sentimentDetection: boolean;
    bilingualFallback: boolean;
    logTranscripts: boolean;
  };
}

interface AgentTrainingProps {
  agentId: string;
  agentName: string;
  onSave?: (config: TrainingConfig) => void;
}

const AgentTraining: React.FC<AgentTrainingProps> = ({
  agentId,
  agentName,
  onSave,
}) => {
  const [config, setConfig] = useState<TrainingConfig>({
    conversationGoal: {
      primaryGoal: "Help users discover venues and vendors, collect event requirements, and guide them to download or use the app.",
      successCriteria: ["User agrees to try the app", "User provides event details"],
    },
    conversationExamples: [
      {
        id: "1",
        userMessage: "I need to plan a quick birthday party.",
        agentResponse: "Great! Let me suggest some venues and vendors for you. Where would you like to host it?",
      },
    ],
    objectionHandling: [
      {
        id: "1",
        objection: "Is the app really free?",
        response: "Yes, our app is provided as a free service to help you plan your events effortlessly.",
      },
    ],
    dataCollection: [
      {
        id: "1",
        name: "event_type",
        type: "text",
        required: true,
        description: "Type of event (birthday, wedding, BBQ)",
      },
      {
        id: "2",
        name: "location",
        type: "text",
        required: true,
        description: "City or area for the event",
      },
    ],
    keywords: {
      triggerKeywords: ["book a venue", "plan a party", "find a vendor", "birthday"],
      doNotSay: ["competitor", "cheap", "bad reviews"],
      sensitiveTopics: ["pricing disputes", "legal complaints", "refund requests"],
    },
    escalation: {
      triggerPhrases: ["speak to a human", "talk to someone", "manager"],
      escalationAction: "Transfer to live agent",
      callEndingConditions: "User says goodbye, thank you, or indicates they're done. End if user is unresponsive after 3 attempts.",
    },
    pronunciation: [
      {
        id: "1",
        word: "Anasa",
        phonetic: "ah-NAH-sah",
      },
    ],
    behaviorSettings: {
      patience: 3,
      creativity: 0.7,
      maxTurns: 20,
      confirmBeforeAction: true,
      rePromptOnSilence: true,
      collectName: true,
      collectEmail: true,
      endAfterGoal: true,
      sentimentDetection: true,
      bilingualFallback: false,
      logTranscripts: true,
    },
  });

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    goal: true,
    examples: true,
    objections: true,
    dataCollection: true,
    keywords: true,
    escalation: true,
    pronunciation: true,
    behavior: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        onSave(config);
      }
      appToast.success(`${agentName} training configuration saved!`);
    } catch (error) {
      appToast.error("Failed to save training configuration");
    } finally {
      setIsSaving(false);
    }
  };

  // Conversation Goal Management
  const updateConversationGoal = (field: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      conversationGoal: {
        ...prev.conversationGoal,
        [field]: value,
      },
    }));
  };

  const addCriteria = () => {
    const newCriteria = prompt("Enter success criteria:");
    if (newCriteria) {
      setConfig((prev) => ({
        ...prev,
        conversationGoal: {
          ...prev.conversationGoal,
          successCriteria: [...prev.conversationGoal.successCriteria, newCriteria],
        },
      }));
    }
  };

  const removeCriteria = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      conversationGoal: {
        ...prev.conversationGoal,
        successCriteria: prev.conversationGoal.successCriteria.filter(
          (_, i) => i !== index
        ),
      },
    }));
  };

  // Conversation Examples Management
  const addExample = () => {
    const newExample: ConversationExample = {
      id: Date.now().toString(),
      userMessage: "",
      agentResponse: "",
    };
    setConfig((prev) => ({
      ...prev,
      conversationExamples: [...prev.conversationExamples, newExample],
    }));
  };

  const updateExample = (
    id: string,
    field: "userMessage" | "agentResponse",
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      conversationExamples: prev.conversationExamples.map((ex) =>
        ex.id === id ? { ...ex, [field]: value } : ex
      ),
    }));
  };

  const removeExample = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      conversationExamples: prev.conversationExamples.filter(
        (ex) => ex.id !== id
      ),
    }));
  };

  // Objection Handling Management
  const addObjection = () => {
    const newObjection: ObjectionHandling = {
      id: Date.now().toString(),
      objection: "",
      response: "",
    };
    setConfig((prev) => ({
      ...prev,
      objectionHandling: [...prev.objectionHandling, newObjection],
    }));
  };

  const updateObjection = (
    id: string,
    field: "objection" | "response",
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      objectionHandling: prev.objectionHandling.map((obj) =>
        obj.id === id ? { ...obj, [field]: value } : obj
      ),
    }));
  };

  const removeObjection = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      objectionHandling: prev.objectionHandling.filter((obj) => obj.id !== id),
    }));
  };

  // Data Collection Management
  const addDataField = () => {
    const newField: DataField = {
      id: Date.now().toString(),
      name: "",
      type: "text",
      required: false,
      description: "",
    };
    setConfig((prev) => ({
      ...prev,
      dataCollection: [...prev.dataCollection, newField],
    }));
  };

  const updateDataField = (id: string, field: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      dataCollection: prev.dataCollection.map((df) =>
        df.id === id ? { ...df, [field]: value } : df
      ),
    }));
  };

  const removeDataField = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      dataCollection: prev.dataCollection.filter((df) => df.id !== id),
    }));
  };

  // Keywords Management
  const addKeywordTag = (category: "triggerKeywords" | "doNotSay" | "sensitiveTopics", keyword: string) => {
    if (keyword.trim()) {
      setConfig((prev) => ({
        ...prev,
        keywords: {
          ...prev.keywords,
          [category]: [...prev.keywords[category], keyword],
        },
      }));
    }
  };

  const removeKeywordTag = (category: "triggerKeywords" | "doNotSay" | "sensitiveTopics", index: number) => {
    setConfig((prev) => ({
      ...prev,
      keywords: {
        ...prev.keywords,
        [category]: prev.keywords[category].filter((_, i) => i !== index),
      },
    }));
  };

  // Escalation Management
  const addEscalationPhrase = () => {
    const phrase = prompt("Enter escalation trigger phrase:");
    if (phrase) {
      setConfig((prev) => ({
        ...prev,
        escalation: {
          ...prev.escalation,
          triggerPhrases: [...prev.escalation.triggerPhrases, phrase],
        },
      }));
    }
  };

  const removeEscalationPhrase = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      escalation: {
        ...prev.escalation,
        triggerPhrases: prev.escalation.triggerPhrases.filter(
          (_, i) => i !== index
        ),
      },
    }));
  };

  // Pronunciation Management
  const addPronunciationRule = () => {
    const newRule: PronunciationRule = {
      id: Date.now().toString(),
      word: "",
      phonetic: "",
    };
    setConfig((prev) => ({
      ...prev,
      pronunciation: [...prev.pronunciation, newRule],
    }));
  };

  const updatePronunciation = (id: string, field: "word" | "phonetic", value: string) => {
    setConfig((prev) => ({
      ...prev,
      pronunciation: prev.pronunciation.map((rule) =>
        rule.id === id ? { ...rule, [field]: value } : rule
      ),
    }));
  };

  const removePronunciation = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      pronunciation: prev.pronunciation.filter((rule) => rule.id !== id),
    }));
  };

  // Behavior Settings
  const updateBehaviorSetting = (field: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      behaviorSettings: {
        ...prev.behaviorSettings,
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      {/* Header */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                Agent Training Lab
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Shape how {agentName} thinks, responds, and handles real conversations
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save Configuration</span>
              <span className="sm:hidden">Save</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* 1. Conversation Goal */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("goal")}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                Conversation Goal
              </h2>
              <span className="text-xs px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                Core
              </span>
            </div>
            {expandedSections.goal ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>

          {expandedSections.goal && (
            <div className="mt-4 space-y-4">
              {/* Primary Goal */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Primary Goal
                </label>
                <textarea
                  value={config.conversationGoal.primaryGoal}
                  onChange={(e) =>
                    updateConversationGoal("primaryGoal", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                  placeholder="Define what a successful call looks like for this agent..."
                />
              </div>

              {/* Success Criteria */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Success Criteria
                  </label>
                  <button
                    onClick={addCriteria}
                    className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {config.conversationGoal.successCriteria.map(
                    (criteria, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
                      >
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded">
                          {index + 1}
                        </span>
                        <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                          {criteria}
                        </span>
                        <button
                          onClick={() => removeCriteria(index)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* 2. Conversation Examples */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("examples")}
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Conversation Examples
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {config.conversationExamples.length} examples
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addExample();
                }}
                className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              {expandedSections.examples ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>

          {expandedSections.examples && (
            <div className="mt-4 space-y-4">
              {config.conversationExamples.map((example, idx) => (
                <div
                  key={example.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Example {idx + 1}
                    </span>
                    <button
                      onClick={() => removeExample(example.id)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      User Message
                    </label>
                    <textarea
                      value={example.userMessage}
                      onChange={(e) =>
                        updateExample(example.id, "userMessage", e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
                      placeholder="What the user says..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      Agent Response
                    </label>
                    <textarea
                      value={example.agentResponse}
                      onChange={(e) =>
                        updateExample(example.id, "agentResponse", e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
                      placeholder="How the agent should respond..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {/* 3. Objection Handling */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("objections")}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Objection Handling
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {config.objectionHandling.length} objections
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addObjection();
                }}
                className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              {expandedSections.objections ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>

          {expandedSections.objections && (
            <div className="mt-4 space-y-4">
              {config.objectionHandling.map((objection, idx) => (
                <div
                  key={objection.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Objection {idx + 1}
                    </span>
                    <button
                      onClick={() => removeObjection(objection.id)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      Objection / Pushback
                    </label>
                    <textarea
                      value={objection.objection}
                      onChange={(e) =>
                        updateObjection(objection.id, "objection", e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none"
                      placeholder="What objection might the caller raise?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      How to Respond
                    </label>
                    <textarea
                      value={objection.response}
                      onChange={(e) =>
                        updateObjection(objection.id, "response", e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none"
                      placeholder="How should the agent respond?"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {/* 4. Data Collection */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("dataCollection")}
          >
            <div className="flex items-center gap-3">
              <Edit2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Data Collection
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {config.dataCollection.length} fields
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addDataField();
                }}
                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              {expandedSections.dataCollection ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>

          {expandedSections.dataCollection && (
            <div className="mt-4 space-y-4">
              {config.dataCollection.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Field {idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            updateDataField(field.id, "required", e.target.checked)
                          }
                          className="rounded"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          Required
                        </span>
                      </label>
                      <button
                        onClick={() => removeDataField(field.id)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                        Field Name
                      </label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) =>
                          updateDataField(field.id, "name", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
                        placeholder="e.g., event_type"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                        Type
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateDataField(field.id, "type", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="select">Select</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      Description
                    </label>
                    <input
                      type="text"
                      value={field.description}
                      onChange={(e) =>
                        updateDataField(field.id, "description", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
                      placeholder="e.g., Type of event (birthday, wedding)"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {/* 5. Keywords & Guardrails */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("keywords")}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                Keywords & Guardrails
              </h2>
            </div>
            {expandedSections.keywords ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>

          {expandedSections.keywords && (
            <div className="mt-4 space-y-4">
              {/* Trigger Keywords */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Trigger Keywords
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    id="trigger-keyword-input"
                    placeholder="Type and press Enter or comma..."
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const input = e.currentTarget as HTMLInputElement;
                        addKeywordTag("triggerKeywords", input.value);
                        input.value = "";
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.keywords.triggerKeywords.map((keyword, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeywordTag("triggerKeywords", idx)}
                        className="hover:rotate-90 transition-transform"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Do Not Say */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Do Not Say (Prohibited Words)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    id="donot-say-input"
                    placeholder="Type and press Enter or comma..."
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const input = e.currentTarget as HTMLInputElement;
                        addKeywordTag("doNotSay", input.value);
                        input.value = "";
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.keywords.doNotSay.map((word, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs"
                    >
                      {word}
                      <button
                        onClick={() => removeKeywordTag("doNotSay", idx)}
                        className="hover:rotate-90 transition-transform"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sensitive Topics */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Sensitive Topics → Escalate
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    id="sensitive-input"
                    placeholder="Type and press Enter or comma..."
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const input = e.currentTarget as HTMLInputElement;
                        addKeywordTag("sensitiveTopics", input.value);
                        input.value = "";
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.keywords.sensitiveTopics.map((topic, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs"
                    >
                      {topic}
                      <button
                        onClick={() => removeKeywordTag("sensitiveTopics", idx)}
                        className="hover:rotate-90 transition-transform"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* 6. Escalation & Handoff */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("escalation")}
          >
            <div className="flex items-center gap-3">
              <PhoneOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                Escalation & Handoff
              </h2>
            </div>
            {expandedSections.escalation ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>

          {expandedSections.escalation && (
            <div className="mt-4 space-y-4">
              {/* Escalation Trigger Phrases */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Escalation Trigger Phrases
                  </label>
                  <button
                    onClick={addEscalationPhrase}
                    className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {config.escalation.triggerPhrases.map((phrase, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                        "{phrase}"
                      </span>
                      <button
                        onClick={() => removeEscalationPhrase(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Escalation Action */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Escalation Action
                </label>
                <select
                  value={config.escalation.escalationAction}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      escalation: {
                        ...prev.escalation,
                        escalationAction: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option>Transfer to live agent</option>
                  <option>End call with message</option>
                  <option>Schedule callback</option>
                </select>
              </div>

              {/* Call Ending Conditions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Call Ending Conditions
                </label>
                <textarea
                  value={config.escalation.callEndingConditions}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      escalation: {
                        ...prev.escalation,
                        callEndingConditions: e.target.value,
                      },
                    }))
                  }
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* 7. Pronunciation Dictionary */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("pronunciation")}
          >
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Pronunciation Dictionary
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Voice
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addPronunciationRule();
                }}
                className="p-2 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              {expandedSections.pronunciation ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>

          {expandedSections.pronunciation && (
            <div className="mt-4 space-y-4">
              {config.pronunciation.map((rule, idx) => (
                <div
                  key={rule.id}
                  className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Word / Phrase
                    </label>
                    <input
                      type="text"
                      value={rule.word}
                      onChange={(e) =>
                        updatePronunciation(rule.id, "word", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      placeholder="Word to pronounce"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Phonetic Spelling
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={rule.phonetic}
                        onChange={(e) =>
                          updatePronunciation(rule.id, "phonetic", e.target.value)
                        }
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                        placeholder="Phonetic spelling"
                      />
                      <button
                        onClick={() => removePronunciation(rule.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {/* 8. Behavior Settings */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("behavior")}
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                Behavior Settings
              </h2>
            </div>
            {expandedSections.behavior ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>

          {expandedSections.behavior && (
            <div className="mt-4 space-y-6">
              {/* Sliders */}
              <div className="space-y-4">
                {/* Patience */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Patience (silence before re-prompt)
                    </label>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {config.behaviorSettings.patience}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={config.behaviorSettings.patience}
                    onChange={(e) =>
                      updateBehaviorSetting("patience", parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>1s</span>
                    <span>10s</span>
                  </div>
                </div>

                {/* Creativity */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Creativity / Response Variability
                    </label>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {config.behaviorSettings.creativity.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.behaviorSettings.creativity}
                    onChange={(e) =>
                      updateBehaviorSetting("creativity", parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Max Turns */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Max Conversation Turns
                    </label>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {config.behaviorSettings.maxTurns}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={config.behaviorSettings.maxTurns}
                    onChange={(e) =>
                      updateBehaviorSetting("maxTurns", parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>5</span>
                    <span>50</span>
                  </div>
                </div>
              </div>

              {/* Toggle Settings */}
              <div className="space-y-3">
                {[
                  {
                    key: "confirmBeforeAction",
                    label: "Confirm before taking action",
                    desc: "Ask caller to confirm before booking or submitting data",
                  },
                  {
                    key: "rePromptOnSilence",
                    label: "Re-prompt on silence",
                    desc: "Repeat or rephrase if caller doesn't respond",
                  },
                  {
                    key: "collectName",
                    label: "Collect caller's name",
                    desc: "Sarah will ask for the caller's name early in the call",
                  },
                  {
                    key: "collectEmail",
                    label: "Collect email address",
                    desc: "Sarah will request an email for follow-up",
                  },
                  {
                    key: "endAfterGoal",
                    label: "End call after goal is achieved",
                    desc: "Don't keep talking once the primary goal is met",
                  },
                  {
                    key: "sentimentDetection",
                    label: "Sentiment detection",
                    desc: "Adjust tone if caller seems frustrated or upset",
                  },
                  {
                    key: "bilingualFallback",
                    label: "Bilingual fallback",
                    desc: "Switch language if caller switches mid-call",
                  },
                  {
                    key: "logTranscripts",
                    label: "Log call transcripts",
                    desc: "Save full transcripts for review and retraining",
                  },
                ].map(({ key, label, desc }) => (
                  <label
                    key={key}
                    className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={
                        config.behaviorSettings[
                          key as keyof typeof config.behaviorSettings
                        ] as boolean
                      }
                      onChange={(e) =>
                        updateBehaviorSetting(key, e.target.checked)
                      }
                      className="mt-0.5 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Save Button - Bottom */}
      <GlassCard>
        <div className="p-4 sm:p-6 flex justify-end gap-3">
          <button
            className="px-4 sm:px-6 py-2 sm:py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save All Changes</span>
            <span className="sm:hidden">Save</span>
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default AgentTraining;
