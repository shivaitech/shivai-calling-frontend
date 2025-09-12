import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { useAgent } from '../contexts/AgentContext';
import { 
  Brain, 
  Upload, 
  FileText, 
  Database, 
  Target, 
  Play, 
  CheckCircle,
  AlertCircle,
  BarChart3,
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  Zap,
  Book,
  Lightbulb,
  Settings,
  Download,
  ChevronDown,
  ArrowLeft,
  Bot
} from 'lucide-react';

const Training = () => {
  const { agents, currentAgent } = useAgent();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  // Get agent ID from URL params or current agent
  const agentIdFromUrl = params.id;
  const [selectedAgent, setSelectedAgent] = useState(agentIdFromUrl || currentAgent?.id || '');
  
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [activeTab, setActiveTab] = useState('knowledge');

  const selectedAgentData = agents.find(agent => agent.id === selectedAgent);

  const trainingTabs = [
    { id: 'knowledge', label: 'Knowledge Base', icon: Database },
    { id: 'examples', label: 'Training Examples', icon: MessageSquare },
    { id: 'intents', label: 'Intent Training', icon: Target },
    { id: 'testing', label: 'Testing & Validation', icon: CheckCircle }
  ];

  const knowledgeStats = [
    { label: 'Documents', value: '24', icon: FileText, color: 'blue' },
    { label: 'FAQ Items', value: '156', icon: Lightbulb, color: 'green' },
    { label: 'Training Examples', value: '89', icon: MessageSquare, color: 'purple' },
    { label: 'Intents Trained', value: '12', icon: Target, color: 'orange' }
  ];

  const trainingMetrics = [
    { label: 'Accuracy Score', value: '94.2%', change: '+2.1%', trend: 'up' },
    { label: 'Response Time', value: '1.2s', change: '-0.3s', trend: 'down' },
    { label: 'Confidence Level', value: '87.5%', change: '+5.2%', trend: 'up' },
    { label: 'Intent Recognition', value: '91.8%', change: '+1.4%', trend: 'up' }
  ];

  const handleStartTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="space-y-6 w-full">
      <div className="mb-6">
        <button
          onClick={() => navigate('/agents')}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Agent Management
        </button>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Training Center 🧠
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Train your AI agents with knowledge, examples, and validation
        </p>
      </div>

      {/* Prominent Agent Selection */}
      <GlassCard>
        <div className="p-6">
          {selectedAgentData ? (
            <div className="space-y-6">
              {/* Current Agent Display */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                      Training: {selectedAgentData.name}
                    </h2>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-slate-600 dark:text-slate-400">
                        {selectedAgentData.language} • {selectedAgentData.persona}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedAgentData.status === 'Published' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : selectedAgentData.status === 'Training'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {selectedAgentData.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white appearance-none pr-10 font-medium"
                  >
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-600 dark:text-blue-400 pointer-events-none" />
                </div>
              </div>

              {/* Training Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {knowledgeStats.map((stat, index) => (
                  <div key={index} className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl border border-slate-200/50 dark:border-slate-600/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                        <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
                Select an Agent to Train
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                Choose an agent from your collection to start training with knowledge base, examples, and validation
              </p>
              <div className="max-w-sm mx-auto">
                <div className="relative">
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white appearance-none pr-10 font-medium text-center"
                  >
                    <option value="">Choose an agent...</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600 dark:text-blue-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {selectedAgent && selectedAgentData && (
        <>
          {/* Training Tabs */}
          <GlassCard>
            <div className="p-6">
              <div className="flex space-x-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl p-1 overflow-x-auto">
                {trainingTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Training Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <GlassCard>
                <div className="p-6">
                  {activeTab === 'knowledge' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                        Knowledge Base Management
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Upload Documents
                          </label>
                          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center">
                            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-600 dark:text-slate-400 mb-2">
                              Drop files here or click to upload
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
                              Supports PDF, DOC, TXT, CSV files (Max 10MB each)
                            </p>
                            <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                              Choose Files
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Manual Knowledge Entry
                          </label>
                          <textarea
                            placeholder="Enter knowledge, FAQs, policies, or any information your agent should know..."
                            rows={8}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'examples' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                        Training Examples
                      </h3>

                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
                          <h4 className="font-medium text-slate-800 dark:text-white mb-3">
                            Sample Conversations
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Provide example conversations to improve agent responses
                          </p>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Customer Input:
                              </label>
                              <input
                                type="text"
                                placeholder="What the customer might say..."
                                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Expected Response:
                              </label>
                              <textarea
                                placeholder="How the agent should respond..."
                                rows={3}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm resize-none"
                              />
                            </div>
                            <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm">
                              Add Example
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'intents' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                        Intent Training
                      </h3>

                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
                          <h4 className="font-medium text-slate-800 dark:text-white mb-3">
                            Configure Intents
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Train the agent to recognize specific intents and respond appropriately
                          </p>
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Intent name (e.g., 'pricing_inquiry')"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                            />
                            <textarea
                              placeholder="Example phrases for this intent..."
                              rows={3}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm resize-none"
                            />
                            <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm">
                              Add Intent
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'testing' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                        Testing & Validation
                      </h3>

                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
                          <h4 className="font-medium text-slate-800 dark:text-white mb-3">
                            Test Agent Response
                          </h4>
                          <div className="space-y-3">
                            <textarea
                              placeholder="Type a test message to see how your agent responds..."
                              rows={3}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm resize-none"
                            />
                            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                              Test Response
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {trainingMetrics.map((metric, index) => (
                            <div key={index} className="p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-800 dark:text-white">
                                  {metric.label}
                                </span>
                                <div className={`flex items-center gap-1 ${
                                  metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                                }`}>
                                  <TrendingUp className={`w-3 h-3 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
                                  <span className="text-xs">{metric.change}</span>
                                </div>
                              </div>
                              <p className="text-xl font-bold text-slate-800 dark:text-white">
                                {metric.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>

            {/* Training Sidebar */}
            <div className="space-y-6">
              <GlassCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                    Training Status
                  </h3>
                  
                  {!isTraining && trainingProgress === 0 && (
                    <div className="text-center">
                      <Brain className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Ready to train your agent with the provided knowledge and examples
                      </p>
                      <button
                        onClick={handleStartTraining}
                        className="w-full px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                      >
                        Start Training
                      </button>
                    </div>
                  )}

                  {(isTraining || trainingProgress > 0) && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Brain className="w-8 h-8 text-white" />
                        </div>
                        <p className="font-medium text-slate-800 dark:text-white mb-2">
                          {isTraining ? 'Training in Progress...' : 'Training Complete!'}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {trainingProgress}% Complete
                        </p>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${trainingProgress}%` }}
                        ></div>
                      </div>

                      {trainingProgress === 100 && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            <div>
                              <p className="font-medium text-green-800 dark:text-green-300">
                                Training Successful!
                              </p>
                              <p className="text-sm text-green-600 dark:text-green-400">
                                Your agent is now ready for deployment
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>

              <GlassCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                    Training Tips
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">1</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                          Upload comprehensive documentation
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Include FAQs, product info, and policies
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 dark:text-green-400 text-xs font-bold">2</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                          Provide conversation examples
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Show how to handle different scenarios
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">3</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                          Test thoroughly before publishing
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Use test mode to validate responses
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <Upload className="w-5 h-5" />
                      Bulk Upload Documents
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                      <Download className="w-5 h-5" />
                      Export Training Data
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                      <BarChart3 className="w-5 h-5" />
                      View Training Analytics
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </>
      )}

      {!selectedAgent && (
        <div className="text-center py-16">
          <Brain className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
          <h3 className="text-xl font-medium text-slate-600 dark:text-slate-400 mb-3">
            Select an agent to start training
          </h3>
          <p className="text-slate-500 dark:text-slate-500 max-w-md mx-auto">
            Choose an agent from the dropdown above to begin training with knowledge base, examples, and intent configuration
          </p>
        </div>
      )}
    </div>
  );
};

export default Training;