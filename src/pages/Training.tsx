import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { useAgent } from '../contexts/AgentContext';
import Slider from 'react-slick';
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

  // Slider settings for training stats carousel
  const statsSliderSettings = {
    dots: false,
    infinite: false,
    speed: 300,
    slidesToShow: 2.2,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 640, // sm
        settings: {
          slidesToShow: 2.2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 480, // xs
        settings: {
          slidesToShow: 1.8,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 768, // md and up - show grid instead
        settings: "unslick" as const
      }
    ]
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Mobile-First Header */}
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        <button
          onClick={() => navigate('/agents')}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-2 -m-2 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm sm:text-base font-medium">Back to Agents</span>
        </button>
        
        <div className="text-center sm:text-left space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-white">
            Training Center 🧠
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto sm:mx-0">
            Train your AI agents with knowledge, examples, and validation
          </p>
        </div>
      </div>

      {/* Mobile-First Agent Selection */}
      <div className="px-4 sm:px-0">
        <GlassCard>
          <div className="p-4 sm:p-6">
          {selectedAgentData ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Current Agent Display - Mobile Optimized */}
              <div className="space-y-4">
                {/* Agent Info Row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white truncate">
                        {selectedAgentData.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Training Session
                      </p>
                    </div>
                  </div>
                  {/* Mobile Agent Selector */}
                  <div className="relative w-full sm:w-auto sm:flex-shrink-0">
                    <select
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white appearance-none pr-8 sm:pr-10 font-medium text-sm sm:text-base"
                    >
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-600 dark:text-blue-400 pointer-events-none" />
                  </div>
                </div>

                {/* Agent Details Row - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span>{selectedAgentData.language}</span>
                    <span className="text-slate-400">•</span>
                    <span className="truncate">{selectedAgentData.persona}</span>
                  </div>
                  <span className={`inline-flex w-fit px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
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

              {/* Mobile-First Training Stats with Carousel */}
              <div className="training-stats-container">
                {/* Mobile Carousel */}
                <div className="block md:hidden">
                  <Slider {...statsSliderSettings} className="training-stats-slider">
                    {knowledgeStats.map((stat, index) => (
                      <div key={index} className="px-1.5">
                        <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl border border-slate-200/50 dark:border-slate-600/50 h-full">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${
                              stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
                              stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
                              stat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20' :
                              'bg-orange-100 dark:bg-orange-900/20'
                            }`}>
                              <stat.icon className={`w-4 h-4 ${
                                stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                                stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                                stat.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                                'text-orange-600 dark:text-orange-400'
                              }`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-lg font-bold text-slate-800 dark:text-white">{stat.value}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{stat.label}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Slider>
                </div>

                {/* Desktop Grid */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {knowledgeStats.map((stat, index) => (
                    <div key={index} className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl border border-slate-200/50 dark:border-slate-600/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
                          stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
                          stat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20' :
                          'bg-orange-100 dark:bg-orange-900/20'
                        }`}>
                          <stat.icon className={`w-5 h-5 ${
                            stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                            stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                            stat.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                            'text-orange-600 dark:text-orange-400'
                          }`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{stat.label}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-2 sm:mb-3">
                Select an Agent to Train
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 max-w-md mx-auto px-4">
                Choose an agent from your collection to start training with knowledge base, examples, and validation
              </p>
              <div className="max-w-xs sm:max-w-sm mx-auto">
                <div className="relative">
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white appearance-none pr-10 font-medium text-center text-sm sm:text-base"
                  >
                    <option value="">Choose an agent...</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
      </div>

      {selectedAgent && selectedAgentData && (
        <div className="px-4 sm:px-0 space-y-4 sm:space-y-6">
          {/* Enhanced Mobile-First Training Tabs */}
          <GlassCard>
            <div className="p-4 sm:p-6">
              <div className="relative">
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl p-1.5 overflow-x-auto scrollbar-hide">
                  {trainingTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 whitespace-nowrap text-xs sm:text-sm md:text-base font-medium min-w-fit touch-manipulation ${
                        activeTab === tab.id
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-lg scale-[1.02] border border-blue-200/50 dark:border-blue-500/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <tab.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden sm:inline text-xs sm:text-sm md:text-base">
                        {tab.label}
                      </span>
                      <span className="sm:hidden text-xs">
                        {tab.label.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
                
               
              </div>
            </div>
          </GlassCard>

          {/* Mobile-First Training Content */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <GlassCard>
                <div className="p-4 sm:p-6">
                  {activeTab === 'knowledge' && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
                        Knowledge Base Management
                      </h3>

                      <div className="space-y-4 sm:space-y-6">
                        {/* Mobile-Optimized File Upload */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Upload Documents
                          </label>
                          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 sm:p-8 text-center">
                            <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-2">
                              Drop files here or tap to upload
                            </p>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mb-4">
                              PDF, DOC, TXT, CSV files (Max 10MB each)
                            </p>
                            <button className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base font-medium touch-manipulation">
                              Choose Files
                            </button>
                          </div>
                        </div>

                        {/* Mobile-Optimized Text Area */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Manual Knowledge Entry
                          </label>
                          <textarea
                            placeholder="Enter knowledge, FAQs, policies, or any information your agent should know..."
                            rows={6}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white resize-none text-sm sm:text-base"
                          />
                          <div className="mt-2 flex justify-between items-center text-xs text-slate-500">
                            <span>Provide detailed, relevant information</span>
                            <button className="text-blue-500 hover:text-blue-600 font-medium">
                              Save Draft
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'examples' && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
                        Training Examples
                      </h3>

                      <div className="space-y-4">
                        <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
                          <h4 className="font-medium text-slate-800 dark:text-white mb-2 sm:mb-3">
                            Sample Conversations
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Provide example conversations to improve agent responses
                          </p>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Customer Input:
                              </label>
                              <input
                                type="text"
                                placeholder="What the customer might say..."
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500/20"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Expected Response:
                              </label>
                              <textarea
                                placeholder="How the agent should respond..."
                                rows={4}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm sm:text-base resize-none focus:outline-none focus:ring-2 focus:ring-green-500/20"
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base font-medium touch-manipulation">
                                Add Example
                              </button>
                              <button className="px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm sm:text-base font-medium">
                                Import CSV
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'intents' && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
                        Intent Training
                      </h3>

                      <div className="space-y-4">
                        <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
                          <h4 className="font-medium text-slate-800 dark:text-white mb-2 sm:mb-3">
                            Configure Intents
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Train the agent to recognize specific intents and respond appropriately
                          </p>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Intent Name
                              </label>
                              <input
                                type="text"
                                placeholder="e.g., pricing_inquiry, support_request"
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Example Phrases
                              </label>
                              <textarea
                                placeholder="Enter multiple example phrases, one per line..."
                                rows={4}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm sm:text-base resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm sm:text-base font-medium touch-manipulation">
                                Add Intent
                              </button>
                              <button className="px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm sm:text-base font-medium">
                                Templates
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'testing' && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">
                        Testing & Validation
                      </h3>

                      <div className="space-y-4 sm:space-y-6">
                        {/* Mobile-Optimized Test Interface */}
                        <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
                          <h4 className="font-medium text-slate-800 dark:text-white mb-2 sm:mb-3">
                            Test Agent Response
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Test Message
                              </label>
                              <textarea
                                placeholder="Type a test message to see how your agent responds..."
                                rows={3}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm sm:text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                            <button className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base font-medium touch-manipulation">
                              Test Response
                            </button>
                          </div>
                        </div>

                        {/* Mobile-First Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {trainingMetrics.map((metric, index) => (
                            <div key={index} className="p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-800 dark:text-white truncate">
                                  {metric.label}
                                </span>
                                <div className={`flex items-center gap-1 flex-shrink-0 ${
                                  metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                                }`}>
                                  <TrendingUp className={`w-3 h-3 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
                                  <span className="text-xs">{metric.change}</span>
                                </div>
                              </div>
                              <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
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

            {/* Mobile-First Training Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              <GlassCard>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                    Training Status
                  </h3>
                  
                  {!isTraining && trainingProgress === 0 && (
                    <div className="text-center">
                      <Brain className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                        Ready to train your agent with the provided knowledge and examples
                      </p>
                      <button
                        onClick={handleStartTraining}
                        className="w-full px-4 sm:px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm sm:text-base font-medium touch-manipulation"
                      >
                        Start Training
                      </button>
                    </div>
                  )}

                  {(isTraining || trainingProgress > 0) && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <p className="font-medium text-slate-800 dark:text-white mb-2 text-sm sm:text-base">
                          {isTraining ? 'Training in Progress...' : 'Training Complete!'}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          {trainingProgress}% Complete
                        </p>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 sm:h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 sm:h-3 rounded-full transition-all duration-500"
                          style={{ width: `${trainingProgress}%` }}
                        ></div>
                      </div>

                      {trainingProgress === 100 && (
                        <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-green-800 dark:text-green-300 text-sm sm:text-base">
                                Training Successful!
                              </p>
                              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
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
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                    Training Tips
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">1</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">
                          Upload comprehensive documentation
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Include FAQs, product info, and policies
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 dark:text-green-400 text-xs font-bold">2</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">
                          Provide conversation examples
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Show how to handle different scenarios
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">3</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">
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
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <button className="w-full flex items-center gap-3 p-3 sm:p-3.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium touch-manipulation">
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span>Bulk Upload Documents</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 sm:p-3.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium touch-manipulation">
                      <Download className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span>Export Training Data</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 sm:p-3.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium touch-manipulation">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span>View Training Analytics</span>
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      {!selectedAgent && (
        <div className="px-4 sm:px-0">
          <div className="text-center py-12 sm:py-16">
          <Brain className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4 sm:mb-6" />
          <h3 className="text-lg sm:text-xl font-medium text-slate-600 dark:text-slate-400 mb-2 sm:mb-3">
            Select an agent to start training
          </h3>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-500 max-w-md mx-auto">
            Choose an agent from the dropdown above to begin training with knowledge base, examples, and intent configuration
          </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;