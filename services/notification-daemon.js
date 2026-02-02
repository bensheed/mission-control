/**
 * Notification Daemon
 * 
 * Polls Convex for undelivered notifications and sends them to agents
 * via the OpenClaw sessions_send tool.
 * 
 * OpenClaw provides the sessions_send tool for inter-agent messaging:
 * https://docs.openclaw.ai/concepts/session-tool
 * 
 * Features:
 * - Alert routing based on agent preferences
 * - Quiet hours support
 * - Muting support (global and per-subscription)
 * - Alert rules evaluation
 * 
 * Run with: node services/notification-daemon.js
 * Or via PM2: pm2 start services/notification-daemon.js --name notification-daemon
 */

const { ConvexHttpClient } = require("convex/browser");

// Configuration
const CONVEX_URL = process.env.CONVEX_URL || "https://your-deployment.convex.cloud";
const POLL_INTERVAL_MS = 2000; // 2 seconds
const MAX_RETRIES = 3;

// Agent session keys mapping
// These correspond to OpenClaw session keys configured in the gateway
const AGENT_SESSIONS = {
  "Jarvis": "agent:main:main",
  "Shuri": "agent:product-analyst:main",
  "Fury": "agent:customer-researcher:main",
  "Vision": "agent:seo-analyst:main",
  "Loki": "agent:content-writer:main",
  "Quill": "agent:social-media-manager:main",
  "Wanda": "agent:designer:main",
  "Pepper": "agent:email-marketing:main",
  "Friday": "agent:developer:main",
  "Wong": "agent:notion-agent:main",
};

// Initialize Convex client
const convex = new ConvexHttpClient(CONVEX_URL);

// Stats tracking
let stats = {
  started: new Date().toISOString(),
  pollCount: 0,
  delivered: 0,
  blocked: 0,
  deferred: 0,
  failed: 0,
  lastPoll: null,
};

/**
 * Send a message to an agent session via OpenClaw CLI
 * 
 * OpenClaw's `openclaw send` command sends a message to a specific session.
 * Docs: https://docs.openclaw.ai/tools/agent-send
 */
async function sendToAgent(sessionKey, content) {
  console.log(`[SEND] To ${sessionKey}: ${content.substring(0, 100)}...`);
  
  const { exec } = require("child_process");
  
  return new Promise((resolve, reject) => {
    const escapedContent = content.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    // Use openclaw send command to deliver message to agent session
    const cmd = `openclaw send --session "${sessionKey}" "${escapedContent}"`;
    
    exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        // Check if it's a "session not active" error (expected when agent is sleeping)
        if (stderr?.includes("not active") || stderr?.includes("not found")) {
          console.log(`[INFO] Agent ${sessionKey} is sleeping, notification queued`);
          resolve({ delivered: false, reason: "agent_sleeping" });
        } else {
          console.error(`[ERROR] Failed to send to ${sessionKey}: ${error.message}`);
          reject(error);
        }
      } else {
        console.log(`[SUCCESS] Delivered to ${sessionKey}`);
        resolve({ delivered: true });
      }
    });
  });
}

/**
 * Check if notification should be delivered based on preferences and rules
 */
async function shouldDeliverNotification(notification, agent) {
  try {
    // Check agent preferences (quiet hours, global mute)
    const deliveryCheck = await convex.query("preferences:shouldDeliver", {
      agentId: agent._id,
    });

    if (!deliveryCheck.shouldDeliver) {
      console.log(`[DEFER] ${agent.name}: ${deliveryCheck.reason}`);
      return { deliver: false, reason: deliveryCheck.reason, action: "defer" };
    }

    // Evaluate alert rules
    const ruleResult = await convex.query("alertRules:evaluate", {
      agentId: agent._id,
      sourceAgentId: notification.sourceAgentId,
      taskId: notification.taskId,
      notificationType: notification.type,
    });

    if (ruleResult.action === "block") {
      console.log(`[BLOCK] ${agent.name}: Rule "${ruleResult.matchedRule}"`);
      return { deliver: false, reason: ruleResult.matchedRule, action: "block" };
    }

    if (ruleResult.action === "redirect" && ruleResult.redirectTo) {
      console.log(`[REDIRECT] ${agent.name} -> ${ruleResult.redirectTo}`);
      return { 
        deliver: true, 
        action: "redirect", 
        redirectTo: ruleResult.redirectTo,
        priorityOverride: ruleResult.priorityOverride,
      };
    }

    return { 
      deliver: true, 
      action: ruleResult.action,
      priorityOverride: ruleResult.priorityOverride,
    };
  } catch (error) {
    // If preference/rule check fails, default to delivering
    console.warn(`[WARN] Preference check failed: ${error.message}, delivering anyway`);
    return { deliver: true, action: "allow" };
  }
}

