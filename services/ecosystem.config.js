/**
 * PM2 Ecosystem Configuration
 * 
 * Start all services: pm2 start ecosystem.config.js
 * Save configuration: pm2 save
 * Setup auto-start: pm2 startup
 */

module.exports = {
  apps: [
    {
      name: "notification-daemon",
      script: "services/notification-daemon.js",
      cwd: "/path/to/mission-control",  // Update this path
      env: {
        NODE_ENV: "production",
        CONVEX_URL: "https://your-deployment.convex.cloud",  // Update this
      },
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/notification-daemon-error.log",
      out_file: "logs/notification-daemon-out.log",
      merge_logs: true,
    },
    {
      name: "standup-generator",
      script: "services/standup-generator.js",
      cwd: "/path/to/mission-control",  // Update this path
      cron_restart: "30 23 * * *",  // Run daily at 11:30 PM
      autorestart: false,  // Don't restart, cron handles scheduling
      env: {
        NODE_ENV: "production",
        CONVEX_URL: "https://your-deployment.convex.cloud",  // Update this
        TELEGRAM_BOT_TOKEN: "",  // Add your token
        TELEGRAM_CHAT_ID: "",    // Add your chat ID
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/standup-generator-error.log",
      out_file: "logs/standup-generator-out.log",
    },
  ],
};
