import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { useAgent } from '../contexts/AgentContext';
import { useAuth } from '../contexts/AuthContext';
import { isDeveloperUser } from '../lib/utils';
import Slider from 'react-slick';
import { 
  Bot, 
  TrendingUp, 
  Clock, 
  Users, 
  MessageSquare, 
  CheckCircle,
  AlertCircle,
  Activity,
  Settings,
  BarChart3,
  Zap
} from 'lucide-react';

const Overview = () => {
  const { agents } = useAgent();
  const { user } = useAuth(); // Get user from AuthContext
  const navigate = useNavigate();
  
  // Add welcome message state
  const [welcomeMessage, setWelcomeMessage] = useState('');
  
  // Check if current user is developer
  const isDeveloper = isDeveloperUser(user?.email);

  // Check if first time user or returning user
  useEffect(() => {
    if (user) {
      const userName = user.fullName || 'User';

      console.log("user details",user)
      
      // For now, show welcome back for all users
      setWelcomeMessage(`Welcome back, ${userName}! 👋`);
    }
  }, [user]);

  const stats = isDeveloper ? [
    {
      title: 'Total Agents',
      value: agents.length,
      change: '+2 this month',
      icon: Bot,
      color: 'blue'
    },
    {
      title: 'Calls Today',
      value: '1,247',
      change: '+12% vs yesterday',
      icon: MessageSquare,
      color: 'green'
    },
    {
      title: 'Success Rate',
      value: '94.2%',
      change: '+2.1% this week',
      icon: CheckCircle,
      color: 'emerald'
    },
    {
      title: 'Avg Response Time',
      value: '1.2s',
      change: '-0.3s improved',
      icon: Clock,
      color: 'purple'
    }
  ] : [
    {
      title: 'Total Agents',
      value: 0,
      change: 'Get started',
      icon: Bot,
      color: 'blue'
    },
    {
      title: 'Calls Today',
      value: '0',
      change: 'No calls yet',
      icon: MessageSquare,
      color: 'green'
    },
    {
      title: 'Success Rate',
      value: '0%',
      change: 'No data',
      icon: CheckCircle,
      color: 'emerald'
    },
    {
      title: 'Avg Response Time',
      value: '0s',
      change: 'No data',
      icon: Clock,
      color: 'purple'
    }
  ];

  const recentActivity = isDeveloper ? [
    { time: '2 min ago', action: 'Agent "Customer Support Bot" handled 15 calls', status: 'success' },
    { time: '5 min ago', action: 'New workflow "Lead Qualification" activated', status: 'info' },
    { time: '12 min ago', action: 'Knowledge base updated with 3 new documents', status: 'info' },
    { time: '1 hour ago', action: 'Agent "Sales Assistant" published successfully', status: 'success' },
    { time: '2 hours ago', action: 'Billing: Payment processed for $299', status: 'success' }
  ] : [];

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Header - App-like compact design */}
      <div className="mb-4 sm:mb-6 px-1">
        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white mb-1 sm:mb-2 break-words max-w-full">
          {welcomeMessage || 'Loading...'}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 break-words max-w-full">
          Here's what's happening with your AI agents today.
        </p>
      </div>

      {/* Stats - Mobile Slider, Desktop Grid */}
      <div className="stats-section">
        {/* Mobile Slider (sm and below) */}
        <div className="block sm:hidden">
          <Slider
            dots={true}
            infinite={false}
            speed={300}
            slidesToShow={2.2}
            slidesToScroll={1}
            swipeToSlide={true}
            touchThreshold={10}
            arrows={false}
            className="mobile-stats-slider"
            customPaging={() => (
              <div className="w-2 h-2 bg-gray-300 rounded-full hover:bg-gray-600 transition-colors duration-200"></div>
            )}
            dotsClass="slick-dots !bottom-[-20px] !flex !justify-center !gap-2"
          >
            {stats.map((stat, index) => (
              <div key={index} className="px-1">
                <GlassCard hover>
                  <div className="p-3 min-h-[110px]">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-lg ${
                        stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
                        stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
                        stat.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/20' :
                        'bg-purple-100 dark:bg-purple-900/20'
                      }`}>
                        <stat.icon className={`w-4 h-4 ${
                          stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                          stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                          stat.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                          'text-purple-600 dark:text-purple-400'
                        }`} />
                      </div>
                      <TrendingUp className="w-2.5 h-2.5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-800 dark:text-white mb-1">
                        {stat.value}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 leading-tight">
                        {stat.title}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 leading-tight">
                        {stat.change}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            ))}
          </Slider>
        </div>

        {/* Desktop Grid (sm and above) */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {stats.map((stat, index) => (
            <GlassCard key={index} hover>
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 sm:p-3 rounded-xl ${
                    stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
                    stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
                    stat.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/20' :
                    'bg-purple-100 dark:bg-purple-900/20'
                  }`}>
                    <stat.icon className={`w-4 sm:w-6 h-4 sm:h-6 ${
                      stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                      stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      stat.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                      'text-purple-600 dark:text-purple-400'
                    }`} />
                  </div>
                  <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-xs sm:text-xs text-green-600 dark:text-green-400">
                    {stat.change}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Active Agents - Mobile Optimized */}
        <GlassCard>
          <div className="p-3 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
              Active Agents
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {(!isDeveloper || agents.length === 0) ? (
                <div className="text-center py-6 sm:py-8">
                  <Bot className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-2 sm:mb-3" />
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">No agents created yet</p>
                  {isDeveloper && (
                    <button 
                      onClick={() => navigate('/agents/create')}
                      className="mt-2 sm:mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-600 transition-colors duration-200"
                    >
                      Create Your First Agent
                    </button>
                  )}
                </div>
              ) : (
                agents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-700/30 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-7 sm:w-10 h-7 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3 sm:w-5 h-3 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-white truncate">
                          {agent.name}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                          {agent.language} • {agent.persona}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        agent.status === 'Published' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : agent.status === 'Training'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {agent.status}
                      </span>
                      <Activity className="w-3 sm:w-4 h-3 sm:h-4 text-green-500" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </GlassCard>

        {/* Recent Activity - Mobile Optimized */}
        <GlassCard>
          <div className="p-3 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-none overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <Activity className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-2 sm:mb-3" />
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">No recent activity</p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-1">
                    Start using your agents to see activity here
                  </p>
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-2 sm:gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 sm:mt-2 flex-shrink-0 ${
                      activity.status === 'success' ? 'bg-green-500' : 
                      activity.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-white leading-relaxed">
                        {activity.action}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions - Enhanced Mobile UI */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            Quick Actions
          </h3>
          
          {/* Mobile: Horizontal scroll layout */}
          <div className="block sm:hidden">
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              <button 
                onClick={() => isDeveloper && navigate('/agents/create')}
                disabled={!isDeveloper}
                className={`flex-shrink-0 w-48 p-4 text-left rounded-xl transition-all duration-300 border ${
                  isDeveloper 
                    ? 'bg-gradient-to-br from-blue-500/15 to-purple-500/15 hover:from-blue-500/25 hover:to-purple-500/25 border-blue-200/30 dark:border-blue-700/30 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Create Agent</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Setup new AI</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => isDeveloper && navigate('/monitoring')}
                disabled={!isDeveloper}
                className={`flex-shrink-0 w-48 p-4 text-left rounded-xl transition-all duration-300 border ${
                  isDeveloper 
                    ? 'bg-gradient-to-br from-green-500/15 to-emerald-500/15 hover:from-green-500/25 hover:to-emerald-500/25 border-green-200/30 dark:border-green-700/30 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Conversations</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">View activity</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => isDeveloper && navigate('/settings')}
                disabled={!isDeveloper}
                className={`flex-shrink-0 w-48 p-4 text-left rounded-xl transition-all duration-300 border ${
                  isDeveloper 
                    ? 'bg-gradient-to-br from-purple-500/15 to-pink-500/15 hover:from-purple-500/25 hover:to-pink-500/25 border-purple-200/30 dark:border-purple-700/30 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Settings</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Manage team</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => isDeveloper && navigate('/training')}
                disabled={!isDeveloper}
                className={`flex-shrink-0 w-48 p-4 text-left rounded-xl transition-all duration-300 border ${
                  isDeveloper 
                    ? 'bg-gradient-to-br from-orange-500/15 to-red-500/15 hover:from-orange-500/25 hover:to-red-500/25 border-orange-200/30 dark:border-orange-700/30 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Training</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Improve AI</p>
                  </div>
                </div>
              </button>
            </div>
            
            {/* Scroll indicator for mobile */}
            <div className="flex justify-center mt-3">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                <div className="w-6 h-1 bg-slate-600 rounded-full"></div>
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => isDeveloper && navigate('/agents/create')}
              disabled={!isDeveloper}
              className={`p-4 text-left rounded-xl transition-all duration-300 border ${
                isDeveloper 
                  ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border-blue-200/20 dark:border-blue-700/20 hover:shadow-lg transform hover:scale-[1.02] group cursor-pointer'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <p className="text-base font-medium text-slate-800 dark:text-white mb-1">Create Agent</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Set up new AI agent</p>
            </button>
            
            <button 
              onClick={() => isDeveloper && navigate('/monitoring')}
              disabled={!isDeveloper}
              className={`p-4 text-left rounded-xl transition-all duration-300 border ${
                isDeveloper 
                  ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border-green-200/20 dark:border-green-700/20 hover:shadow-lg transform hover:scale-[1.02] group cursor-pointer'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <MessageSquare className="w-8 h-8 text-green-600 dark:text-green-400 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <p className="text-base font-medium text-slate-800 dark:text-white mb-1">Conversations</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Monitor interactions</p>
            </button>
            
            <button 
              onClick={() => isDeveloper && navigate('/training')}
              disabled={!isDeveloper}
              className={`p-4 text-left rounded-xl transition-all duration-300 border ${
                isDeveloper 
                  ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20 border-orange-200/20 dark:border-orange-700/20 hover:shadow-lg transform hover:scale-[1.02] group cursor-pointer'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <Activity className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <p className="text-base font-medium text-slate-800 dark:text-white mb-1">Training</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Improve AI models</p>
            </button>
            
            <button 
              onClick={() => isDeveloper && navigate('/settings')}
              disabled={!isDeveloper}
              className={`p-4 text-left rounded-xl transition-all duration-300 border ${
                isDeveloper 
                  ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-purple-200/20 dark:border-purple-700/20 hover:shadow-lg transform hover:scale-[1.02] group cursor-pointer'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <Users className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <p className="text-base font-medium text-slate-800 dark:text-white mb-1">Team Settings</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Manage permissions</p>
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Overview;
