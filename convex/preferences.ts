import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get preferences for an agent
 */
export const get = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("agentPreferences")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    // Return defaults if no preferences set
    if (!prefs) {
      return {
        agentId: args.agentId,
        quietHoursStart: null,
        quietHoursEnd: null,
        urgentOnly: false,
        minPriority: "low",
        deliveryMethod: "immediate",
        batchIntervalMinutes: 15,
        globalMuteUntil: null,
        mutedTags: [],
      };
    }

    return prefs;
  },
});

/**
 * Create or update agent preferences
 */
export const upsert = mutation({
  args: {
    agentId: v.id("agents"),
    quietHoursStart: v.optional(v.number()),
    quietHoursEnd: v.optional(v.number()),
    urgentOnly: v.optional(v.boolean()),
    minPriority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    deliveryMethod: v.optional(v.union(
      v.literal("immediate"),
      v.literal("batched"),
      v.literal("heartbeat_only")
    )),
    batchIntervalMinutes: v.optional(v.number()),
    globalMuteUntil: v.optional(v.number()),
    mutedTags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentPreferences")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    const { agentId, ...updates } = args;

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      return await ctx.db.insert("agentPreferences", {
        agentId,
        ...updates,
      });
    }
  },
});

/**
 * Mute an agent globally for a duration
 */
export const muteGlobal = mutation({
  args: {
    agentId: v.id("agents"),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const muteUntil = Date.now() + args.durationMinutes * 60 * 1000;

    const existing = await ctx.db
      .query("agentPreferences")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { globalMuteUntil: muteUntil });
    } else {
      await ctx.db.insert("agentPreferences", {
        agentId: args.agentId,
        globalMuteUntil: muteUntil,
      });
    }

    return { mutedUntil: muteUntil };
  },
});

/**
 * Unmute an agent
 */
export const unmuteGlobal = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentPreferences")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { globalMuteUntil: undefined });
    }

    return { unmuted: true };
  },
});

/**
 * Add a tag to muted tags
 */
export const muteTag = mutation({
  args: {
    agentId: v.id("agents"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentPreferences")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (existing) {
      const currentTags = existing.mutedTags || [];
      if (!currentTags.includes(args.tag)) {
        await ctx.db.patch(existing._id, {
          mutedTags: [...currentTags, args.tag],
        });
      }
    } else {
      await ctx.db.insert("agentPreferences", {
        agentId: args.agentId,
        mutedTags: [args.tag],
      });
    }

    return { muted: true };
  },
});

/**
 * Remove a tag from muted tags
 */
export const unmuteTag = mutation({
  args: {
    agentId: v.id("agents"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentPreferences")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (existing && existing.mutedTags) {
      await ctx.db.patch(existing._id, {
        mutedTags: existing.mutedTags.filter((t) => t !== args.tag),
      });
    }

    return { unmuted: true };
  },
});

/**
 * Set quiet hours
 */
export const setQuietHours = mutation({
  args: {
    agentId: v.id("agents"),
    startHour: v.number(),  // 0-23
    endHour: v.number(),    // 0-23
  },
  handler: async (ctx, args) => {
    if (args.startHour < 0 || args.startHour > 23 ||
        args.endHour < 0 || args.endHour > 23) {
      throw new Error("Hours must be between 0 and 23");
    }

    const existing = await ctx.db
      .query("agentPreferences")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        quietHoursStart: args.startHour,
        quietHoursEnd: args.endHour,
      });
    } else {
      await ctx.db.insert("agentPreferences", {
        agentId: args.agentId,
        quietHoursStart: args.startHour,
        quietHoursEnd: args.endHour,
      });
    }

    return { set: true };
  },
});

/**
 * Clear quiet hours
 */
export const clearQuietHours = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentPreferences")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        quietHoursStart: undefined,
        quietHoursEnd: undefined,
      });
    }

    return { cleared: true };
  },
});

/**
 * Check if agent is in quiet hours or muted
 */
export const shouldDeliver = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("agentPreferences")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!prefs) {
      return { shouldDeliver: true, reason: "no_preferences" };
    }

    const now = Date.now();

    // Check global mute
    if (prefs.globalMuteUntil && now < prefs.globalMuteUntil) {
      return {
        shouldDeliver: false,
        reason: "globally_muted",
        muteEndsAt: prefs.globalMuteUntil,
      };
    }

    // Check quiet hours
    if (prefs.quietHoursStart !== undefined && prefs.quietHoursEnd !== undefined) {
      const currentHour = new Date().getUTCHours();
      const start = prefs.quietHoursStart;
      const end = prefs.quietHoursEnd;

      let inQuietHours = false;
      if (start <= end) {
        // Normal range (e.g., 22-6 means quiet from 10pm to 6am)
        inQuietHours = currentHour >= start && currentHour < end;
      } else {
        // Wrap around midnight (e.g., 22-6)
        inQuietHours = currentHour >= start || currentHour < end;
      }

      if (inQuietHours) {
        return {
          shouldDeliver: false,
          reason: "quiet_hours",
          quietHoursEnd: end,
        };
      }
    }

    // Check delivery method
    if (prefs.deliveryMethod === "heartbeat_only") {
      return {
        shouldDeliver: false,
        reason: "heartbeat_only",
      };
    }

    return { shouldDeliver: true, reason: "ok" };
  },
});