/**
 * Process a single notification
 */
async function processNotification(notification, agent) {
  const agentName = agent.name;
  const sessionKey = AGENT_SESSIONS[agentName];
  
  if (!sessionKey) {
    console.error(`[ERROR] Unknown agent: ${agentName}`);
    return false;
  }

  // Check delivery preferences and rules
  const decision = await shouldDeliverNotification(notification, agent);

  if (!decision.deliver) {
    if (decision.action === "block") {
      // Permanently block - mark as delivered but don't send
      await convex.mutation("notifications:markDelivered", {
        id: notification._id,
      });
      stats.blocked++;
      return true; // Remove from queue
    } else {
      // Defer - leave in queue for later
      stats.deferred++;
      return false;
    }
  }

  // Handle redirects
  let targetSessionKey = sessionKey;
  let targetAgentName = agentName;
  
  if (decision.action === "redirect" && decision.redirectTo) {
    // Find redirect target
    const redirectAgent = await convex.query("agents:get", { id: decision.redirectTo });
    if (redirectAgent) {
      targetSessionKey = AGENT_SESSIONS[redirectAgent.name] || sessionKey;
      targetAgentName = redirectAgent.name;
      console.log(`[REDIRECT] Sending to ${targetAgentName} instead of ${agentName}`);
    }
  }

  // Modify content for escalation
  let content = notification.content;
  if (decision.action === "escalate" || decision.priorityOverride === "urgent") {
    content = `🚨 URGENT: ${content}`;
  }
  
  try {
    const result = await sendToAgent(targetSessionKey, content);
    
    if (result.delivered) {
      // Mark as delivered in Convex
      await convex.mutation("notifications:markDelivered", {
        id: notification._id,
      });
      stats.delivered++;
      return true;
    } else {
      // Agent sleeping - notification stays queued for next heartbeat
      stats.deferred++;
      return false;
    }
  } catch (error) {
    console.error(`[ERROR] Processing notification ${notification._id}:`, error.message);
    stats.failed++;
    return false;
  }
}

/**
 * Main polling loop
 */
async function poll() {
  stats.pollCount++;
  stats.lastPoll = new Date().toISOString();
  
  try {
    // Fetch undelivered notifications
    const notifications = await convex.query("notifications:getUndelivered", {});
    
    if (notifications.length === 0) {
      return; // Nothing to do
    }
    
    console.log(`[POLL] Found ${notifications.length} undelivered notifications`);
    
    // Process each notification
    for (const notification of notifications) {
      const agent = notification.mentionedAgent;
      
      if (agent) {
        await processNotification(notification, agent);
      }
    }
  } catch (error) {
    console.error("[ERROR] Poll failed:", error.message);
  }
}

/**
 * Health check endpoint (optional - for monitoring)
 */
function getStats() {
  return {
    ...stats,
    uptime: Math.floor((Date.now() - new Date(stats.started).getTime()) / 1000),
  };
}

/**
 * Graceful shutdown
 */
function shutdown() {
  console.log("\n[SHUTDOWN] Notification daemon stopping...");
  console.log("[STATS]", JSON.stringify(getStats(), null, 2));
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

/**
 * Main entry point
 */
async function main() {
  console.log("==============================================");
  console.log("  Mission Control Notification Daemon");
  console.log("==============================================");
  console.log(`Convex URL: ${CONVEX_URL}`);
  console.log(`Poll interval: ${POLL_INTERVAL_MS}ms`);
  console.log(`Agents configured: ${Object.keys(AGENT_SESSIONS).length}`);
  console.log("----------------------------------------------");
  console.log("Starting polling loop...\n");
  
  // Initial poll
  await poll();
  
  // Start polling loop
  setInterval(poll, POLL_INTERVAL_MS);
}

// Run
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
