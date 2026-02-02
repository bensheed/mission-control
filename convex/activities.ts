import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get recent activities (activity feed)
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const activities = await ctx.db
      .query("activities")
      .order("desc")
      .take(limit);

    // Enrich with agent and task info
    return await Promise.all(
      activities.map(async (activity) => {
        const agent = activity.agentId ? await ctx.db.get(activity.agentId) : null;
        const task = activity.taskId ? await ctx.db.get(activity.taskId) : null;
        return { ...activity, agent, task };
      })
    );
  },
});

/**
 * Get activities for a specific task
 */
export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .collect();

    return await Promise.all(
      activities.map(async (activity) => {
        const agent = activity.agentId ? await ctx.db.get(activity.agentId) : null;
        return { ...activity, agent };
      })
    );
  },
});

/**
 * Get activities for a specific agent
 */
export const listByAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .collect();

    return await Promise.all(
      activities.map(async (activity) => {
        const task = activity.taskId ? await ctx.db.get(activity.taskId) : null;
        return { ...activity, task };
      })
    );
  },
});

/**
 * Log a custom activity
 */
export const log = mutation({
  args: {
    type: v.union(
      v.literal("task_created"),
      v.literal("task_updated"),
      v.literal("task_status_changed"),
      v.literal("message_sent"),
      v.literal("document_created"),
      v.literal("agent_status_changed"),
      v.literal("agent_heartbeat")
    ),
    agentId: v.optional(v.id("agents")),
    taskId: v.optional(v.id("tasks")),
    documentId: v.optional(v.id("documents")),
    message: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      type: args.type,
      agentId: args.agentId,
      taskId: args.taskId,
      documentId: args.documentId,
      message: args.message,
      metadata: args.metadata,
    } as any);
  },
});

/**
 * Get activity summary for today (for daily standup)
 */
export const todaySummary = query({
  args: {},
  handler: async (ctx) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const activities = await ctx.db
      .query("activities")
      .order("desc")
      .collect();

    const todayActivities = activities.filter(
      (a) => a._creationTime >= startOfDay.getTime()
    );

    // Group by type
    const byType: Record<string, number> = {};
    for (const activity of todayActivities) {
      byType[activity.type] = (byType[activity.type] || 0) + 1;
    }

    // Group by agent
    const byAgent: Record<string, number> = {};
    for (const activity of todayActivities) {
      if (activity.agentId) {
        const agent = await ctx.db.get(activity.agentId);
        if (agent) {
          byAgent[agent.name] = (byAgent[agent.name] || 0) + 1;
        }
      }
    }

    return {
      total: todayActivities.length,
      byType,
      byAgent,
      activities: todayActivities.slice(0, 20), // Recent 20
    };
  },
});
