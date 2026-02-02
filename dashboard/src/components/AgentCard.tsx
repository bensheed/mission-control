"use client";

import { formatDistanceToNow } from "date-fns";
import { Circle, Clock, AlertCircle } from "lucide-react";
import clsx from "clsx";
import { Doc } from "../../convex/_generated/dataModel";

type Agent = Doc<"agents">;
type Task = Doc<"tasks"> | null;

interface AgentCardProps {
  agent: Agent;
  currentTask?: Task;
}

const statusColors = {
  idle: "text-gray-400",
  active: "text-green-500",
  blocked: "text-red-500",
};

const statusBgColors = {
  idle: "bg-gray-100",
  active: "bg-green-100",
  blocked: "bg-red-100",
};

const levelBadges = {
  intern: "bg-gray-100 text-gray-600",
  specialist: "bg-blue-100 text-blue-700",
  lead: "bg-purple-100 text-purple-700",
};

export function AgentCard({ agent, currentTask }: AgentCardProps) {
  const lastHeartbeat = agent.lastHeartbeat
    ? formatDistanceToNow(agent.lastHeartbeat, { addSuffix: true })
    : "Never";

  return (
    <div className="bg-white rounded-lg border border-sand p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-ink text-cream flex items-center justify-center font-semibold">
            {agent.name[0]}
          </div>
          
          {/* Name & Role */}
          <div>
            <h4 className="font-medium text-ink flex items-center gap-2">
              {agent.name}
              <span className={clsx("text-xs px-1.5 py-0.5 rounded", levelBadges[agent.level])}>
                {agent.level}
              </span>
            </h4>
            <p className="text-xs text-slate">{agent.role}</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className={clsx("flex items-center gap-1 text-xs", statusColors[agent.status])}>
          <Circle size={8} fill="currentColor" />
          <span className="capitalize">{agent.status}</span>
        </div>
      </div>

      {/* Current Task */}
      {currentTask ? (
        <div className={clsx("rounded-md p-2 mb-3", statusBgColors[agent.status])}>
          <p className="text-xs text-slate mb-1">Working on:</p>
          <p className="text-sm font-medium text-ink line-clamp-1">
            {currentTask.title}
          </p>
        </div>
      ) : (
        <div className="bg-sand/50 rounded-md p-2 mb-3">
          <p className="text-xs text-slate">No active task</p>
        </div>
      )}

      {/* Blocked reason */}
      {agent.status === "blocked" && (
        <div className="flex items-start gap-2 text-red-700 text-xs bg-red-50 p-2 rounded mb-3">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>This agent is blocked. Check the task for details.</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate/70 pt-2 border-t border-sand/50">
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>Last heartbeat {lastHeartbeat}</span>
        </div>
        <span className="font-mono text-[10px] bg-sand px-1.5 py-0.5 rounded">
          {agent.sessionKey.split(":")[1]}
        </span>
      </div>
    </div>
  );
}
