"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  CheckCircle,
  PlayCircle,
  AlertCircle,
  FileText,
  User,
  Activity,
} from "lucide-react";
import clsx from "clsx";

const activityIcons: Record<string, React.ElementType> = {
  task_created: CheckCircle,
  task_updated: Activity,
  task_status_changed: PlayCircle,
  message_sent: MessageSquare,
  document_created: FileText,
  agent_status_changed: User,
  agent_heartbeat: Activity,
};

const activityColors: Record<string, string> = {
  task_created: "text-green-600 bg-green-50",
  task_updated: "text-blue-600 bg-blue-50",
  task_status_changed: "text-yellow-600 bg-yellow-50",
  message_sent: "text-purple-600 bg-purple-50",
  document_created: "text-indigo-600 bg-indigo-50",
  agent_status_changed: "text-slate bg-sand",
  agent_heartbeat: "text-gray-400 bg-gray-50",
};

interface Activity {
  _id: string;
  type: string;
  message: string;
  _creationTime: number;
  agent?: { name: string };
}

interface ActivityFeedProps {
  limit?: number;
  showHeartbeats?: boolean;
}

export function ActivityFeed({ limit = 20, showHeartbeats = false }: ActivityFeedProps) {
  const activities = useQuery(api.activities.list, { limit: limit + 20 });

  if (activities === undefined) {
    return (
      <div className="bg-white rounded-lg border border-sand p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 bg-sand rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-sand rounded w-3/4" />
                <div className="h-3 bg-sand rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Filter out heartbeats if not showing them
  const filteredActivities = showHeartbeats
    ? activities
    : (activities as Activity[]).filter((a) => a.type !== "agent_heartbeat");

  const displayActivities = filteredActivities.slice(0, limit);

  return (
    <div className="bg-white rounded-lg border border-sand">
      <div className="p-4 border-b border-sand">
        <h3 className="font-serif font-semibold text-ink">Activity Feed</h3>
        <p className="text-xs text-slate mt-1">Real-time updates from the squad</p>
      </div>

      <div className="divide-y divide-sand/50 max-h-[500px] overflow-y-auto">
        {displayActivities.length === 0 ? (
          <div className="p-8 text-center text-slate/50">
            <Activity className="mx-auto mb-2" size={24} />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : (
          (displayActivities as Activity[]).map((activity) => {
            const Icon = activityIcons[activity.type] || Activity;
            const colorClass = activityColors[activity.type] || "text-slate bg-sand";

            return (
              <div
                key={activity._id}
                className="p-3 hover:bg-sand/30 transition-colors"
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div
                    className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      colorClass
                    )}
                  >
                    <Icon size={16} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink">{activity.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {activity.agent && (
                        <span className="text-xs font-medium text-slate">
                          {activity.agent.name}
                        </span>
                      )}
                      <span className="text-xs text-slate/50">
                        {formatDistanceToNow(activity._creationTime, {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
