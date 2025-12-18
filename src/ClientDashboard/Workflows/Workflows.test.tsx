import React from 'react';
import GlassCard from '../../components/GlassCard';
import { useAgent } from '../../contexts/AgentContext';
import { useAuth } from '../../contexts/AuthContext';
import { isDeveloperUser, shouldShowEmptyStates } from '../../lib/utils';
import { Zap } from 'lucide-react';

const Workflows = () => {
  const { agents } = useAgent();
  const { user } = useAuth();
  const isDeveloper = isDeveloperUser(user?.email);
  const showEmptyStates = shouldShowEmptyStates(user?.email);

  // Show empty state for demo user
  if (showEmptyStates) {
    return (
      <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
        <GlassCard>
          <div className="p-6 sm:p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 common-bg-icons rounded-full flex items-center justify-center">
              <Zap className="w-8 h-8 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              Workflows
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              This is where you would create and manage automated workflows for your AI employees. Currently showing empty state for demo purposes.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No workflows available in demo mode
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <GlassCard>
        <div className="p-6 sm:p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
            Workflows - Under Construction
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The full workflows feature is currently being developed.
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default Workflows;