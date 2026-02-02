/**
 * Mock Convex Data Model types for development
 * 
 * In production, run `npx convex dev` to generate real types.
 */

// Generic document type
export type Doc<TableName extends string> = {
  _id: string;
  _creationTime: number;
} & (
  TableName extends "agents" ? {
    name: string;
    role: string;
    status: "idle" | "active" | "blocked";
    sessionKey: string;
    level: "intern" | "specialist" | "lead";
    currentTaskId?: string;
    lastHeartbeat?: number;
    avatarUrl?: string;
  } :
  TableName extends "tasks" ? {
    title: string;
    description: string;
    status: "inbox" | "assigned" | "in_progress" | "review" | "done" | "blocked";
    assigneeIds: string[];
    createdBy: string;
    priority: "low" | "medium" | "high" | "urgent";
    tags: string[];
    dueDate?: number;
    blockedReason?: string;
  } :
  TableName extends "activities" ? {
    type: string;
    agentId: string;
    taskId?: string;
    message: string;
    agent?: { name: string };
  } :
  TableName extends "messages" ? {
    taskId: string;
    fromAgentId: string;
    content: string;
    attachments: string[];
    mentions: string[];
  } :
  TableName extends "documents" ? {
    title: string;
    content: string;
    type: "deliverable" | "research" | "protocol" | "other";
    taskId?: string;
    createdBy: string;
    version?: number;
  } :
  TableName extends "notifications" ? {
    mentionedAgentId: string;
    sourceAgentId: string;
    taskId?: string;
    messageId?: string;
    content: string;
    type: "mention" | "thread_reply" | "assignment";
    delivered: boolean;
    deliveredAt?: number;
  } :
  TableName extends "subscriptions" ? {
    agentId: string;
    taskId: string;
    notifyOnReply?: boolean;
    notifyOnStatusChange?: boolean;
    mutedUntil?: number;
  } :
  Record<string, unknown>
);

// ID type
export type Id<TableName extends string> = string & { __tableName: TableName };
