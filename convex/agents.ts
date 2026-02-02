import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get all agents
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

/**
 * Get a single agent by ID
 */
export const get = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get agent by session key
 */
export const getBySessionKey = query({
  args: { sessionKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_session_key", (q) => q.eq("sessionKey", args.sessionKey))
      .first();
  },
});

/**
 * Get agents by status
 */
export const getByStatus = query({
  args: { status: v.union(v.literal("idle"), v.literal("active"), v.literal("blocked")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

/**
 * Create a new agent
 */
export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    sessionKey: v.string(),
    level: v.union(v.literal("intern"), v.literal("specialist"), v.literal("lead")),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agentId = await ctx.db.insert("agents", {
      name: args.name,
      role: args.role,
      status: "idle",
      sessionKey: args.sessionKey,
      level: args.level,
      avatarUrl: args.avatarUrl,
    });

    // Log activity
    await ctx.db.insert("activities", {
      type: "agent_status_changed",
      agentId,
      message: `${args.name} joined Mission Control as ${args.role}`,
    });

    return agentId;
  },
});

/**
 * Update agent status
 */
export const updateStatus = mutation({
  args: {
    id: v.id("agents"),
    status: v.union(v.literal("idle"), v.literal("active"), v.literal("blocked")),
    currentTaskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);
    if (!agent) throw new Error("Agent not found");

    const oldStatus = agent.status;
    
    await ctx.db.patch(args.id, {
      status: args.status,
      currentTaskId: args.currentTaskId,
    });

    // Log activity if status changed
    if (oldStatus !== args.status) {
      await ctx.db.insert("activities", {
        type: "agent_status_changed",
        agentId: args.id,
        message: `${agent.name} is now ${args.status}`,
        metadata: { from: oldStatus, to: args.status },
      });
    }
  },
});

/**
 * Record heartbeat for an agent
 */
export const heartbeat = mutation({
  args: {
    id: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);
    if (!agent) throw new Error("Agent not found");

    await ctx.db.patch(args.id, {
      lastHeartbeat: Date.now(),
    });

    // Log heartbeat activity
    await ctx.db.insert("activities", {
      type: "agent_heartbeat",
      agentId: args.id,
      message: `${agent.name} heartbeat`,
    });
  },
});

/**
 * Seed initial agents (run once during setup)
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existingAgents = await ctx.db.query("agents").collect();
    if (existingAgents.length > 0) {
      return { message: "Agents already seeded", count: existingAgents.length };
    }

    const agents = [
      { name: "Jarvis", role: "Squad Lead", sessionKey: "agent:main:main", level: "lead" as const },
      { name: "Shuri", role: "Product Analyst", sessionKey: "agent:product-analyst:main", level: "specialist" as const },
      { name: "Fury", role: "Customer Researcher", sessionKey: "agent:customer-researcher:main", level: "specialist" as const },
      { name: "Vision", role: "SEO Analyst", sessionKey: "agent:seo-analyst:main", level: "specialist" as const },
      { name: "Loki", role: "Content Writer", sessionKey: "agent:content-writer:main", level: "specialist" as const },
      { name: "Quill", role: "Social Media Manager", sessionKey: "agent:social-media-manager:main", level: "specialist" as const },
      { name: "Wanda", role: "Designer", sessionKey: "agent:designer:main", level: "specialist" as const },
      { name: "Pepper", role: "Email Marketing", sessionKey: "agent:email-marketing:main", level: "specialist" as const },
      { name: "Friday", role: "Developer", sessionKey: "agent:developer:main", level: "specialist" as const },
      { name: "Wong", role: "Documentation", sessionKey: "agent:notion-agent:main", level: "specialist" as const },
    ];

    for (const agent of agents) {
      await ctx.db.insert("agents", {
        ...agent,
        status: "idle",
      });
    }

    return { message: "Agents seeded successfully", count: agents.length };
  },
});
