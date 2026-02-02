"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TaskBoard } from "@/components/TaskBoard";
import { Header } from "@/components/Header";

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
    <main className="min-h-screen">
      <Header agentCount={agents.length} taskCount={tasks.length} />
      
      <div className="container mx-auto px-4 py-6">
        <TaskBoard tasks={tasks} agents={agents} />
      </div>
    </main>
  );
}
