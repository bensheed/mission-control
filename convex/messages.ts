import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get messages for a task
 */
export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    // Enrich with agent info
    return await Promise.all(
      messages.map(async (msg) => {
        const agent = await ctx.db.get(msg.fromAgentId);
        return { ...msg, agent };
      })
    );
  },
});

/**
 * Create a message (comment on a task)
 */
export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    fromAgentId: v.id("agents"),
    content: v.string(),
    attachments: v.optional(v.array(v.id("documents"))),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const agent = await ctx.db.get(args.fromAgentId);
    if (!agent) throw new Error("Agent not found");

    // Parse mentions from content (e.g., @Jarvis, @all)
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(args.content)) !== null) {
      mentions.push(match[1]);
    }

    // Create message
    const messageId = await ctx.db.insert("messages", {
      taskId: args.taskId,
      fromAgentId: args.fromAgentId,
      content: args.content,
      attachments: args.attachments || [],
      mentions,
    });

    // Log activity
    await ctx.db.insert("activities", {
      type: "message_sent",
      agentId: args.fromAgentId,
      taskId: args.taskId,
      message: `${agent.name} commented on "${task.title}"`,
    });

    // Auto-subscribe the commenter to this task
    const existingSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_agent_task", (q) =>
        q.eq("agentId", args.fromAgentId).eq("taskId", args.taskId)
      )
      .first();

    if (!existingSub) {
      await ctx.db.insert("subscriptions", {
        agentId: args.fromAgentId,
        taskId: args.taskId,
      });
    }

    // Handle @mentions
    if (mentions.length > 0) {
      const allAgents = await ctx.db.query("agents").collect();
      
      for (const mention of mentions) {
        if (mention.toLowerCase() === "all") {
          // @all - notify all agents except sender
          for (const targetAgent of allAgents) {
            if (targetAgent._id !== args.fromAgentId) {
              await ctx.db.insert("notifications", {
                mentionedAgentId: targetAgent._id,
                sourceAgentId: args.fromAgentId,
                taskId: args.taskId,
                messageId,
                content: `${agent.name} mentioned @all: "${args.content.substring(0, 100)}${args.content.length > 100 ? "..." : ""}"`,
                type: "mention",
                delivered: false,
              });
            }
          }
        } else {
          // Specific agent mention
          const targetAgent = allAgents.find(
            (a) => a.name.toLowerCase() === mention.toLowerCase()
          );
          
          if (targetAgent && targetAgent._id !== args.fromAgentId) {
            await ctx.db.insert("notifications", {
              mentionedAgentId: targetAgent._id,
              sourceAgentId: args.fromAgentId,
              taskId: args.taskId,
              messageId,
              content: `${agent.name} mentioned you: "${args.content.substring(0, 100)}${args.content.length > 100 ? "..." : ""}"`,
              type: "mention",
              delivered: false,
            });

            // Auto-subscribe mentioned agent
            const mentionSub = await ctx.db
              .query("subscriptions")
              .withIndex("by_agent_task", (q) =>
                q.eq("agentId", targetAgent._id).eq("taskId", args.taskId)
              )
              .first();

            if (!mentionSub) {
              await ctx.db.insert("subscriptions", {
                agentId: targetAgent._id,
                taskId: args.taskId,
              });
            }
          }
        }
      }
    }

    // Notify thread subscribers (except sender and already-mentioned agents)
    const subscribers = await ctx.db
      .query("subscriptions")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    const mentionedAgentNames = new Set(mentions.map((m) => m.toLowerCase()));
    
    for (const sub of subscribers) {
      if (sub.agentId === args.fromAgentId) continue;
      
      const subAgent = await ctx.db.get(sub.agentId);
      if (!subAgent) continue;
      
      // Skip if already mentioned
      if (mentionedAgentNames.has(subAgent.name.toLowerCase()) || mentionedAgentNames.has("all")) {
        continue;
      }

      await ctx.db.insert("notifications", {
        mentionedAgentId: sub.agentId,
        sourceAgentId: args.fromAgentId,
        taskId: args.taskId,
        messageId,
        content: `${agent.name} replied in "${task.title}": "${args.content.substring(0, 100)}${args.content.length > 100 ? "..." : ""}"`,
        type: "thread_reply",
        delivered: false,
      });
    }

    return messageId;
  },
});
