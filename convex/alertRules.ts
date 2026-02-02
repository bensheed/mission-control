import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get all alert rules for an agent
 */
export const listByAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alertRules")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();
  },
});

/**
 * Get enabled rules for an agent
 */
export const getEnabledByAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alertRules")
      .withIndex("by_agent_enabled", (q) =>
        q.eq("agentId", args.agentId).eq("enabled", true)
      )
      .collect();
  },
});

/**
 * Create a new alert rule
 */
export const create = mutation({
  args: {
    agentId: v.id("agents"),
    name: v.string(),
    enabled: v.optional(v.boolean()),
    conditions: v.object({
      taskTags: v.optional(v.array(v.string())),
      taskPriority: v.optional(v.array(v.string())),
      sourceAgents: v.optional(v.array(v.id("agents"))),
      notificationType: v.optional(v.array(v.string())),
    }),
    action: v.union(
      v.literal("allow"),
      v.literal("block"),
      v.literal("escalate"),
      v.literal("redirect")
    ),
    redirectToAgentId: v.optional(v.id("agents")),
    priorityOverride: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("alertRules", {
      agentId: args.agentId,
      name: args.name,
      enabled: args.enabled ?? true,
      conditions: args.conditions,
      action: args.action,
      redirectToAgentId: args.redirectToAgentId,
      priorityOverride: args.priorityOverride,
    });
  },
});

/**
 * Update an alert rule
 */
export const update = mutation({
  args: {
    id: v.id("alertRules"),
    name: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    conditions: v.optional(v.object({
      taskTags: v.optional(v.array(v.string())),
      taskPriority: v.optional(v.array(v.string())),
      sourceAgents: v.optional(v.array(v.id("agents"))),
      notificationType: v.optional(v.array(v.string())),
    })),
    action: v.optional(v.union(
      v.literal("allow"),
      v.literal("block"),
      v.literal("escalate"),
      v.literal("redirect")
    )),
    redirectToAgentId: v.optional(v.id("agents")),
    priorityOverride: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, cleanUpdates);
    return id;
  },
});

/**
 * Delete an alert rule
 */
export const remove = mutation({
  args: { id: v.id("alertRules") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { deleted: true };
  },
});

/**
 * Enable/disable a rule
 */
export const setEnabled = mutation({
  args: {
    id: v.id("alertRules"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { enabled: args.enabled });
    return { updated: true };
  },
});

/**
 * Evaluate alert rules for a notification
 * Returns the action to take and any modifications
 */
export const evaluate = query({
  args: {
    agentId: v.id("agents"),
    sourceAgentId: v.id("agents"),
    taskId: v.optional(v.id("tasks")),
    notificationType: v.string(),
  },
  handler: async (ctx, args) => {
    // Get enabled rules for this agent
    const rules = await ctx.db
      .query("alertRules")
      .withIndex("by_agent_enabled", (q) =>
        q.eq("agentId", args.agentId).eq("enabled", true)
      )
      .collect();

    if (rules.length === 0) {
      return { action: "allow", matchedRule: null };
    }

    // Get task details if available
    let task = null;
    if (args.taskId) {
      task = await ctx.db.get(args.taskId);
    }

    // Evaluate each rule
    for (const rule of rules) {
      const conditions = rule.conditions;
      let matches = true;

      // Check task tags
      if (conditions.taskTags && conditions.taskTags.length > 0) {
        if (!task || !task.tags.some((t: string) => conditions.taskTags!.includes(t))) {
          matches = false;
        }
      }

      // Check task priority
      if (matches && conditions.taskPriority && conditions.taskPriority.length > 0) {
        if (!task || !conditions.taskPriority.includes(task.priority)) {
          matches = false;
        }
      }

      // Check source agent
      if (matches && conditions.sourceAgents && conditions.sourceAgents.length > 0) {
        if (!conditions.sourceAgents.some((id) => id === args.sourceAgentId)) {
          matches = false;
        }
      }

      // Check notification type
      if (matches && conditions.notificationType && conditions.notificationType.length > 0) {
        if (!conditions.notificationType.includes(args.notificationType)) {
          matches = false;
        }
      }

      // If all conditions match, return this rule's action
      if (matches) {
        return {
          action: rule.action,
          matchedRule: rule.name,
          redirectTo: rule.redirectToAgentId,
          priorityOverride: rule.priorityOverride,
        };
      }
    }

    // No rules matched, allow by default
    return { action: "allow", matchedRule: null };
  },
});

/**
 * Create common preset rules
 */
export const createPresets = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const presets = [
      {
        name: "Block low priority thread replies",
        conditions: {
          taskPriority: ["low"],
          notificationType: ["thread_reply"],
        },
        action: "block" as const,
      },
      {
        name: "Escalate urgent tasks",
        conditions: {
          taskPriority: ["urgent"],
        },
        action: "escalate" as const,
        priorityOverride: "urgent" as const,
      },
    ];

    const created = [];
    for (const preset of presets) {
      const id = await ctx.db.insert("alertRules", {
        agentId: args.agentId,
        name: preset.name,
        enabled: false, // Disabled by default
        conditions: preset.conditions,
        action: preset.action,
        priorityOverride: preset.priorityOverride,
      });
      created.push(id);
    }

    return { created: created.length };
  },
});
