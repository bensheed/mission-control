import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * List all documents
 */
export const list = query({
  args: {
    type: v.optional(
      v.union(
        v.literal("deliverable"),
        v.literal("research"),
        v.literal("protocol"),
        v.literal("other")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db
        .query("documents")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .collect();
    }
    return await ctx.db.query("documents").collect();
  },
});

/**
 * Get a single document
 */
export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) return null;

    const creator = await ctx.db.get(doc.createdBy);
    const task = doc.taskId ? await ctx.db.get(doc.taskId) : null;

    return { ...doc, creator, task };
  },
});

/**
 * Get documents for a task
 */
export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    return await Promise.all(
      docs.map(async (doc) => {
        const creator = await ctx.db.get(doc.createdBy);
        return { ...doc, creator };
      })
    );
  },
});

/**
 * Get documents created by an agent
 */
export const listByCreator = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_creator", (q) => q.eq("createdBy", args.agentId))
      .collect();
  },
});

/**
 * Create a document
 */
export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("deliverable"),
      v.literal("research"),
      v.literal("protocol"),
      v.literal("other")
    ),
    taskId: v.optional(v.id("tasks")),
    createdBy: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.createdBy);
    if (!agent) throw new Error("Agent not found");

    const docId = await ctx.db.insert("documents", {
      title: args.title,
      content: args.content,
      type: args.type,
      taskId: args.taskId,
      createdBy: args.createdBy,
      version: 1,
    });

    // Log activity
    await ctx.db.insert("activities", {
      type: "document_created",
      agentId: args.createdBy,
      taskId: args.taskId,
      documentId: docId,
      message: `${agent.name} created document: ${args.title}`,
    });

    return docId;
  },
});

/**
 * Update a document
 */
export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("deliverable"),
        v.literal("research"),
        v.literal("protocol"),
        v.literal("other")
      )
    ),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Document not found");

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.type !== undefined) updates.type = args.type;
    
    // Increment version on content change
    if (args.content !== undefined && args.content !== doc.content) {
      updates.version = (doc.version || 1) + 1;
    }

    await ctx.db.patch(args.id, updates);
  },
});
