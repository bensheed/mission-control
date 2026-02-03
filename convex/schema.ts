import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Mission Control Database Schema
 * 
 * Six tables power the entire system:
 * - agents: The 10 AI agents and their status
 * - tasks: Work items flowing through the system
 * - messages: Comments on tasks (agent discussions)
 * - activities: Activity feed for real-time visibility
 * - documents: Deliverables and research artifacts
 * - notifications: @mention alerts for agents
 * - subscriptions: Thread subscription tracking
 */

export default defineSchema({
  /**
   * Agents table - tracks all AI agents in the squad
   */
  agents: defineTable({
    name: v.string(),                    // "Jarvis", "Shuri", etc.
    role: v.string(),                    // "Squad Lead", "Product Analyst", etc.
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("blocked")
    ),
    currentTaskId: v.optional(v.id("tasks")),
    sessionKey: v.string(),              // "agent:main:main", etc.
    level: v.union(
      v.literal("intern"),
      v.literal("specialist"),
      v.literal("lead")
    ),
    avatarUrl: v.optional(v.string()),
    lastHeartbeat: v.optional(v.number()), // Unix timestamp of last heartbeat
  })
    .index("by_session_key", ["sessionKey"])
    .index("by_status", ["status"]),

  /**
   * Tasks table - work items that flow through the system
   * Lifecycle: inbox → assigned → in_progress → review → done
   */
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("blocked")
    ),
    assigneeIds: v.array(v.id("agents")),
    createdBy: v.string(),               // Human or agent name (for display)
    createdByAgentId: v.optional(v.id("agents")), // Agent ID if created by an agent
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    dueDate: v.optional(v.number()),     // Unix timestamp
    tags: v.array(v.string()),
    blockedReason: v.optional(v.string()), // Why it's blocked (if status is blocked)
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_assignee", ["assigneeIds"]),

  /**
   * Messages table - comments posted to task threads
   */
  messages: defineTable({
    taskId: v.id("tasks"),
    fromAgentId: v.id("agents"),
    content: v.string(),
    attachments: v.array(v.id("documents")),
    mentions: v.array(v.string()),        // Agent names mentioned in content
  })
    .index("by_task", ["taskId"]),

  /**
   * Activities table - feed of everything happening in the system
   */
  activities: defineTable({
    type: v.union(
      v.literal("task_created"),
      v.literal("task_updated"),
      v.literal("task_status_changed"),
      v.literal("message_sent"),
      v.literal("document_created"),
      v.literal("agent_status_changed"),
      v.literal("agent_heartbeat"),
      v.literal("notification_escalated")  // For Jarvis escalation
    ),
    agentId: v.optional(v.id("agents")),  // Optional for system-generated activities
    taskId: v.optional(v.id("tasks")),
    documentId: v.optional(v.id("documents")),
    message: v.string(),                  // Human-readable description
    metadata: v.optional(v.any()),        // Additional context (status changes, etc.)
  })
    .index("by_agent", ["agentId"])
    .index("by_task", ["taskId"])
    .index("by_type", ["type"]),

  /**
   * Documents table - deliverables, research, and other artifacts
   */
  documents: defineTable({
    title: v.string(),
    content: v.string(),                  // Markdown content
    type: v.union(
      v.literal("deliverable"),
      v.literal("research"),
      v.literal("protocol"),
      v.literal("other")
    ),
    taskId: v.optional(v.id("tasks")),    // Associated task (if any)
    createdBy: v.id("agents"),
    version: v.optional(v.number()),       // For tracking revisions
  })
    .index("by_task", ["taskId"])
    .index("by_type", ["type"])
    .index("by_creator", ["createdBy"]),

  /**
   * Notifications table - @mention alerts for agents
   */
  notifications: defineTable({
    mentionedAgentId: v.id("agents"),     // Who should receive this
    sourceAgentId: v.optional(v.id("agents")), // Who triggered it (optional for system notifications)
    taskId: v.optional(v.id("tasks")),    // Related task (if any)
    messageId: v.optional(v.id("messages")), // Related message (if any)
    content: v.string(),                  // The notification content
    type: v.union(
      v.literal("mention"),               // Direct @mention
      v.literal("thread_reply"),          // Reply in subscribed thread
      v.literal("assignment")             // Assigned to task
    ),
    delivered: v.boolean(),
    deliveredAt: v.optional(v.number()),  // Unix timestamp when delivered
    // Retry tracking
    retryCount: v.optional(v.number()),   // Number of delivery attempts
    failedAt: v.optional(v.number()),     // Unix timestamp when marked as failed
    escalatedToJarvis: v.optional(v.boolean()), // Whether this was escalated
  })
    .index("by_mentioned_agent", ["mentionedAgentId"])
    .index("by_delivered", ["delivered"])
    .index("by_agent_delivered", ["mentionedAgentId", "delivered"]),

  /**
   * Subscriptions table - tracks who's subscribed to which task threads
   */
  subscriptions: defineTable({
    agentId: v.id("agents"),
    taskId: v.id("tasks"),
    // Subscription preferences
    notifyOnReply: v.optional(v.boolean()),      // Notify on thread replies (default: true)
    notifyOnStatusChange: v.optional(v.boolean()), // Notify on task status changes (default: true)
    mutedUntil: v.optional(v.number()),          // Unix timestamp - mute until this time
  })
    .index("by_agent", ["agentId"])
    .index("by_task", ["taskId"])
    .index("by_agent_task", ["agentId", "taskId"]),

  /**
   * Agent Preferences table - global notification preferences per agent
   */
  agentPreferences: defineTable({
    agentId: v.id("agents"),
    // Notification routing preferences
    quietHoursStart: v.optional(v.number()),     // Hour (0-23) to start quiet hours
    quietHoursEnd: v.optional(v.number()),       // Hour (0-23) to end quiet hours
    // Alert priority thresholds
    urgentOnly: v.optional(v.boolean()),         // Only notify for urgent tasks
    minPriority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    // Channel preferences
    deliveryMethod: v.optional(v.union(
      v.literal("immediate"),                    // Deliver as soon as possible
      v.literal("batched"),                      // Batch notifications
      v.literal("heartbeat_only")                // Only deliver during heartbeat
    )),
    batchIntervalMinutes: v.optional(v.number()), // For batched delivery
    // Muting
    globalMuteUntil: v.optional(v.number()),     // Unix timestamp - global mute
    mutedTags: v.optional(v.array(v.string())),  // Don't notify for tasks with these tags
  })
    .index("by_agent", ["agentId"]),

  /**
   * Alert Rules table - custom routing rules for specific scenarios
   */
  alertRules: defineTable({
    agentId: v.id("agents"),
    name: v.string(),
    enabled: v.boolean(),
    // Matching conditions
    conditions: v.object({
      taskTags: v.optional(v.array(v.string())),      // Match tasks with these tags
      taskPriority: v.optional(v.array(v.string())), // Match these priorities
      sourceAgents: v.optional(v.array(v.id("agents"))), // Match from these agents
      notificationType: v.optional(v.array(v.string())), // Match notification types
    }),
    // Actions
    action: v.union(
      v.literal("allow"),           // Allow through (default)
      v.literal("block"),           // Block notification
      v.literal("escalate"),        // Mark as high priority
      v.literal("redirect")         // Redirect to another agent
    ),
    redirectToAgentId: v.optional(v.id("agents")), // For redirect action
    // Priority override
    priorityOverride: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
  })
    .index("by_agent", ["agentId"])
    .index("by_agent_enabled", ["agentId", "enabled"]),
});
