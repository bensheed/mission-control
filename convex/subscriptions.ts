import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get all subscriptions for an agent
 */
export const listByAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    // Enrich with task info
    return await Promise.all(
      subs.map(async (sub) => {
        const task = await ctx.db.get(sub.taskId);
        const isMuted = sub.mutedUntil ? sub.mutedUntil > Date.now() : false;
        return { ...sub, task, isMuted };
      })
    );
  },
});

/**
 * Get all subscribers for a task
 */
export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    // Enrich with agent info
    return await Promise.all(
      subs.map(async (sub) => {
        const agent = await ctx.db.get(sub.agentId);
        return { ...sub, agent };
      })
    );
  },
});

/**
 * Check if an agent is subscribed to a task
 */
export const isSubscribed = query({
  args: { 
    agentId: v.id("agents"),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_agent_task", (q) =>
        q.eq("agentId", args.agentId).eq("taskId", args.taskId)
      )
      .first();
    
    return !!sub;
  },
});

/**
 * Subscribe an agent to a task
 */
export const subscribe = mutation({
  args: {
    agentId: v.id("agents"),
    taskId: v.id("tasks"),
    notifyOnReply: v.optional(v.boolean()),
    notifyOnStatusChange: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if already subscribed
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_agent_task", (q) =>
        q.eq("agentId", args.agentId).eq("taskId", args.taskId)
      )
      .first();

    if (existing) {
      return { subscribed: false, reason: "Already subscribed" };
    }

    await ctx.db.insert("subscriptions", {
      agentId: args.agentId,
      taskId: args.taskId,
      notifyOnReply: args.notifyOnReply ?? true,
      notifyOnStatusChange: args.notifyOnStatusChange ?? true,
    });

    return { subscribed: true };
  },
});

/**
 * Unsubscribe an agent from a task
 */
export const unsubscribe = mutation({
  args: {
    agentId: v.id("agents"),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_agent_task", (q) =>
        q.eq("agentId", args.agentId).eq("taskId", args.taskId)
      )
      .first();

    if (!sub) {
      return { unsubscribed: false, reason: "Not subscribed" };
    }

    await ctx.db.delete(sub._id);
    return { unsubscribed: true };
  },
});

/**
 * Get subscription count for a task
 */
export const countByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    
    return subs.length;
  },
});

/**
 * Update subscription preferences
 */
export const updatePreferences = mutation({
  args: {
    agentId: v.id("agents"),
    taskId: v.id("tasks"),
    notifyOnReply: v.optional(v.boolean()),
    notifyOnStatusChange: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_agent_task", (q) =>
        q.eq("agentId", args.agentId).eq("taskId", args.taskId)
      )
      .first();

    if (!sub) {
      throw new Error("Subscription not found");
    }

    const updates: Record<string, boolean> = {};
    if (args.notifyOnReply !== undefined) {
      updates.notifyOnReply = args.notifyOnReply;
    }
    if (args.notifyOnStatusChange !== undefined) {
      updates.notifyOnStatusChange = args.notifyOnStatusChange;
    }

    await ctx.db.patch(sub._id, updates);
    return { updated: true };
  },
});

/**
 * Mute a subscription temporarily
 */
export const mute = mutation({
  args: {
    agentId: v.id("agents"),
    taskId: v.id("tasks"),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_agent_task", (q) =>
        q.eq("agentId", args.agentId).eq("taskId", args.taskId)
      )
      .first();

    if (!sub) {
      throw new Error("Subscription not found");
    }

    const mutedUntil = Date.now() + args.durationMinutes * 60 * 1000;
    await ctx.db.patch(sub._id, { mutedUntil });
    return { mutedUntil };
  },
});

/**
 * Unmute a subscription
 */
export const unmute = mutation({
  args: {
    agentId: v.id("agents"),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_agent_task", (q) =>
        q.eq("agentId", args.agentId).eq("taskId", args.taskId)
      )
      .first();

    if (!sub) {
      throw new Error("Subscription not found");
    }

    await ctx.db.patch(sub._id, { mutedUntil: undefined });
    return { unmuted: true };
  },
});

/**
 * Get active (non-muted) subscribers for a task
 */
export const getActiveSubscribers = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    const now = Date.now();
    const activeSubs = subs.filter(
      (sub) => !sub.mutedUntil || sub.mutedUntil <= now
    );

    return await Promise.all(
      activeSubs.map(async (sub) => {
        const agent = await ctx.db.get(sub.agentId);
        return { ...sub, agent };
      })
    );
  },
});
