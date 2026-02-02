/**
 * Notification Daemon
 * 
 * Polls Convex for undelivered notifications and sends them to agents
 * via the Clawdbot session messaging API.
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
  failed: 0,
  lastPoll: null,
};

/**
 * Send a message to an agent session via Clawdbot
 * Replace this with actual Clawdbot SDK call when available
 */
async function sendToAgent(sessionKey, content) {
  // This is a placeholder - replace with actual Clawdbot integration
  // Example: await clawdbot.sessions.send(sessionKey, content)
  
  console.log(`[SEND] To ${sessionKey}: ${content.substring(0, 100)}...`);
  
  // Simulate the Clawdbot CLI command
  const { exec } = require("child_process");
  
  return new Promise((resolve, reject) => {
    const escapedContent = content.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const cmd = `clawdbot sessions send --session "${sessionKey}" --message "${escapedContent}"`;
    
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
 * Process a single notification
 */
async function processNotification(notification, agentName) {
  const sessionKey = AGENT_SESSIONS[agentName];
  
  if (!sessionKey) {
    console.error(`[ERROR] Unknown agent: ${agentName}`);
    return false;
  }
  
  try {
    const result = await sendToAgent(sessionKey, notification.content);
    
    if (result.delivered) {
      // Mark as delivered in Convex
      await convex.mutation("notifications:markDelivered", {
        id: notification._id,
      });
      stats.delivered++;
      return true;
    } else {
      // Agent sleeping - notification stays queued for next heartbeat
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
      const agentName = notification.mentionedAgent?.name;
      
      if (agentName) {
        await processNotification(notification, agentName);
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
