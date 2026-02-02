import { Users, ListTodo } from "lucide-react";

interface HeaderProps {
  agentCount: number;
  taskCount: number;
}

export function Header({ agentCount, taskCount }: HeaderProps) {
  return (
    <header className="bg-white border-b border-sand">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ink rounded-lg flex items-center justify-center">
              <span className="text-cream font-bold text-lg">MC</span>
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-ink">
                Mission Control
              </h1>
              <p className="text-xs text-slate">AI Agent Squad Dashboard</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-slate">
              <Users size={16} />
              <span>{agentCount} Agents</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate">
              <ListTodo size={16} />
              <span>{taskCount} Tasks</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
