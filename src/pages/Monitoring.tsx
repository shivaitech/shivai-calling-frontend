import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import Slider from 'react-slick';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  MessageSquare, 
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Filter,
  Search,
  ChevronDown
} from 'lucide-react';

const Monitoring = () => {
  const [timeRange, setTimeRange] = useState('7d');

  const stats = [
    {
      title: 'Calls Today',
      value: '247',
      change: '+12%',
      trend: 'up',
      icon: MessageSquare,
      color: 'blue'
    },
    {
      title: 'Success Rate',
      value: '94.2%',
      change: '+2.1%',
      trend: 'up',
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Avg Duration',
      value: '3m 24s',
      change: '-15s',
      trend: 'down',
      icon: Clock,
      color: 'purple'
    },
    {
      title: 'Active Users',
      value: '1,847',
      change: '+8%',
      trend: 'up',
      icon: Users,
      color: 'orange'
    }
  ];

  const topIntents = [
    { name: 'Pricing Inquiry', count: 89, percentage: 36 },
    { name: 'Product Demo', count: 67, percentage: 27 },
    { name: 'Support Request', count: 45, percentage: 18 },
    { name: 'Booking Request', count: 32, percentage: 13 },
    { name: 'General Info', count: 15, percentage: 6 }
  ];

  const recentConversations = [
    {
      id: 1,
      time: '2 min ago',
      agent: 'Customer Support Bot',
      caller: 'User-****7892',
      outcome: 'Success',
      duration: '4m 12s',
      intent: 'Pricing Inquiry'
    },
    {
      id: 2,
      time: '5 min ago',
      agent: 'Sales Assistant',
      caller: 'User-****3456',
      outcome: 'Success',
      duration: '2m 45s',
      intent: 'Product Demo'
    },
    {
      id: 3,
      time: '8 min ago',
      agent: 'Customer Support Bot',
      caller: 'User-****9012',
      outcome: 'Failed',
      duration: '1m 23s',
      intent: 'Support Request'
    },
    {
      id: 4,
      time: '12 min ago',
      agent: 'Sales Assistant',
      caller: 'User-****5678',
      outcome: 'Success',
      duration: '6m 18s',
      intent: 'Booking Request'
    },
    {
      id: 5,
      time: '15 min ago',
      agent: 'Customer Support Bot',
      caller: 'User-****2345',
      outcome: 'Success',
      duration: '3m 56s',
      intent: 'General Info'
    }
  ];

  const callTimeline = [
    { hour: '00:00', calls: 12 },
    { hour: '01:00', calls: 8 },
    { hour: '02:00', calls: 5 },
    { hour: '03:00', calls: 3 },
    { hour: '04:00', calls: 7 },
    { hour: '05:00', calls: 15 },
    { hour: '06:00', calls: 28 },
    { hour: '07:00', calls: 45 },
    { hour: '08:00', calls: 67 },
    { hour: '09:00', calls: 89 },
    { hour: '10:00', calls: 92 },
    { hour: '11:00', calls: 78 },
    { hour: '12:00', calls: 85 },
    { hour: '13:00', calls: 76 },
    { hour: '14:00', calls: 82 },
    { hour: '15:00', calls: 94 },
    { hour: '16:00', calls: 87 },
    { hour: '17:00', calls: 73 },
    { hour: '18:00', calls: 56 },
    { hour: '19:00', calls: 42 },
    { hour: '20:00', calls: 35 },
    { hour: '21:00', calls: 28 },
    { hour: '22:00', calls: 19 },
    { hour: '23:00', calls: 14 }
  ];

  const maxCalls = Math.max(...callTimeline.map(item => item.calls));

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Mobile-First Header - App-like compact design */}
      <div className="mb-4 sm:mb-6 px-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white mb-1 sm:mb-2 break-words max-w-full">
              Monitoring & Analytics 📊
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 break-words max-w-full">
              Track performance and analyze conversation insights
            </p>
          </div>

          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 sm:px-4 py-2 bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm appearance-none pr-10 touch-manipulation min-w-0"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <button className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm touch-manipulation">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section - Mobile Slider, Desktop Grid */}
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
                      <TrendingUp className={`w-2.5 h-2.5 ${
                        stat.trend === 'up' ? 'text-green-500' : 'text-red-500 rotate-180'
                      }`} />
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
                    stat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20' :
                    'bg-orange-100 dark:bg-orange-900/20'
                  }`}>
                    <stat.icon className={`w-4 sm:w-6 h-4 sm:h-6 ${
                      stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                      stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      stat.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                      'text-orange-600 dark:text-orange-400'
                    }`} />
                  </div>
                  <div className={`flex items-center gap-1 ${
                    stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    <TrendingUp className={`w-3 sm:w-4 h-3 sm:h-4 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                    <span className="text-xs sm:text-sm font-medium hidden sm:inline">{stat.change}</span>
                  </div>
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Call Timeline - Mobile Optimized */}
        <div className="xl:col-span-2">
          <GlassCard>
            <div className="p-3 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
                Call Timeline (24h)
              </h3>
              <div className="h-40 sm:h-48 lg:h-64 flex items-end justify-between gap-0.5 sm:gap-1 overflow-x-auto touch-manipulation">
                {callTimeline.map((item, index) => (
                  <div key={index} className="flex flex-col items-center group">
                    <div
                      className="w-1.5 sm:w-2 lg:w-3 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-600 hover:to-blue-500 transition-colors cursor-pointer touch-manipulation"
                      style={{ height: `${(item.calls / maxCalls) * 120}px` }}
                      title={`${item.hour}: ${item.calls} calls`}
                    ></div>
                    {index % 6 === 0 && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-2 rotate-45 origin-left">
                        {item.hour}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {/* Mobile scroll indicator */}
              <div className="block sm:hidden text-center mt-3">
                <p className="text-xs text-slate-400">Swipe to see more data →</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Top Intents - Mobile Optimized */}
        <GlassCard>
          <div className="p-3 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
              Top Intents
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {topIntents.map((intent, index) => (
                <div key={index} className="flex items-center justify-between touch-manipulation">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white truncate pr-2">
                        {intent.name}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex-shrink-0">
                        {intent.count}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${intent.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Outcomes Overview - Mobile Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <GlassCard>
          <div className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
              Call Outcomes
            </h3>
            <div className="flex items-center justify-center">
              <div className="relative w-36 h-36 sm:w-48 sm:h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${94.2 * 2.51} ${(100 - 94.2) * 2.51}`}
                    className="text-green-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">94.2%</div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Success</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Success (233)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Failed (14)</span>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
              Performance Metrics
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg touch-manipulation">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Avg Response Time</span>
                <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white">1.2s</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg touch-manipulation">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Resolution Rate</span>
                <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white">87.3%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg touch-manipulation">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Customer Satisfaction</span>
                <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white">4.6/5</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg touch-manipulation">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Escalation Rate</span>
                <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white">3.2%</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Recent Conversations - Mobile Optimized */}
      <GlassCard>
        <div className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
              Recent Conversations
            </h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm w-full touch-manipulation"
                />
              </div>
              <button className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors touch-manipulation">
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filter</span>
              </button>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="block md:hidden space-y-3">
            {recentConversations.map((conversation) => (
              <div key={conversation.id} className="p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {conversation.outcome === 'Success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${
                        conversation.outcome === 'Success' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {conversation.outcome}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {conversation.time}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                      {conversation.agent}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {conversation.caller} • {conversation.duration}
                    </p>
                  </div>
                  <button className="flex items-center gap-1 px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-xs touch-manipulation">
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                    {conversation.intent}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 text-sm">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 text-sm">Agent</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 text-sm">Caller</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 text-sm">Intent</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 text-sm">Outcome</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 text-sm">Duration</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentConversations.map((conversation) => (
                  <tr key={conversation.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">
                      {conversation.time}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 dark:text-white text-sm">
                        {conversation.agent}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">
                      {conversation.caller}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                        {conversation.intent}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {conversation.outcome === 'Success' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          conversation.outcome === 'Success' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {conversation.outcome}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">
                      {conversation.duration}
                    </td>
                    <td className="py-3 px-4">
                      <button className="flex items-center gap-1 px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm touch-manipulation">
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Monitoring;