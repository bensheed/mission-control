import { mutation } from "./_generated/server";

/**
 * All 10 Mission Control agents with their configurations
 */
const AGENTS = [
  {
    name: "Jarvis",
    role: "Squad Lead",
    sessionKey: "agent:main:main",
    level: "lead" as const,
  },
  {
    name: "Shuri",
    role: "Product Analyst",
    sessionKey: "agent:product-analyst:main",
    level: "specialist" as const,
  },
  {
    name: "Friday",
    role: "Developer",
    sessionKey: "agent:developer:main",
    level: "specialist" as const,
  },
  {
    name: "Fury",
    role: "Customer Researcher",
    sessionKey: "agent:customer-researcher:main",
    level: "specialist" as const,
  },
  {
    name: "Vision",
    role: "SEO Analyst",
    sessionKey: "agent:seo-analyst:main",
    level: "specialist" as const,
  },
  {
    name: "Loki",
    role: "Content Writer",
    sessionKey: "agent:content-writer:main",
    level: "specialist" as const,
  },
  {
    name: "Quill",
    role: "Social Media Manager",
    sessionKey: "agent:social-media-manager:main",
    level: "specialist" as const,
  },
  {
    name: "Wanda",
    role: "Designer",
    sessionKey: "agent:designer:main",
    level: "specialist" as const,
  },
  {
    name: "Pepper",
    role: "Email Marketing Specialist",
    sessionKey: "agent:email-marketing:main",
    level: "specialist" as const,
  },
  {
    name: "Wong",
    role: "Knowledge Manager",
    sessionKey: "agent:notion-agent:main",
    level: "specialist" as const,
  },
];

/**
 * Seed all 10 agents into the database
 * Run with: npx convex run seed:agents
 */
export const agents = mutation({
  args: {},
  handler: async (ctx) => {
    const created = [];
    const skipped = [];

    for (const agent of AGENTS) {
      // Check if agent already exists
      const existing = await ctx.db
        .query("agents")
        .withIndex("by_session_key", (q) => q.eq("sessionKey", agent.sessionKey))
        .first();

      if (existing) {
        skipped.push(agent.name);
        continue;
      }

      // Create agent
      const id = await ctx.db.insert("agents", {
        ...agent,
        status: "idle",
      });
      created.push({ name: agent.name, id });

      // Create default preferences for the agent
      await ctx.db.insert("agentPreferences", {
        agentId: id,
        deliveryMethod: "immediate",
      });
    }

    return {
      message: `Created ${created.length} agents, skipped ${skipped.length} existing`,
      created: created.map((a) => a.name),
      skipped,
    };
  },
});

/**
 * Create sample alert rule presets for all agents
 * Run with: npx convex run seed:alertRulePresets
 */
export const alertRulePresets = mutation({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    let totalCreated = 0;

    for (const agent of agents) {
      // Skip if agent already has rules
      const existingRules = await ctx.db
        .query("alertRules")
        .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
        .first();

      if (existingRules) continue;

      // Create preset rules (disabled by default)
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
        },
      ];

      for (const preset of presets) {
        await ctx.db.insert("alertRules", {
          agentId: agent._id,
          name: preset.name,
          enabled: false,
          conditions: preset.conditions,
          action: preset.action,
        });
        totalCreated++;
      }
    }

    return {
      message: `Created ${totalCreated} alert rule presets`,
      rulesPerAgent: 2,
    };
  },
});

/**
 * Create a sample task for testing
 * Run with: npx convex run seed:sampleTask
 */
export const sampleTask = mutation({
  args: {},
  handler: async (ctx) => {
    // Get Jarvis
    const jarvis = await ctx.db
      .query("agents")
      .withIndex("by_session_key", (q) => q.eq("sessionKey", "agent:main:main"))
      .first();

    if (!jarvis) {
      throw new Error("Jarvis not found. Run seed:agents first.");
    }

    // Create a sample task
    const taskId = await ctx.db.insert("tasks", {
      title: "Welcome to Mission Control",
      description: "This is a sample task to test the system. Feel free to update its status, add comments, and explore the dashboard.",
      status: "inbox",
      assigneeIds: [],
      createdBy: "System",
      priority: "medium",
      tags: ["welcome", "sample"],
    });

    // Log activity
    await ctx.db.insert("activities", {
      type: "task_created",
      agentId: jarvis._id,
      taskId,
      message: "Sample task created for system testing",
    });

    return {
      message: "Sample task created",
      taskId,
    };
  },
});

/**
 * Reset database (careful!)
 * Run with: npx convex run seed:reset
 */
export const reset = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete in order to respect foreign key-like constraints
    const tables = [
      "notifications",
      "subscriptions", 
      "alertRules",
      "agentPreferences",
      "messages",
      "activities",
      "documents",
      "tasks",
      "agents",
    ];

    const counts: Record<string, number> = {};

    for (const table of tables) {
      const items = await ctx.db.query(table as any).collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
      counts[table] = items.length;
    }

    return {
      message: "Database reset complete",
      deleted: counts,
    };
  },
});
