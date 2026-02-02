"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TaskBoard } from "@/components/TaskBoard";
import { Header } from "@/components/Header";
import { AgentGrid } from "@/components/AgentGrid";
import { ActivityFeed } from "@/components/ActivityFeed";

export default function Home() {
  const tasks = useQuery(api.tasks.list, {});
  const agents = useQuery(api.agents.list, {});

  if (tasks === undefined || agents === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate">Loading Mission Control...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-8">
      <Header agentCount={agents.length} taskCount={tasks.length} />
      
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Agent Status Grid */}
        <AgentGrid />

        {/* Main Content: Task Board + Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Task Board (3 columns) */}
          <div className="lg:col-span-3">
            <TaskBoard tasks={tasks} agents={agents} />
          </div>

          {/* Activity Feed (1 column) */}
          <div className="lg:col-span-1">
            <ActivityFeed limit={25} />
          </div>
        </div>
      </div>
    </main>
  );
}
