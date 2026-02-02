# Mission Control Runbook

Operational procedures for running and maintaining Mission Control.

---

## Quick Start

### Prerequisites

1. Node.js v18+
2. Convex account (free tier works)
3. Anthropic API key
4. Telegram bot token (optional, for notifications)

### Initial Setup

```bash
# Clone and install
cd mission-control
npm install

# Initialize Convex
npx convex dev

# Seed the database with agents
npx convex run seed:agents

# Create a sample task
npx convex run seed:sampleTask
```

### Start Services

```bash
# Install PM2
npm install -g pm2

# Start notification daemon
pm2 start services/ecosystem.config.js

# Verify running
pm2 status

# View logs
pm2 logs
```

---

## Daily Operations

### Morning Check

1. **Review standup report** - Check `memory/standups/YYYY-MM-DD.md`
2. **Clear blocked tasks** - Unblock any stuck tasks
3. **Process inbox** - Assign tasks from inbox to agents

### Commands

```bash
# Check notification daemon status
pm2 status notification-daemon

# View recent activity
npx convex run activities:listRecent '{"limit": 20}'

# List all tasks
npx convex run tasks:list '{}'

# Check agent status
npx convex run agents:list '{}'
```

---

## Common Tasks

### Add a New Task

```bash
npx convex run tasks:create '{
  "title": "Task title",
  "description": "Detailed description",
  "priority": "medium",
  "tags": ["feature"]
}'
```

### Assign a Task

```bash
npx convex run tasks:assign '{
  "id": "task_id_here",
  "agentIds": ["agent_id_here"]
}'
```

### Update Task Status

```bash
npx convex run tasks:updateStatus '{
  "id": "task_id_here",
  "status": "in_progress"
}'
```

### Send Message to Agent Session

```bash
clawdbot sessions send \
  --session "agent:main:main" \
  --message "Hey Jarvis, can you check on task X?"
```

### Manually Trigger Standup

```bash
node services/standup-generator.js
```

---

## Agent Management

### List All Agents

```bash
npx convex run agents:list '{}'
```

### Update Agent Status

```bash
npx convex run agents:updateStatus '{
  "id": "agent_id",
  "status": "active"
}'
```

### Mute an Agent's Notifications

```bash
npx convex run preferences:muteGlobal '{
  "agentId": "agent_id",
  "durationMinutes": 60
}'
```

### Set Agent Quiet Hours

```bash
npx convex run preferences:setQuietHours '{
  "agentId": "agent_id",
  "startHour": 22,
  "endHour": 8
}'
```

---

## Alert Rules

### Create a Block Rule

```bash
npx convex run alertRules:create '{
  "agentId": "agent_id",
  "name": "Block low priority thread replies",
  "enabled": true,
  "conditions": {
    "taskPriority": ["low"],
    "notificationType": ["thread_reply"]
  },
  "action": "block"
}'
```

### Create an Escalation Rule

```bash
npx convex run alertRules:create '{
  "agentId": "agent_id",
  "name": "Escalate urgent tasks",
  "enabled": true,
  "conditions": {
    "taskPriority": ["urgent"]
  },
  "action": "escalate"
}'
```

### Toggle Rule

```bash
npx convex run alertRules:setEnabled '{
  "id": "rule_id",
  "enabled": false
}'
```

---

## Troubleshooting

### Notification Daemon Not Running

```bash
# Check status
pm2 status notification-daemon

# View logs
pm2 logs notification-daemon --lines 50

# Restart
pm2 restart notification-daemon
```

### Agent Not Responding

1. Check heartbeat log:
   ```bash
   clawdbot cronlist | grep heartbeat
   ```

2. Check agent status in Convex:
   ```bash
   npx convex run agents:get '{"name": "AgentName"}'
   ```

3. Manually wake agent:
   ```bash
   clawdbot sessions send \
     --session "agent:session:key" \
     --message "Wake up and execute HEARTBEAT protocol"
   ```

### Tasks Stuck in Queue

1. Check undelivered notifications:
   ```bash
   npx convex run notifications:getUndelivered '{}'
   ```

2. Force delivery:
   ```bash
   pm2 restart notification-daemon
   ```

### Database Issues

```bash
# Run a health check
npx convex run agents:list '{}'

# If needed, reset and reseed
npx convex run seed:reset
npx convex run seed:agents
```

---

## Backups

### Daily Backup Script

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR=~/mission-control-backups/$DATE

mkdir -p $BACKUP_DIR

# Backup memory files
cp -r memory/ $BACKUP_DIR/memory/

# Export Convex data (replace with actual export)
npx convex export > $BACKUP_DIR/convex-export.json
```

### Restore Procedure

1. Stop services: `pm2 stop all`
2. Restore memory files
3. Restore Convex data: `npx convex import < backup.json`
4. Reseed if needed: `npx convex run seed:agents`
5. Restart: `pm2 start services/ecosystem.config.js`

---

## Cost Monitoring

### Check API Usage

Track costs by monitoring:
- Anthropic dashboard for Claude API usage
- Convex dashboard for database operations

### Cost Optimization

1. **Reduce heartbeat frequency**: Increase from 15min to 30min if latency is acceptable
2. **Use cheaper models for heartbeats**: Configure lower-cost model for routine checks
3. **Aggressive context management**: Summarize old conversations
4. **Disable idle agents**: Stop heartbeats for agents not currently needed

---

## Emergency Procedures

### Stop All Activity

```bash
# Stop all services
pm2 stop all

# Remove all heartbeat crons
clawdbot cronremove --all
```

### Disable Notifications

```bash
# Mute all agents globally
npx convex run seed:muteAll '{"durationMinutes": 1440}'
```

### Reset System

```bash
# Stop services
pm2 stop all

# Reset database
npx convex run seed:reset

# Reseed
npx convex run seed:agents

# Restart
pm2 start services/ecosystem.config.js
```

---

## Contact

For issues with this system, escalate to the human operator via Telegram or the configured notification channel.
