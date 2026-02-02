"use client";

import { TaskCard } from "./TaskCard";
import { Doc } from "../../convex/_generated/dataModel";

type Task = Doc<"tasks">;
type Agent = Doc<"agents">;

interface TaskBoardProps {
  tasks: Task[];
  agents: Agent[];
}

const COLUMNS = [
  { id: "inbox", title: "Inbox", color: "bg-gray-100" },
  { id: "assigned", title: "Assigned", color: "bg-blue-50" },
  { id: "in_progress", title: "In Progress", color: "bg-yellow-50" },
  { id: "review", title: "Review", color: "bg-purple-50" },
  { id: "done", title: "Done", color: "bg-green-50" },
] as const;

export function TaskBoard({ tasks, agents }: TaskBoardProps) {
  // Group tasks by status
  const tasksByStatus = COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = tasks.filter((t) => t.status === col.id);
      return acc;
    },
    {} as Record<string, Task[]>
  );

  // Get blocked tasks separately
  const blockedTasks = tasks.filter((t) => t.status === "blocked");

  // Create agent lookup map
  const agentMap = new Map(agents.map((a) => [a._id, a]));

  return (
    <div className="space-y-6">
      {/* Main Kanban Board */}
      <div className="grid grid-cols-5 gap-4">
        {COLUMNS.map((column) => (
          <div key={column.id} className={`kanban-column ${column.color}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-semibold text-ink">
                {column.title}
              </h3>
              <span className="text-xs text-slate bg-white px-2 py-0.5 rounded-full">
                {tasksByStatus[column.id]?.length || 0}
              </span>
            </div>
            
            <div className="space-y-2">
              {tasksByStatus[column.id]?.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  assignees={task.assigneeIds
                    .map((id) => agentMap.get(id))
                    .filter(Boolean) as Agent[]}
                />
              ))}
              
              {tasksByStatus[column.id]?.length === 0 && (
                <div className="text-center py-8 text-slate/50 text-sm">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Blocked Tasks Section */}
      {blockedTasks.length > 0 && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-100">
          <h3 className="font-serif font-semibold text-red-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Blocked ({blockedTasks.length})
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {blockedTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                assignees={task.assigneeIds
                  .map((id) => agentMap.get(id))
                  .filter(Boolean) as Agent[]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
