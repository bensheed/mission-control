/**
 * Mock Convex API types for development
 * 
 * In production, run `npx convex dev` to generate real types.
 * This file allows the dashboard to build without a Convex connection.
 * 
 * USAGE: Import this ONLY when Convex is not connected.
 * When Convex is running, import from "convex/_generated/api" instead.
 */

import { FunctionReference } from "convex/server";

// Type stub for API
export const api = {
  tasks: {
    list: null as unknown as FunctionReference<"query">,
    listByStatus: null as unknown as FunctionReference<"query">,
    get: null as unknown as FunctionReference<"query">,
    create: null as unknown as FunctionReference<"mutation">,
    update: null as unknown as FunctionReference<"mutation">,
    updateStatus: null as unknown as FunctionReference<"mutation">,
    assign: null as unknown as FunctionReference<"mutation">,
    remove: null as unknown as FunctionReference<"mutation">,
  },
  agents: {
    list: null as unknown as FunctionReference<"query">,
    get: null as unknown as FunctionReference<"query">,
    getByName: null as unknown as FunctionReference<"query">,
    updateStatus: null as unknown as FunctionReference<"mutation">,
    recordHeartbeat: null as unknown as FunctionReference<"mutation">,
  },
  activities: {
    listRecent: null as unknown as FunctionReference<"query">,
    list: null as unknown as FunctionReference<"query">,
    log: null as unknown as FunctionReference<"mutation">,
    todaySummary: null as unknown as FunctionReference<"query">,
  },
  messages: {
    listByTask: null as unknown as FunctionReference<"query">,
    create: null as unknown as FunctionReference<"mutation">,
  },
  notifications: {
    getUndelivered: null as unknown as FunctionReference<"query">,
    markDelivered: null as unknown as FunctionReference<"mutation">,
    incrementRetry: null as unknown as FunctionReference<"mutation">,
    markFailed: null as unknown as FunctionReference<"mutation">,
    markEscalatedToJarvis: null as unknown as FunctionReference<"mutation">,
    getJarvisAgent: null as unknown as FunctionReference<"query">,
  },
  subscriptions: {
    listByTask: null as unknown as FunctionReference<"query">,
    subscribe: null as unknown as FunctionReference<"mutation">,
    unsubscribe: null as unknown as FunctionReference<"mutation">,
  },
  documents: {
    list: null as unknown as FunctionReference<"query">,
    create: null as unknown as FunctionReference<"mutation">,
  },
  preferences: {
    get: null as unknown as FunctionReference<"query">,
    upsert: null as unknown as FunctionReference<"mutation">,
    shouldDeliver: null as unknown as FunctionReference<"query">,
  },
  alertRules: {
    listByAgent: null as unknown as FunctionReference<"query">,
    create: null as unknown as FunctionReference<"mutation">,
    evaluate: null as unknown as FunctionReference<"query">,
  },
  seed: {
    agents: null as unknown as FunctionReference<"mutation">,
    sampleTask: null as unknown as FunctionReference<"mutation">,
    reset: null as unknown as FunctionReference<"mutation">,
  },
};
