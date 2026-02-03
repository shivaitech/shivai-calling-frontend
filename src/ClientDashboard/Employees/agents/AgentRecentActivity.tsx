import React from "react";
import GlassCard from "../../../components/GlassCard";

interface Activity {
  time: string;
  action: string;
  status: "success" | "warning" | "info";
}

interface AgentRecentActivityProps {
  activities?: Activity[];
}

const AgentRecentActivity: React.FC<AgentRecentActivityProps> = ({
  activities = [
    {
      time: "2 min ago",
      action: "Handled customer inquiry about pricing",
      status: "success",
    },
    {
      time: "5 min ago",
      action: "Successfully scheduled appointment",
      status: "success",
    },
    {
      time: "12 min ago",
      action: "Escalated complex technical issue",
      status: "warning",
    },
    {
      time: "1 hour ago",
      action: "Completed product explanation call",
      status: "success",
    },
    {
      time: "2 hours ago",
      action: "Updated knowledge base integration",
      status: "info",
    },
  ],
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <GlassCard>
      <div className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white mb-3 sm:mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3 sm:space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div
                  className={`w-2 h-2 rounded-full ${getStatusColor(
                    activity.status
                  )}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 dark:text-white font-medium">
                  {activity.action}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};

export default AgentRecentActivity;
