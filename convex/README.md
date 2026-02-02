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
- `subscriptions.ts` - Subscription functions
