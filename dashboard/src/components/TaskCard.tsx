"use client";

import { Clock, Tag, AlertCircle } from "lucide-react";
import { Doc } from "../../convex/_generated/dataModel";
import clsx from "clsx";

type Task = Doc<"tasks">;
type Agent = Doc<"agents">;

interface TaskCardProps {
  task: Task;
  assignees: Agent[];
}

const priorityColors = {
  low: "border-l-gray-300",
  medium: "border-l-blue-400",
  high: "border-l-orange-400",
  urgent: "border-l-red-500",
};

export function TaskCard({ task, assignees }: TaskCardProps) {
  return (
    <div
      className={clsx(
        "kanban-card border-l-4",
        priorityColors[task.priority]
      )}
    >
      {/* Title */}
      <h4 className="font-medium text-ink text-sm mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-slate line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Blocked reason */}
      {task.status === "blocked" && task.blockedReason && (
        <div className="bg-red-50 text-red-700 text-xs p-2 rounded mb-3 flex items-start gap-1">
          <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{task.blockedReason}</span>
        </div>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs bg-sand text-slate px-1.5 py-0.5 rounded"
            >
              <Tag size={10} />
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-slate">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-sand/50">
        {/* Assignees */}
        <div className="flex -space-x-2">
          {assignees.slice(0, 3).map((agent) => (
            <div
              key={agent._id}
              className="w-6 h-6 rounded-full bg-ink text-cream text-xs flex items-center justify-center border-2 border-white"
              title={agent.name}
            >
              {agent.name[0]}
            </div>
          ))}
          {assignees.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-slate text-cream text-xs flex items-center justify-center border-2 border-white">
              +{assignees.length - 3}
            </div>
          )}
          {assignees.length === 0 && (
            <span className="text-xs text-slate/50">Unassigned</span>
          )}
        </div>

        {/* Priority badge */}
        <span
          className={clsx(
            "text-xs px-1.5 py-0.5 rounded capitalize",
            task.priority === "urgent" && "bg-red-100 text-red-700",
            task.priority === "high" && "bg-orange-100 text-orange-700",
            task.priority === "medium" && "bg-blue-100 text-blue-700",
            task.priority === "low" && "bg-gray-100 text-gray-600"
          )}
        >
          {task.priority}
        </span>
      </div>
    </div>
  );
}
