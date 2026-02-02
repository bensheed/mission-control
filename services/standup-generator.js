/**
 * Daily Standup Generator
 * 
 * Generates a daily standup report from Mission Control data and sends
 * it to the configured notification channel (e.g., Telegram).
 * 
 * Run daily via cron: 30 23 * * * (11:30 PM)
 * Or manually: node services/standup-generator.js
 */

const { ConvexHttpClient } = require("convex/browser");
const fs = require("fs").promises;
const path = require("path");

// Configuration
const CONVEX_URL = process.env.CONVEX_URL || "https://your-deployment.convex.cloud";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const STANDUP_DIR = path.join(__dirname, "..", "memory", "standups");

// Initialize Convex client
const convex = new ConvexHttpClient(CONVEX_URL);

/**
 * Format a timestamp to human-readable time
 */
function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a date to YYYY-MM-DD
 */
function formatDate(date = new Date()) {
  return date.toISOString().split("T")[0];
}

/**
 * Get tasks by status from the last 24 hours
 */
async function getTaskStats() {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

  // Get all tasks
  const tasks = await convex.query("tasks:list", {});
  
  // Categorize
  const stats = {
    completed: tasks.filter((t) => t.status === "done"),
    inProgress: tasks.filter((t) => t.status === "in_progress"),
    blocked: tasks.filter((t) => t.status === "blocked"),
    review: tasks.filter((t) => t.status === "review"),
    inbox: tasks.filter((t) => t.status === "inbox"),
    assigned: tasks.filter((t) => t.status === "assigned"),
  };

  return stats;
}

/**
 * Get agent activity stats
 */
async function getAgentStats() {
  const agents = await convex.query("agents:list", {});
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

  return agents.map((agent) => ({
    name: agent.name,
    role: agent.role,
    status: agent.status,
    lastHeartbeat: agent.lastHeartbeat,
    isActive: agent.lastHeartbeat && agent.lastHeartbeat > dayAgo,
  }));
}

/**
 * Get recent activities
 */
async function getRecentActivities() {
  try {
    const activities = await convex.query("activities:listRecent", { limit: 20 });
    return activities;
  } catch (e) {
    return [];
  }
}

/**
 * Generate the standup report in markdown
 */
