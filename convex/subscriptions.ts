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
        return { ...sub, task };
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
