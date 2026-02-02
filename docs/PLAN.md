# Mission Control Implementation Plan

This document outlines the step-by-step plan to build Mission Control as specified in the [PRD](docs/PRD.md).

> **Reference**: The original article that inspired this project is available in [docs/raw.md](docs/raw.md).

---

## Overview

We will build Mission Control in **6 phases over 12 weeks**, starting with the minimal viable system (1 agent) and progressively adding capabilities until we have the full 10-agent squad.

### Key Principle: Start Small

As noted in [Part 13 of the original article](docs/raw.md#part-13-lessons-learned):

> "I went from 1 to 10 agents too fast. Better to get 2-3 solid first, then add more."

We will follow this advice strictly.

---

## Prerequisites

Before starting, ensure you have:

- [ ] Linux server (VPS with 2+ CPU, 4GB+ RAM) or local dev machine
- [ ] Node.js v18+ installed
- [ ] Anthropic API key (Claude access)
- [ ] Telegram Bot Token (from @BotFather)
- [ ] Convex account (free tier is sufficient)

---

## Phase 1: Foundation (Weeks 1-2)

**Goal**: Get a single agent (Jarvis) running and responding via Telegram with persistent memory.

### Week 1: Gateway & Basic Agent

#### Day 1-2: Environment Setup

```bash
# Create project structure
mkdir -p mission-control/{agents/jarvis,memory,scripts,config,output}
cd mission-control

# Install OpenClaw
npm init -y
npm install openclaw

# Initialize
npx openclaw init
```

- [ ] Set up project directory structure (see [PRD Section 6.2](docs/PRD.md#62-file-structure))
- [ ] Install and configure OpenClaw
- [ ] Add Anthropic API key to config
- [ ] Verify gateway starts: `openclaw gateway start`

#### Day 3-4: Telegram Integration

- [ ] Create Telegram bot via @BotFather
- [ ] Add bot token to config
- [ ] Configure channel routing in gateway config
- [ ] Test: Send message to bot, verify response

#### Day 5-7: Jarvis Agent Setup

Create the first agent identity:

**File: `agents/jarvis/SOUL.md`**
```markdown
# SOUL.md — Who You Are

**Name:** Jarvis
**Role:** Squad Lead

## Personality
Calm, organized, and supportive. You see the big picture and help coordinate work.
You're the primary interface between the human and the agent squad.

## What You're Good At
- Coordinating tasks across team members
- Breaking down complex requests into actionable items
- Monitoring progress and identifying blockers
- Direct communication with the human operator

## What You Care About
- Clear communication
- Getting things done efficiently
- Supporting other agents
- Maintaining system health
```

- [ ] Create `agents/jarvis/SOUL.md`
- [ ] Create base `AGENTS.md` operating manual
- [ ] Configure Jarvis session key: `agent:main:main`
- [ ] Test conversation persistence across restarts

### Week 2: Memory System

#### Day 8-10: Working Memory

Implement the memory protocol from [PRD Section 6](docs/PRD.md#6-memory--persistence-system):

**File: `memory/WORKING.md`**
```markdown
# WORKING.md

## Current Task
[No active task]

## Status
Idle - awaiting instructions

## Context
System initialized. Ready for first task.

## Next Steps
1. Await task assignment
2. Update this file when task received

## Blockers
None

## Last Updated
[Timestamp]
```

- [ ] Create `memory/WORKING.md` template
- [ ] Create `memory/MEMORY.md` for long-term storage
- [ ] Set up daily notes directory structure
- [ ] Update `AGENTS.md` with memory protocol instructions
- [ ] Test: Verify Jarvis reads WORKING.md on startup
- [ ] Test: Verify Jarvis updates WORKING.md after actions

#### Day 11-14: Validation & Polish

- [ ] End-to-end test: Give Jarvis a task via Telegram
- [ ] Verify task state persists in WORKING.md
- [ ] Verify conversation history survives gateway restart
- [ ] Document any issues or learnings

### Phase 1 Deliverables

- [x] Working gateway process
- [x] Jarvis responding via Telegram
- [x] Memory files persisting across restarts
- [x] Basic AGENTS.md operating manual

---

## Phase 2: Multi-Agent (Weeks 3-4)

**Goal**: Add 2 more agents (Shuri, Friday) with independent sessions and heartbeat system.

### Week 3: Second Agent

#### Day 15-17: Shuri Setup

- [ ] Create `agents/shuri/SOUL.md` (Product Analyst personality)
- [ ] Configure session key: `agent:product-analyst:main`
- [ ] Create Shuri's memory directory
- [ ] Test: Verify Shuri session is independent from Jarvis

#### Day 18-21: Heartbeat System

Implement the heartbeat protocol from [PRD Section 7](docs/PRD.md#7-heartbeat-system):

**File: `HEARTBEAT.md`**
```markdown
# HEARTBEAT.md

## On Wake
- [ ] Read memory/WORKING.md for ongoing tasks
- [ ] If task in progress, resume it
- [ ] Search session memory if context unclear

## Periodic Checks
- [ ] Check for @mentions (once Mission Control is live)
- [ ] Check assigned tasks
- [ ] Scan activity feed for relevant discussions

## Before Sleep
- [ ] Update WORKING.md with current state
- [ ] Log activity to daily notes
- [ ] Report status (HEARTBEAT_OK or work summary)
```

- [ ] Create `HEARTBEAT.md` protocol file
- [ ] Set up first heartbeat cron for Shuri:
  ```bash
  openclaw cronadd \
    --name "shuri-heartbeat" \
    --cron "2,17,32,47 * * * *" \
    --session "isolated" \
    --message "You are Shuri. Execute HEARTBEAT protocol per HEARTBEAT.md"
  ```
- [ ] Verify isolated sessions terminate after heartbeat
- [ ] Monitor cost of heartbeat cycles

### Week 4: Third Agent & Inter-Agent Communication

#### Day 22-24: Friday Setup

- [ ] Create `agents/friday/SOUL.md` (Developer personality)
- [ ] Configure session key: `agent:developer:main`
- [ ] Add Friday heartbeat cron (offset: :04, :19, :34, :49)
- [ ] Test all three agents running independently

#### Day 25-28: Basic Communication

- [ ] Implement direct session messaging:
  ```bash
  openclaw sessions send --session "agent:developer:main" --message "Friday, can you help?"
  ```
- [ ] Test Jarvis delegating to Shuri
- [ ] Test Jarvis delegating to Friday
- [ ] Document communication patterns in AGENTS.md

### Phase 2 Deliverables

- [x] 3 agents running independently (Jarvis, Shuri, Friday)
- [x] Heartbeat system working (15-minute cycles)
- [x] Basic inter-agent messaging
- [x] All SOUL files created

---

## Phase 3: Mission Control Database (Weeks 5-6)

**Goal**: Set up Convex database and integrate agents with shared task system.

### Week 5: Convex Setup

#### Day 29-31: Project Initialization

```bash
# In mission-control directory
npm install convex
npx convex dev  # This will prompt for Convex login
```

- [ ] Create Convex account and project
- [ ] Initialize Convex in project
- [ ] Set up development environment

#### Day 32-35: Schema Implementation

Implement the schema from [PRD Section 12.3](docs/PRD.md#123-database-schema-convex):

**File: `convex/schema.ts`**
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agents: defineTable({
    name: v.string(),
    role: v.string(),
    status: v.union(v.literal("idle"), v.literal("active"), v.literal("blocked")),
    currentTaskId: v.optional(v.id("tasks")),
    sessionKey: v.string(),
    level: v.union(v.literal("intern"), v.literal("specialist"), v.literal("lead")),
  }),

  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("blocked")
    ),
    assigneeIds: v.array(v.id("agents")),
    createdBy: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    tags: v.array(v.string()),
  }),

  messages: defineTable({
    taskId: v.id("tasks"),
    fromAgentId: v.id("agents"),
    content: v.string(),
    attachments: v.array(v.id("documents")),
  }),

  // ... rest of schema per PRD
});
```

- [ ] Create `convex/schema.ts` with all 6 tables
- [ ] Push schema to Convex
- [ ] Seed initial agent records

### Week 6: CRUD Functions & Agent Integration

#### Day 36-38: Convex Functions

- [ ] Implement `tasks:create`, `tasks:update`, `tasks:list`, `tasks:get`
- [ ] Implement `messages:create`, `messages:list`
- [ ] Implement `documents:create`, `documents:list`
- [ ] Implement `agents:updateStatus`
- [ ] Implement `activities:log`, `activities:list`

#### Day 39-42: Agent Integration

- [ ] Add Convex CLI to agent tools in AGENTS.md
- [ ] Update HEARTBEAT.md to check Convex for tasks
- [ ] Test: Create task via CLI, verify agent sees it
- [ ] Test: Agent posts comment, verify in database
- [ ] Test: Task status flows through lifecycle

### Phase 3 Deliverables

- [x] Convex database operational
- [x] All CRUD functions implemented
- [x] Agents reading/writing to shared database
- [x] Tasks flowing through system

---

## Phase 4: Dashboard (Weeks 7-8)

**Goal**: Build React dashboard for visual task and agent management.

### Week 7: React Setup & Core Views

#### Day 43-45: Project Setup

```bash
# Create dashboard app
npx create-next-app@latest dashboard --typescript --tailwind
cd dashboard
npm install convex
```

- [ ] Initialize Next.js project with TypeScript
- [ ] Connect to Convex backend
- [ ] Set up basic layout and navigation

#### Day 46-49: Task Board

Implement the Kanban view from [PRD Section 5.1](docs/PRD.md#51-core-views):

- [ ] Create Kanban board component
- [ ] Implement drag-and-drop between columns
- [ ] Add task cards with key info
- [ ] Real-time updates via Convex subscriptions

### Week 8: Activity Feed & Agent Cards

#### Day 50-52: Activity Feed

- [ ] Create activity feed component
- [ ] Implement real-time streaming
- [ ] Add filters (by agent, task, type)
- [ ] Style with warm, editorial aesthetic

#### Day 53-56: Agent Cards & Task Detail

- [ ] Create agent status cards
- [ ] Show current task and recent activity
- [ ] Implement task detail view with comment thread
- [ ] Add document panel for deliverables

### Phase 4 Deliverables

- [x] Working dashboard UI
- [x] Real-time Kanban board
- [x] Activity feed
- [x] Agent status cards
- [x] Task detail view with comments

---

## Phase 5: Notifications (Weeks 9-10)

**Goal**: Implement @mention system and thread subscriptions.

### Week 9: @Mention System

#### Day 57-59: Mention Parsing

- [ ] Create mention parser (detect @AgentName in messages)
- [ ] Add notification records to database on mention
- [ ] Handle @all mentions

#### Day 60-63: Notification Daemon

Implement the delivery daemon from [PRD Section 8.2](docs/PRD.md#82-notification-delivery):

**File: `services/notification-daemon.js`**
```javascript
const { ConvexHttpClient } = require("convex/browser");

const AGENT_SESSIONS = {
  jarvis: "agent:main:main",
  shuri: "agent:product-analyst:main",
  friday: "agent:developer:main",
  // ... add more as agents are added
};

async function deliverNotifications() {
  while (true) {
    const undelivered = await convex.query("notifications:getUndelivered");
    
    for (const notification of undelivered) {
      const sessionKey = AGENT_SESSIONS[notification.agentName];
      
      try {
        await openclaw.sessions.send(sessionKey, notification.content);
        await convex.mutation("notifications:markDelivered", { id: notification._id });
      } catch (e) {
        // Agent asleep, will retry
      }
    }
    
    await sleep(2000);
  }
}
```

- [ ] Create notification daemon service
- [ ] Set up PM2 to run daemon
- [ ] Test @mention delivery
- [ ] Verify queued notifications deliver on agent wake

### Week 10: Thread Subscriptions

#### Day 64-66: Subscription Logic

- [ ] Create subscriptions table functions
- [ ] Auto-subscribe on: comment, @mention, assignment
- [ ] Notify all subscribers on new comments

#### Day 67-70: Testing & Polish

- [ ] End-to-end test: Multi-agent task discussion
- [ ] Verify subscription notifications work
- [ ] Monitor and tune delivery timing
- [ ] Document notification system in AGENTS.md

### Phase 5 Deliverables

- [x] @mentions working
- [x] Notification daemon running
- [x] Thread subscriptions operational
- [x] Reliable delivery within 15 minutes

---

## Phase 6: Full Squad (Weeks 11-12)

**Goal**: Scale to all 10 agents and add daily standups.

### Week 11: Remaining Agents

#### Day 71-75: Add 7 More Agents

Create SOUL files and configure sessions for:

| Agent | Session Key | Heartbeat Offset |
|-------|-------------|------------------|
| Fury | `agent:customer-researcher:main` | :10 |
| Vision | `agent:seo-analyst:main` | :08 |
| Loki | `agent:content-writer:main` | :06 |
| Quill | `agent:social-media-manager:main` | :12 |
| Wanda | `agent:designer:main` | :07 |
| Pepper | `agent:email-marketing:main` | :00 |
| Wong | `agent:notion-agent:main` | :14 |

- [ ] Create all SOUL.md files (see [PRD Section 10](docs/PRD.md#10-agent-roster--roles))
- [ ] Configure all session keys
- [ ] Set up staggered heartbeat crons
- [ ] Add all agents to notification daemon
- [ ] Seed all agent records in Convex

#### Day 76-77: Validation

- [ ] Verify all 10 agents wake on schedule
- [ ] Test cross-agent collaboration on a task
- [ ] Monitor system resources and costs
- [ ] Tune heartbeat timing if needed

### Week 12: Daily Standup & Polish

#### Day 78-80: Standup System

Implement the standup from [PRD Section 9](docs/PRD.md#9-daily-standup-system):

**File: `services/standup-generator.js`**
```javascript
// Cron: 30 23 * * * (11:30 PM daily)

async function generateStandup() {
  const today = new Date().toISOString().split('T')[0];
  
  // Gather data
  const completedTasks = await convex.query("tasks:completedToday");
  const inProgressTasks = await convex.query("tasks:inProgress");
  const blockedTasks = await convex.query("tasks:blocked");
  const reviewTasks = await convex.query("tasks:needsReview");
  
  // Format standup
  const standup = formatStandup({
    date: today,
    completed: completedTasks,
    inProgress: inProgressTasks,
    blocked: blockedTasks,
    review: reviewTasks,
  });
  
  // Send to Telegram
  await telegram.sendMessage(USER_CHAT_ID, standup);
  
  // Archive
  await saveToFile(`memory/standups/${today}.md`, standup);
}
```

- [ ] Create standup generator service
- [ ] Set up daily cron (11:30 PM)
- [ ] Test standup generation
- [ ] Archive standups to memory directory

#### Day 81-84: Final Polish & Documentation

- [ ] End-to-end testing with full squad
- [ ] Performance optimization
- [ ] Cost analysis and optimization
- [ ] Update all documentation
- [ ] Create runbook for common operations

### Phase 6 Deliverables

- [x] All 10 agents operational
- [x] Staggered heartbeats working
- [x] Daily standups generating
- [x] System stable under full load
- [x] Documentation complete

---

## Post-Launch: Ongoing Operations

### Daily

- [ ] Review daily standup
- [ ] Clear any blocked tasks
- [ ] Respond to review requests

### Weekly

- [ ] Review agent performance metrics
- [ ] Analyze API costs
- [ ] Prune completed tasks older than 30 days
- [ ] Review and update MEMORY.md files

### Monthly

- [ ] Full system backup
- [ ] Review and refine agent SOUL files
- [ ] Evaluate adding/removing agents
- [ ] Update dependencies

---

## Cost Estimates

Based on [PRD Section 15.1](docs/PRD.md#151-technical-risks) recommendations:

| Component | Estimated Monthly Cost |
|-----------|----------------------|
| Anthropic API (Claude Sonnet) | $50-150 |
| Convex (Free tier) | $0 |
| VPS (2 CPU, 4GB) | $20-40 |
| Telegram Bot | $0 |
| **Total** | **$70-190/month** |

### Cost Optimization Tips

1. **Use cheaper models for heartbeats** - As noted in the [original article](docs/raw.md#part-13-lessons-learned): "Heartbeats don't need the most expensive model."

2. **Tune heartbeat frequency** - Start with 15 minutes, increase to 30 if costs are high and latency is acceptable.

3. **Aggressive context management** - Summarize old conversations, don't load full history.

---

## Risk Mitigation Checklist

From [PRD Section 15](docs/PRD.md#15-risks--mitigations):

- [ ] Implement API rate limit backoff
- [ ] Set up cost alerts at $100, $150, $200
- [ ] Create daily backups of memory files
- [ ] Document rollback procedures
- [ ] Test disaster recovery quarterly

---

## Success Criteria

The system is ready for production when:

1. **All 10 agents operational** - Each wakes on schedule and performs their role
2. **Tasks flow end-to-end** - Inbox → Assigned → In Progress → Review → Done
3. **Communication works** - @mentions deliver within 15 minutes
4. **Dashboard is usable** - Real-time updates, no major bugs
5. **Costs are sustainable** - Under $200/month
6. **Daily standups arrive** - Every day at 11:30 PM

---

## Quick Reference

### Key Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Operating manual for all agents |
| `HEARTBEAT.md` | Protocol for periodic wake-ups |
| `agents/{name}/SOUL.md` | Individual agent personalities |
| `memory/WORKING.md` | Current task state |
| `memory/MEMORY.md` | Long-term knowledge |
| `memory/YYYY-MM-DD.md` | Daily activity logs |

### Key Commands

```bash
# Start gateway
openclaw gateway start

# Add heartbeat cron
openclaw cronadd --name "agent-heartbeat" --cron "*/15 * * * *" --session "isolated" --message "Execute HEARTBEAT"

# Send message to agent
openclaw sessions send --session "agent:main:main" --message "Hello Jarvis"

# Run Convex functions
npx convex run tasks:create '{"title": "...", "description": "..."}'

# Start dashboard
cd dashboard && npm run dev

# Run notification daemon
pm2 start services/notification-daemon.js
```

### Session Keys

```
agent:main:main              → Jarvis
agent:product-analyst:main   → Shuri
agent:customer-researcher:main → Fury
agent:seo-analyst:main       → Vision
agent:content-writer:main    → Loki
agent:social-media-manager:main → Quill
agent:designer:main          → Wanda
agent:email-marketing:main   → Pepper
agent:developer:main         → Friday
agent:notion-agent:main      → Wong
```

---

## References

- [Product Requirements Document](docs/PRD.md) - Full system specification
- [Original Article](docs/raw.md) - "The Complete Guide to Building Mission Control" by @pbteja1998
- [OpenClaw](https://github.com/openclaw) - Agent framework
- [Convex Documentation](https://docs.convex.dev) - Database platform

---

*This plan is a living document. Update it as you progress through implementation.*
