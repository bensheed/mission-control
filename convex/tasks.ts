import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * List all tasks, optionally filtered by status
 */
export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("inbox"),
        v.literal("assigned"),
        v.literal("in_progress"),
        v.literal("review"),
        v.literal("done"),
        v.literal("blocked")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    }
    return await ctx.db.query("tasks").collect();
  },
});

/**
 * Get a single task by ID with its messages
 */
export const get = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) return null;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_task", (q) => q.eq("taskId", args.id))
      .collect();

    // Get agent info for messages
    const messagesWithAgents = await Promise.all(
      messages.map(async (msg) => {
        const agent = await ctx.db.get(msg.fromAgentId);
        return { ...msg, agent };
      })
    );

    // Get assignee info
    const assignees = await Promise.all(
      task.assigneeIds.map((id) => ctx.db.get(id))
    );

    return {
      ...task,
      messages: messagesWithAgents,
      assignees: assignees.filter(Boolean),
    };
  },
});

/**
 * Get tasks assigned to a specific agent
 */
export const getByAssignee = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const allTasks = await ctx.db.query("tasks").collect();
    return allTasks.filter((task) => task.assigneeIds.includes(args.agentId));
  },
});

/**
 * Get tasks that need review
 */
export const needsReview = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "review"))
      .collect();
  },
});

/**
 * Get tasks completed today
 */
export const completedToday = query({
  args: {},
  handler: async (ctx) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const doneTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "done"))
      .collect();

    // Filter by creation time (we'd need _creationTime which Convex provides)
    return doneTasks.filter((task) => task._creationTime >= startOfDay.getTime());
  },
});

/**
 * Create a new task
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))
    ),
    tags: v.optional(v.array(v.string())),
    createdBy: v.string(),
    assigneeIds: v.optional(v.array(v.id("agents"))),
  },
  handler: async (ctx, args) => {
    const hasAssignees = args.assigneeIds && args.assigneeIds.length > 0;
    
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: hasAssignees ? "assigned" : "inbox",
      priority: args.priority || "medium",
      tags: args.tags || [],
      createdBy: args.createdBy,
      assigneeIds: args.assigneeIds || [],
    });

    // Log activity
    await ctx.db.insert("activities", {
      type: "task_created",
      agentId: args.assigneeIds?.[0], // First assignee, if any
      taskId,
      message: `Task created: ${args.title}`,
    } as any);

    // Create notifications for assignees
    if (args.assigneeIds) {
      for (const agentId of args.assigneeIds) {
        await ctx.db.insert("notifications", {
          mentionedAgentId: agentId,
          sourceAgentId: args.assigneeIds[0], // Will be overwritten properly
          taskId,
          content: `You've been assigned to: ${args.title}`,
          type: "assignment",
          delivered: false,
        } as any);

        // Auto-subscribe assignees to the task
        await ctx.db.insert("subscriptions", {
          agentId,
          taskId,
        });
      }
    }

    return taskId;
  },
});

/**
 * Update a task
 */
export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("inbox"),
        v.literal("assigned"),
        v.literal("in_progress"),
        v.literal("review"),
        v.literal("done"),
        v.literal("blocked")
      )
    ),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))
    ),
    assigneeIds: v.optional(v.array(v.id("agents"))),
    blockedReason: v.optional(v.string()),
    agentId: v.optional(v.id("agents")), // Who made the change
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.status !== undefined) updates.status = args.status;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.assigneeIds !== undefined) updates.assigneeIds = args.assigneeIds;
    if (args.blockedReason !== undefined) updates.blockedReason = args.blockedReason;

    await ctx.db.patch(args.id, updates);

    // Log status change activity
    if (args.status && args.status !== task.status) {
      await ctx.db.insert("activities", {
        type: "task_status_changed",
        agentId: args.agentId,
        taskId: args.id,
        message: `Task "${task.title}" moved to ${args.status}`,
        metadata: { from: task.status, to: args.status },
      } as any);
    }

    // Log other updates
    if (!args.status || args.status === task.status) {
      await ctx.db.insert("activities", {
        type: "task_updated",
        agentId: args.agentId,
        taskId: args.id,
        message: `Task "${task.title}" updated`,
      } as any);
    }
  },
});

/**
 * Assign agents to a task
 */
export const assign = mutation({
  args: {
    id: v.id("tasks"),
    agentIds: v.array(v.id("agents")),
    assignedBy: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    // Update task
    await ctx.db.patch(args.id, {
      assigneeIds: args.agentIds,
      status: task.status === "inbox" ? "assigned" : task.status,
    });

    // Create notifications and subscriptions for new assignees
    for (const agentId of args.agentIds) {
      if (!task.assigneeIds.includes(agentId)) {
        const agent = await ctx.db.get(agentId);
        
        await ctx.db.insert("notifications", {
          mentionedAgentId: agentId,
          sourceAgentId: args.assignedBy || agentId,
          taskId: args.id,
          content: `You've been assigned to: ${task.title}`,
          type: "assignment",
          delivered: false,
        });

        // Subscribe to task
        const existingSub = await ctx.db
          .query("subscriptions")
          .withIndex("by_agent_task", (q) => 
            q.eq("agentId", agentId).eq("taskId", args.id)
          )
          .first();
        
        if (!existingSub) {
          await ctx.db.insert("subscriptions", {
            agentId,
            taskId: args.id,
          });
        }

        // Log activity
        await ctx.db.insert("activities", {
          type: "task_updated",
          agentId,
          taskId: args.id,
          message: `${agent?.name || "Agent"} assigned to "${task.title}"`,
        });
      }
    }
  },
});
