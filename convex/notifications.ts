import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get undelivered notifications for all agents
 */
export const getUndelivered = query({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_delivered", (q) => q.eq("delivered", false))
      .collect();

    // Enrich with agent info
    return await Promise.all(
      notifications.map(async (n) => {
        const mentionedAgent = await ctx.db.get(n.mentionedAgentId);
        const sourceAgent = await ctx.db.get(n.sourceAgentId);
        return { ...n, mentionedAgent, sourceAgent };
      })
    );
  },
});

/**
 * Get undelivered notifications for a specific agent
 */
export const getUndeliveredForAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_agent_delivered", (q) =>
        q.eq("mentionedAgentId", args.agentId).eq("delivered", false)
      )
      .collect();
  },
});

/**
 * Get all notifications for an agent (delivered and undelivered)
 */
export const listForAgent = query({
  args: { 
    agentId: v.id("agents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_mentioned_agent", (q) => q.eq("mentionedAgentId", args.agentId))
      .order("desc")
      .take(limit);

    return await Promise.all(
      notifications.map(async (n) => {
        const sourceAgent = await ctx.db.get(n.sourceAgentId);
        const task = n.taskId ? await ctx.db.get(n.taskId) : null;
        return { ...n, sourceAgent, task };
      })
    );
  },
});

/**
 * Mark a notification as delivered
 */
export const markDelivered = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      delivered: true,
      deliveredAt: Date.now(),
    });
  },
});

/**
 * Mark all notifications for an agent as delivered
 */
export const markAllDeliveredForAgent = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const undelivered = await ctx.db
      .query("notifications")
      .withIndex("by_agent_delivered", (q) =>
        q.eq("mentionedAgentId", args.agentId).eq("delivered", false)
      )
      .collect();

    const now = Date.now();
    for (const notification of undelivered) {
      await ctx.db.patch(notification._id, {
        delivered: true,
        deliveredAt: now,
      });
    }

    return { marked: undelivered.length };
  },
});

/**
 * Create a notification manually
 */
export const create = mutation({
  args: {
    mentionedAgentId: v.id("agents"),
    sourceAgentId: v.id("agents"),
    taskId: v.optional(v.id("tasks")),
    messageId: v.optional(v.id("messages")),
    content: v.string(),
    type: v.union(
      v.literal("mention"),
      v.literal("thread_reply"),
      v.literal("assignment")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      mentionedAgentId: args.mentionedAgentId,
      sourceAgentId: args.sourceAgentId,
      taskId: args.taskId,
      messageId: args.messageId,
      content: args.content,
      type: args.type,
      delivered: false,
    });
  },
});

/**
 * Delete old delivered notifications (cleanup)
 */
export const cleanup = mutation({
  args: { 
    olderThanDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.olderThanDays || 7;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const oldNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_delivered", (q) => q.eq("delivered", true))
      .collect();

    let deleted = 0;
    for (const n of oldNotifications) {
      if (n.deliveredAt && n.deliveredAt < cutoff) {
        await ctx.db.delete(n._id);
        deleted++;
      }
    }

    return { deleted };
  },
});
