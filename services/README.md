# Mission Control Services

Background services that power Mission Control.

## Services

### notification-daemon.js

Polls Convex for undelivered notifications and sends them to agents via [OpenClaw](https://github.com/openclaw/openclaw) session messaging.

**Features:**
- Polls every 2 seconds for new notifications
- Sends @mention and thread reply notifications
- Handles sleeping agents gracefully (queues for next heartbeat)
- Tracks delivery statistics

**Run manually:**
```bash
CONVEX_URL=https://your-deployment.convex.cloud node services/notification-daemon.js
```

**Run with PM2:**
```bash
pm2 start services/notification-daemon.js --name notification-daemon
pm2 logs notification-daemon
```

### standup-generator.js

Generates daily standup reports and sends them via Telegram.

**Schedule:** Runs daily at 11:30 PM (configurable)

**Run manually:**
```bash
node services/standup-generator.js
```

**Run with cron:**
```bash
# Add to crontab
30 23 * * * node /path/to/mission-control/services/standup-generator.js
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CONVEX_URL` | Convex deployment URL | Required |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | Required for standups |
| `TELEGRAM_CHAT_ID` | Chat ID for standup delivery | Required for standups |

## PM2 Ecosystem

For production, create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "notification-daemon",
      script: "services/notification-daemon.js",
      env: {
        CONVEX_URL: "https://your-deployment.convex.cloud",
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
```

Then:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Set up auto-start on reboot
```

## Monitoring

Check service health:
```bash
pm2 status
pm2 logs --lines 100
pm2 monit
```

## Troubleshooting

**Notifications not delivering:**
1. Check CONVEX_URL is correct
2. Verify OpenClaw gateway is running: `openclaw gateway status`
3. Check agent session keys match configuration
4. Review daemon logs for errors

**Agent sleeping (expected):**
- When an agent's session is not active, delivery fails gracefully
- Notification stays queued in Convex
- Will be delivered when agent wakes up for heartbeat
