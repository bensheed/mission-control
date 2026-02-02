/**
 * Seed script to populate all 10 agents in the Convex database.
 * 
 * Run with: npx convex run scripts/seed-agents
 * 
 * Note: This is a Convex function, not a standalone script.
 * Copy the mutation to convex/ directory to use.
 */

import { mutation } from "../convex/_generated/server";

const AGENTS = [
  {
    name: "Jarvis",
    role: "Squad Lead",
    sessionKey: "agent:main:main",
    level: "lead" as const,
    status: "idle" as const,
  },
  {
    name: "Shuri",
    role: "Product Analyst",
    sessionKey: "agent:product-analyst:main",
    level: "specialist" as const,
    status: "idle" as const,
  },
  {
    name: "Friday",
    role: "Developer",
    sessionKey: "agent:developer:main",
    level: "specialist" as const,
    status: "idle" as const,
  },
  {
    name: "Fury",
    role: "Customer Researcher",
    sessionKey: "agent:customer-researcher:main",
    level: "specialist" as const,
    status: "idle" as const,
  },
  {
    name: "Vision",
    role: "SEO Analyst",
    sessionKey: "agent:seo-analyst:main",
    level: "specialist" as const,
    status: "idle" as const,
  },
  {
    name: "Loki",
    role: "Content Writer",
    sessionKey: "agent:content-writer:main",
    level: "specialist" as const,
    status: "idle" as const,
  },
  {
    name: "Quill",
    role: "Social Media Manager",
    sessionKey: "agent:social-media-manager:main",
    level: "specialist" as const,
    status: "idle" as const,
  },
  {
    name: "Wanda",
    role: "Designer",
    sessionKey: "agent:designer:main",
    level: "specialist" as const,
    status: "idle" as const,
  },
  {
    name: "Pepper",
    role: "Email Marketing Specialist",
    sessionKey: "agent:email-marketing:main",
    level: "specialist" as const,
    status: "idle" as const,
  },
  {
    name: "Wong",
    role: "Knowledge Manager",
    sessionKey: "agent:notion-agent:main",
    level: "specialist" as const,
    status: "idle" as const,
  },
];

export const seedAgents = mutation({
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
      const id = await ctx.db.insert("agents", agent);
      created.push({ name: agent.name, id });

      // Create default preferences
      await ctx.db.insert("agentPreferences", {
        agentId: id,
        deliveryMethod: "immediate",
      });
    }

    return {
      created: created.length,
      skipped: skipped.length,
      agents: created,
      skippedAgents: skipped,
    };
  },
});

// Export agent data for reference
export const AGENT_CONFIG = AGENTS;
