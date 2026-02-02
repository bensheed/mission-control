"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AgentCard } from "./AgentCard";
import { Users } from "lucide-react";

export function AgentGrid() {
  const agents = useQuery(api.agents.list, {});
  const tasks = useQuery(api.tasks.list, {});

  if (agents === undefined || tasks === undefined) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-sand p-4 animate-pulse"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-sand" />
              <div className="space-y-2">
                <div className="h-4 bg-sand rounded w-20" />
                <div className="h-3 bg-sand rounded w-16" />
              </div>
            </div>
            <div className="h-12 bg-sand rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Create task lookup by ID
  const taskMap = new Map(tasks.map((t) => [t._id, t]));

  // Group agents by status for ordering
  const activeAgents = agents.filter((a) => a.status === "active");
  const blockedAgents = agents.filter((a) => a.status === "blocked");
  const idleAgents = agents.filter((a) => a.status === "idle");

  // Show active and blocked first, then idle
  const sortedAgents = [...activeAgents, ...blockedAgents, ...idleAgents];

  // Count stats
  const stats = {
    active: activeAgents.length,
    blocked: blockedAgents.length,
    idle: idleAgents.length,
  };

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-slate" />
          <h3 className="font-serif font-semibold text-ink">Agent Squad</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-slate">{stats.active} active</span>
          </div>
          {stats.blocked > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-slate">{stats.blocked} blocked</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-slate">{stats.idle} idle</span>
          </div>
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {sortedAgents.map((agent) => (
          <AgentCard
            key={agent._id}
            agent={agent}
            currentTask={
              agent.currentTaskId ? taskMap.get(agent.currentTaskId) : null
            }
          />
        ))}
      </div>
    </div>
  );
}