async function generateStandup() {
  const date = formatDate();
  const stats = await getTaskStats();
  const agents = await getAgentStats();
  const activities = await getRecentActivities();

  const activeAgents = agents.filter((a) => a.isActive).length;
  const totalAgents = agents.length;

  let report = `# Daily Standup: ${date}\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;

  // Summary
  report += `## 📊 Summary\n\n`;
  report += `| Metric | Count |\n`;
  report += `|--------|-------|\n`;
  report += `| Active Agents | ${activeAgents}/${totalAgents} |\n`;
  report += `| Tasks Completed | ${stats.completed.length} |\n`;
  report += `| In Progress | ${stats.inProgress.length} |\n`;
  report += `| Blocked | ${stats.blocked.length} |\n`;
  report += `| Awaiting Review | ${stats.review.length} |\n`;
  report += `| In Inbox | ${stats.inbox.length} |\n\n`;

  // Completed Tasks
  if (stats.completed.length > 0) {
    report += `## ✅ Completed\n\n`;
    for (const task of stats.completed.slice(0, 10)) {
      report += `- **${task.title}**`;
      if (task.assigneeNames?.length) {
        report += ` (${task.assigneeNames.join(", ")})`;
      }
      report += `\n`;
    }
    if (stats.completed.length > 10) {
      report += `- _...and ${stats.completed.length - 10} more_\n`;
    }
    report += `\n`;
  }

  // In Progress
  if (stats.inProgress.length > 0) {
    report += `## 🔄 In Progress\n\n`;
    for (const task of stats.inProgress) {
      report += `- **${task.title}**`;
      if (task.assigneeNames?.length) {
        report += ` (${task.assigneeNames.join(", ")})`;
      }
      report += ` [${task.priority}]\n`;
    }
    report += `\n`;
  }

  // Blocked (highlighted)
  if (stats.blocked.length > 0) {
    report += `## 🚨 Blocked\n\n`;
    for (const task of stats.blocked) {
      report += `- **${task.title}**`;
      if (task.blockedReason) {
        report += `: ${task.blockedReason}`;
      }
      report += `\n`;
    }
    report += `\n`;
  }

  // Awaiting Review
  if (stats.review.length > 0) {
    report += `## 👀 Awaiting Review\n\n`;
    for (const task of stats.review) {
      report += `- **${task.title}**`;
      if (task.assigneeNames?.length) {
        report += ` (${task.assigneeNames.join(", ")})`;
      }
      report += `\n`;
    }
    report += `\n`;
  }

  // Agent Status
  report += `## 🤖 Agent Status\n\n`;
  report += `| Agent | Role | Status | Last Seen |\n`;
  report += `|-------|------|--------|------------|\n`;
  for (const agent of agents) {
    const lastSeen = agent.lastHeartbeat
      ? formatTime(agent.lastHeartbeat)
      : "Never";
    const statusEmoji = agent.status === "active" ? "🟢" : agent.status === "blocked" ? "🔴" : "⚪";
    report += `| ${agent.name} | ${agent.role} | ${statusEmoji} ${agent.status} | ${lastSeen} |\n`;
  }
  report += `\n`;

  // Recent Activity Highlights
  if (activities.length > 0) {
    report += `## 📝 Recent Activity\n\n`;
    for (const activity of activities.slice(0, 10)) {
      report += `- ${activity.message}\n`;
    }
    report += `\n`;
  }

  report += `---\n`;
  report += `_This standup was auto-generated by Mission Control._\n`;

  return report;
}

/**
 * Send report to Telegram
 */
async function sendToTelegram(report) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("[SKIP] Telegram not configured");
    return false;
  }

  try {
    const fetch = (await import("node-fetch")).default;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    // Convert markdown to Telegram-compatible format
    // Telegram has limited markdown support
    const telegramText = report
      .replace(/\*\*(.+?)\*\*/g, "*$1*")  // Bold
      .replace(/^#{1,6} /gm, "*")          // Headers to bold
      .substring(0, 4000);                  // Telegram limit

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: telegramText,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      console.error("[ERROR] Telegram send failed:", await response.text());
      return false;
    }

    console.log("[SUCCESS] Standup sent to Telegram");
    return true;
  } catch (error) {
    console.error("[ERROR] Telegram send failed:", error.message);
    return false;
  }
}

/**
 * Save report to file
 */
async function saveToFile(report, date) {
  try {
    await fs.mkdir(STANDUP_DIR, { recursive: true });
    const filepath = path.join(STANDUP_DIR, `${date}.md`);
    await fs.writeFile(filepath, report, "utf-8");
    console.log(`[SUCCESS] Standup saved to ${filepath}`);
    return true;
  } catch (error) {
    console.error("[ERROR] Failed to save standup:", error.message);
    return false;
  }
}

/**
 * Main entry point
 */
async function main() {
  console.log("==============================================");
  console.log("  Mission Control Daily Standup Generator");
  console.log("==============================================");
  console.log(`Date: ${formatDate()}`);
  console.log(`Convex: ${CONVEX_URL}`);
  console.log("----------------------------------------------\n");

  try {
    // Generate the report
    console.log("[GENERATE] Building standup report...");
    const report = await generateStandup();
    
    // Output to console
    console.log("\n" + report + "\n");

    // Save to file
    const date = formatDate();
    await saveToFile(report, date);

    // Send to Telegram
    await sendToTelegram(report);

    console.log("----------------------------------------------");
    console.log("[DONE] Standup generation complete");
  } catch (error) {
    console.error("[FATAL] Standup generation failed:", error);
    process.exit(1);
  }
}

// Run
main();
