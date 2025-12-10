import React, { useState } from 'react';
import GlassCard from '../../components/GlassCard';
import { 
  CreditCard, 
  Clock, 
  Database, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';

const Billing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const currentPlan = {
    name: 'Professional',
    price: billingCycle === 'monthly' ? 299 : 2990,
    currency: 'USD',
    period: billingCycle === 'monthly' ? 'month' : 'year',
    status: 'Active',
    nextBilling: '2024-02-15',
    daysLeft: 12
  };

  const usage = {
    minutes: { used: 8420, limit: 10000, unit: 'minutes' },
    storage: { used: 2.4, limit: 5.0, unit: 'GB' },
    workflows: { used: 12, limit: 25, unit: 'workflows' },
    agents: { used: 3, limit: 10, unit: 'agents' }
  };

  const plans = [
    {
      name: 'Starter',
      price: { monthly: 99, yearly: 990 },
      features: [
        '2,500 minutes/month',
        '2 agents',
        '1 GB storage',
        '5 workflows',
        'Email support'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: { monthly: 299, yearly: 2990 },
      features: [
        '10,000 minutes/month',
        '10 agents',
        '5 GB storage',
        '25 workflows',
        'Priority support',
        'Advanced analytics'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: { monthly: 999, yearly: 9990 },
      features: [
        'Unlimited minutes',
        'Unlimited agents',
        '50 GB storage',
        'Unlimited workflows',
        'Dedicated support',
        'Custom integrations',
        'SLA guarantee'
      ],
      popular: false
    }
  ];

  const paymentMethods = [
    {
      id: 1,
      type: 'card',
      brand: 'Visa',
      last4: '4242',
      expiry: '12/26',
      isDefault: true
    },
    {
      id: 2,
      type: 'card',
      brand: 'Mastercard',
      last4: '8888',
      expiry: '08/25',
      isDefault: false
    }
  ];

  const invoices = [
    {
      id: 'INV-2024-001',
      date: '2024-01-15',
      amount: 299,
      status: 'Paid',
      period: 'Jan 2024'
    },
    {
      id: 'INV-2023-012',
      date: '2023-12-15',
      amount: 299,
      status: 'Paid',
      period: 'Dec 2023'
    },
    {
      id: 'INV-2023-011',
      date: '2023-11-15',
      amount: 299,
      status: 'Paid',
      period: 'Nov 2023'
    }
  ];

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'yellow';
    return 'green';
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
     

      {/* Current Plan & Status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <GlassCard>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Current Plan
              </h3>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                {currentPlan.status}
              </span>
            </div>
            
            <div className="text-center mb-4">
              <h4 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                {currentPlan.name}
              </h4>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                ${currentPlan.price}
                <span className="text-base sm:text-lg text-slate-500 dark:text-slate-400">
                  /{currentPlan.period}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Next billing:</span>
                <span className="text-slate-800 dark:text-white">{currentPlan.nextBilling}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Days remaining:</span>
                <span className="text-slate-800 dark:text-white">{currentPlan.daysLeft} days</span>
              </div>
            </div>

            <button className="common-button-bg w-full mt-4">
              Manage Plan
            </button>
          </div>
        </GlassCard>

        <div className="xl:col-span-2">
          <GlassCard>
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                Usage Overview
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(usage).map(([key, data]) => {
                  const percentage = getUsagePercentage(data.used, data.limit);
                  const color = getUsageColor(percentage);
                  
                  return (
                    <div key={key} className="p-3 sm:p-4 common-bg-icons rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 common-bg-icons rounded-lg flex items-center justify-center">
                          {key === 'minutes' && <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                          {key === 'storage' && <Database className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                          {key === 'workflows' && <Zap className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                          {key === 'agents' && <CheckCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                        </div>
                        <div>
                          <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-white capitalize">
                            {key}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            {data.used.toLocaleString()} / {data.limit.toLocaleString()} {data.unit}
                          </p>
                        </div>
                      </div>
                      
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            color === 'red' ? 'bg-red-500' :
                            color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {percentage.toFixed(1)}% used
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Plan Comparison */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Available Plans
            </h3>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hidden sm:inline">Billing cycle:</span>
              <div className="flex common-bg-icons rounded-lg p-1">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm transition-colors ${
                    billingCycle === 'monthly'
                      ? 'common-button-bg2'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm transition-colors ${
                    billingCycle === 'yearly'
                      ? 'common-button-bg2'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Yearly
                  <span className="ml-1 px-1 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs hidden sm:inline">
                    Save 17%
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-4 sm:p-6 rounded-2xl border-2 transition-all duration-200 ${
                  plan.popular
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-medium whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h4 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-2">
                    {plan.name}
                  </h4>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
                    ${plan.price[billingCycle as keyof typeof plan.price]}
                    <span className="text-base sm:text-lg text-slate-500 dark:text-slate-400">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-green-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full ${
                    plan.name === currentPlan.name
                      ? 'common-bg-icons cursor-not-allowed opacity-50'
                      : plan.popular
                      ? 'common-button-bg'
                      : 'common-button-bg2'
                  }`}
                  disabled={plan.name === currentPlan.name}
                >
                  {plan.name === currentPlan.name ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <GlassCard>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Payment Methods
              </h3>
              <button className="common-button-bg flex items-center gap-2 justify-center sm:justify-start">
                <Plus className="w-4 h-4" />
                <span>Add Card</span>
              </button>
            </div>

            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 common-bg-icons rounded-xl"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 common-bg-icons rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-white truncate">
                        {method.brand} •••• {method.last4}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                          Expires {method.expiry}
                        </p>
                        {method.isDefault && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs self-start">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end sm:justify-start">
                    <button className="common-bg-icons p-2 w-9 h-9 flex items-center justify-center rounded-lg touch-manipulation">
                      <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                    <button className="common-bg-icons p-2 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors touch-manipulation">
                      <Trash2 className="w-4 h-4 text-slate-600 dark:text-slate-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Recent Invoices */}
        <GlassCard>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Recent Invoices
              </h3>
              <button className="common-button-bg2 text-sm w-full sm:w-auto">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 common-bg-icons rounded-xl"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 dark:text-white text-sm sm:text-base">
                      {invoice.id}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {invoice.period} • {invoice.date}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="flex flex-col sm:text-right">
                      <p className="font-medium text-slate-800 dark:text-white text-sm sm:text-base">
                        ${invoice.amount}
                      </p>
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs self-start sm:self-end">
                        {invoice.status}
                      </span>
                    </div>
                    <button className="common-bg-icons p-2 w-9 h-9 flex items-center justify-center rounded-lg touch-manipulation flex-shrink-0">
                      <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Billing State Information */}
      <GlassCard>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            Account Status
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 common-bg-icons rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 common-bg-icons rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 dark:text-white">Active</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    All features available
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 common-bg-icons rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 common-bg-icons rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 dark:text-white">Grace Period</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    7 days inbound-only access
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 common-bg-icons rounded-xl sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 common-bg-icons rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 dark:text-white">Suspended</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Account disabled
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Billing;