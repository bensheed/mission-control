# Convex Database

This directory contains the Convex database schema and functions for Mission Control.

## Setup

1. Create a Convex account at https://convex.dev
2. Install the Convex CLI: `npm install convex`
3. Initialize: `npx convex dev` (will prompt for login)
4. The schema will be automatically deployed

## Schema Overview

| Table | Purpose |
|-------|---------|
| `agents` | The 10 AI agents and their status |
| `tasks` | Work items flowing through the system |
| `messages` | Comments posted to task threads |
| `activities` | Activity feed for real-time visibility |
| `documents` | Deliverables and research artifacts |
| `notifications` | @mention alerts for agents |
| `subscriptions` | Thread subscription tracking |
| `agentPreferences` | Global notification preferences per agent |
| `alertRules` | Custom routing rules for notifications |

## Task Lifecycle

```
inbox → assigned → in_progress → review → done
                        ↓
                    blocked
```

## Usage from Agents

Agents interact with Convex via CLI:

```bash
# Create a task
npx convex run tasks:create '{"title": "...", "description": "...", "priority": "medium"}'

# Post a comment
npx convex run messages:create '{"taskId": "...", "content": "..."}'

# Update task status
npx convex run tasks:update '{"id": "...", "status": "in_progress"}'
```

## Files

- `schema.ts` - Database schema definition
- `agents.ts` - Agent CRUD functions
- `tasks.ts` - Task CRUD functions
- `messages.ts` - Message CRUD functions
- `activities.ts` - Activity feed functions
- `documents.ts` - Document CRUD functions
- `notifications.ts` - Notification functions
- `subscriptions.ts` - Subscription functions with muting
- `preferences.ts` - Agent notification preferences (quiet hours, muting)
- `alertRules.ts` - Custom alert routing rules

## Alert Routing System

The notification daemon supports sophisticated routing:

### Agent Preferences (`preferences.ts`)
- **Quiet Hours**: Specify hours when notifications should be deferred
- **Global Mute**: Temporarily silence all notifications for an agent
- **Muted Tags**: Ignore notifications from tasks with certain tags
- **Delivery Method**: `immediate`, `batched`, or `heartbeat_only`

### Alert Rules (`alertRules.ts`)
Custom rules that evaluate each notification:

```typescript
// Example: Block low-priority thread replies
{
  name: "Block low priority replies",
  conditions: {
    taskPriority: ["low"],
    notificationType: ["thread_reply"]
  },
  action: "block"
}

// Example: Escalate urgent tasks
{
  name: "Escalate urgent",
  conditions: { taskPriority: ["urgent"] },
  action: "escalate"
}
```

Actions:
- `allow` - Deliver normally
- `block` - Don't deliver, mark as delivered
- `escalate` - Add 🚨 URGENT prefix
- `redirect` - Send to a different agent
