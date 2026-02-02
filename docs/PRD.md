# Mission Control: AI Agent Squad System
## Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** January 2025  
**Author:** Engineering Team  
**Status:** Draft

> **Source Material**: This PRD is based on ["The Complete Guide to Building Mission Control: How We Built an AI Agent Squad"](raw.md) by Bhanu Teja P (@pbteja1998). The full original article is preserved in [docs/raw.md](raw.md) for reference.

---

## Executive Summary

Mission Control is a multi-agent AI orchestration system that enables multiple AI agents to work together as a coordinated team. Unlike traditional AI assistants that operate in isolation with no memory between sessions, Mission Control provides persistent context, shared workspaces, inter-agent communication, and task management—essentially making AI work like a real team rather than a search box.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Goals & Objectives](#2-goals--objectives)
3. [System Architecture](#3-system-architecture)
4. [Agent Framework](#4-agent-framework)
5. [Mission Control Dashboard](#5-mission-control-dashboard)
6. [Memory & Persistence System](#6-memory--persistence-system)
7. [Heartbeat System](#7-heartbeat-system)
8. [Notification System](#8-notification-system)
9. [Daily Standup System](#9-daily-standup-system)
10. [Agent Roster & Roles](#10-agent-roster--roles)
11. [Task Workflow](#11-task-workflow)
12. [Technical Requirements](#12-technical-requirements)
13. [Implementation Phases](#13-implementation-phases)
14. [Success Metrics](#14-success-metrics)
15. [Risks & Mitigations](#15-risks--mitigations)

---

## 1. Problem Statement

### Current Pain Points

1. **No Continuity**: Every AI conversation starts fresh. Context from previous sessions is lost.
2. **Siloed Knowledge**: Research and work done in one session disappears into chat history.
3. **Single-Purpose**: One AI assistant trying to be good at everything is mediocre at everything.
4. **No Collaboration**: AI tools don't work together or share context.
5. **No Accountability**: No way to track what AI has done or hold it accountable for progress.

### Desired State

A system where:
- Multiple AI agents with specialized roles work together
- Agents remember what they're working on across sessions
- All context lives in a shared workspace
- Tasks can be assigned, tracked, and reviewed
- Agents communicate and collaborate like a real team

---

## 2. Goals & Objectives

### Primary Goals

| Goal | Description | Success Criteria |
|------|-------------|------------------|
| Multi-Agent Orchestration | Run 10+ specialized AI agents concurrently | All agents operational with independent sessions |
| Persistent Memory | Agents remember context across sessions | Working memory survives restarts |
| Shared Workspace | All agents access common task/document store | Real-time sync across all agents |
| Task Management | Full lifecycle tracking (inbox → done) | Tasks flow through all stages |
| Inter-Agent Communication | Agents can message and @mention each other | Notifications delivered within 15 minutes |

### Non-Goals (v1.0)

- Mobile application
- Voice interface
- Integration with external project management tools (Jira, Asana)
- Multi-tenant/team support
- Self-hosted deployment options

---

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACES                          │
├─────────────────┬─────────────────┬─────────────────────────────┤
│    Telegram     │   Mission Control   │      CLI                │
│    (Chat)       │   Dashboard (Web)   │   (Direct Access)       │
└────────┬────────┴─────────┬───────────┴──────────┬──────────────┘
         │                  │                      │
         ▼                  ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GATEWAY (Core Process)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Session   │  │    Cron     │  │   Message   │              │
│  │   Manager   │  │   Scheduler │  │   Router    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AGENT SESSIONS                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Jarvis  │ │  Shuri  │ │  Fury   │ │ Vision  │ │  Loki   │   │
│  │ (Lead)  │ │(Product)│ │(Research│ │  (SEO)  │ │(Content)│   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  Quill  │ │  Wanda  │ │ Pepper  │ │ Friday  │ │  Wong   │   │
│  │(Social) │ │(Design) │ │ (Email) │ │  (Dev)  │ │ (Docs)  │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SHARED INFRASTRUCTURE                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Convex DB      │  │  File System    │  │  AI Providers   │  │
│  │  (Tasks, Msgs)  │  │  (Memory Files) │  │  (Claude, etc)  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Overview

| Component | Technology | Purpose |
|-----------|------------|---------|
| Gateway | Node.js daemon | Core process managing all sessions |
| Sessions | OpenClaw | Individual agent instances |
| Database | Convex | Real-time task/message storage |
| File Storage | Local filesystem | Memory files, configs, deliverables |
| AI Provider | Anthropic Claude | LLM for agent intelligence |
| Chat Interface | Telegram Bot | Primary user interaction |
| Dashboard | React + TypeScript | Visual task/agent management |
| Notifications | Custom daemon | @mention delivery system |

---

## 4. Agent Framework

### 4.1 Session Management

Each agent runs as an independent session with a unique session key:

```
agent:{role}:{instance}
```

**Session Keys:**
| Agent | Session Key |
|-------|-------------|
| Jarvis | `agent:main:main` |
| Shuri | `agent:product-analyst:main` |
| Fury | `agent:customer-researcher:main` |
| Vision | `agent:seo-analyst:main` |
| Loki | `agent:content-writer:main` |
| Quill | `agent:social-media-manager:main` |
| Wanda | `agent:designer:main` |
| Pepper | `agent:email-marketing:main` |
| Friday | `agent:developer:main` |
| Wong | `agent:notion-agent:main` |

### 4.2 Session Types

| Type | Description | Use Case |
|------|-------------|----------|
| Main Session | Long-running, interactive | Direct chat with Jarvis |
| Isolated Session | One-shot, task-based | Heartbeat crons, scheduled tasks |

### 4.3 SOUL System (Agent Identity)

Each agent has a `SOUL.md` file defining:

```markdown
# SOUL.md — Who You Are

**Name:** [Agent Name]
**Role:** [Specialization]

## Personality
[Character traits, communication style, approach to work]

## What You're Good At
- [Core competency 1]
- [Core competency 2]
- [Core competency 3]

## What You Care About
- [Priority 1]
- [Priority 2]
- [Priority 3]

## Communication Style
[How the agent writes, responds, interacts]
```

### 4.4 AGENTS.md (Operating Manual)

Shared file all agents read on startup:

```markdown
# AGENTS.md — Operating Manual

## File Locations
- Memory: /memory/
- Scripts: /scripts/
- Config: /config/
- Deliverables: /output/

## Memory Protocol
- Always read WORKING.md first on wake
- Update WORKING.md after every significant action
- Write daily notes to /memory/YYYY-MM-DD.md

## Mission Control Protocol
- Check for @mentions on every heartbeat
- Post progress updates to task threads
- Move task status when work state changes

## Communication Rules
- Be specific, not vague
- Include evidence for claims
- @mention relevant agents when their input needed
```

### 4.5 Agent Tools

All agents have access to:

| Tool | Description |
|------|-------------|
| File System | Read/write files in workspace |
| Shell | Execute commands |
| Web Browser | Research and scraping |
| Convex CLI | Interact with Mission Control DB |
| Session Messaging | Send messages to other agents |

---

## 5. Mission Control Dashboard

### 5.1 Core Views

#### Activity Feed
- Real-time stream of all agent activity
- Filterable by agent, task, activity type
- Shows: task updates, comments, document creation, status changes

#### Task Board (Kanban)
```
┌──────────┬──────────┬────────────┬──────────┬──────────┐
│  INBOX   │ ASSIGNED │ IN PROGRESS│  REVIEW  │   DONE   │
├──────────┼──────────┼────────────┼──────────┼──────────┤
│ Task 1   │ Task 3   │ Task 5     │ Task 7   │ Task 9   │
│ Task 2   │ Task 4   │ Task 6     │ Task 8   │ Task 10  │
│          │          │            │          │          │
└──────────┴──────────┴────────────┴──────────┴──────────┘
```

#### Agent Cards
- Status indicator (idle/active/blocked)
- Current task assignment
- Recent activity summary
- Quick actions (assign task, send message)

#### Document Panel
- List of all deliverables
- Markdown preview
- Filter by type, task, agent

#### Task Detail View
- Full description
- Comment thread (all agent discussions)
- Attached documents
- Status history
- Assigned agents

### 5.2 UI Requirements

| Requirement | Description |
|-------------|-------------|
| Real-time Updates | Changes reflect immediately (WebSocket/Convex subscriptions) |
| Responsive | Works on desktop and tablet |
| Dark/Light Mode | User preference toggle |
| Keyboard Shortcuts | Power user navigation |
| Search | Global search across tasks, comments, documents |

### 5.3 Design Direction

- Warm, editorial aesthetic (newspaper dashboard feel)
- Clean typography, generous whitespace
- Subtle animations for state changes
- Color-coded agent identification

---

## 6. Memory & Persistence System

### 6.1 Memory Stack

```
┌─────────────────────────────────────────┐
│         Session Memory (Built-in)        │
│  Conversation history in JSONL files     │
│  Searchable by agent                     │
├─────────────────────────────────────────┤
│         Working Memory (WORKING.md)      │
│  Current task state                      │
│  Updated constantly                      │
│  First file read on wake                 │
├─────────────────────────────────────────┤
│         Daily Notes (/memory/DATE.md)    │
│  Raw logs of daily activity              │
│  Timestamped entries                     │
├─────────────────────────────────────────┤
│         Long-term Memory (MEMORY.md)     │
│  Curated important information           │
│  Lessons learned, key decisions          │
└─────────────────────────────────────────┘
```

### 6.2 File Structure

```
/workspace/
├── AGENTS.md              # Operating manual (all agents)
├── SOUL.md                # Agent identity (per-agent)
├── MEMORY.md              # Long-term memory
├── memory/
│   ├── WORKING.md         # Current task state
│   ├── 2025-01-31.md      # Daily notes
│   ├── 2025-01-30.md
│   └── ...
├── scripts/               # Utility scripts
├── config/                # Credentials, settings
└── output/                # Deliverables
```

### 6.3 WORKING.md Format

```markdown
# WORKING.md

## Current Task
[Task title and ID]

## Status
[Current progress, what's been done]

## Context
[Key information needed to continue]

## Next Steps
1. [Immediate next action]
2. [Following action]
3. [Following action]

## Blockers
[Any issues preventing progress]

## Last Updated
[Timestamp]
```

### 6.4 Memory Rules

| Rule | Description |
|------|-------------|
| Write to Persist | If you want to remember it, write it to a file |
| WORKING.md First | Always read WORKING.md on session start |
| Update Frequently | Update WORKING.md after every significant action |
| Daily Notes | Log activity with timestamps to daily file |
| Curate MEMORY.md | Periodically move important info to long-term memory |

---

## 7. Heartbeat System

### 7.1 Overview

Agents wake up periodically via cron jobs rather than running continuously. This balances responsiveness with cost efficiency.

### 7.2 Schedule

| Agent | Minute | Cron Expression |
|-------|--------|-----------------|
| Pepper | :00 | `0,15,30,45 * * * *` |
| Shuri | :02 | `2,17,32,47 * * * *` |
| Friday | :04 | `4,19,34,49 * * * *` |
| Loki | :06 | `6,21,36,51 * * * *` |
| Wanda | :07 | `7,22,37,52 * * * *` |
| Vision | :08 | `8,23,38,53 * * * *` |
| Fury | :10 | `10,25,40,55 * * * *` |
| Quill | :12 | `12,27,42,57 * * * *` |
| Wong | :14 | `14,29,44,59 * * * *` |

**Note:** Jarvis runs as a main session (always available for direct chat).

### 7.3 Heartbeat Protocol

```
HEARTBEAT SEQUENCE
──────────────────
1. LOAD CONTEXT
   ├── Read WORKING.md
   ├── Read recent daily notes
   └── Check session memory if needed

2. CHECK URGENT
   ├── @mentions directed at me?
   └── Tasks assigned to me?

3. SCAN ACTIVITY
   ├── Relevant discussions?
   └── Decisions affecting my work?

4. TAKE ACTION
   ├── If work to do → Do it
   └── If nothing → Report HEARTBEAT_OK
```

### 7.4 HEARTBEAT.md Checklist

```markdown
# HEARTBEAT.md

## On Wake
- [ ] Read memory/WORKING.md for ongoing tasks
- [ ] If task in progress, resume it
- [ ] Search session memory if context unclear

## Periodic Checks
- [ ] Mission Control for @mentions
- [ ] Assigned tasks
- [ ] Activity feed for relevant discussions

## Before Sleep
- [ ] Update WORKING.md with current state
- [ ] Log activity to daily notes
- [ ] Report status (HEARTBEAT_OK or work summary)
```

### 7.5 Why 15 Minutes?

| Interval | Pros | Cons |
|----------|------|------|
| 5 min | Very responsive | Too expensive, agents often idle |
| 15 min | Good balance | Acceptable latency |
| 30 min | Cost efficient | Work waits too long |

---

## 8. Notification System

### 8.1 @Mention System

| Mention | Behavior |
|---------|----------|
| `@Vision` | Notifies Vision specifically |
| `@Loki` | Notifies Loki specifically |
| `@all` | Notifies all agents |

### 8.2 Notification Delivery

```javascript
// Notification Daemon (runs via pm2)
while (true) {
  const undelivered = await getUndeliveredNotifications();
  
  for (const notification of undelivered) {
    const sessionKey = AGENT_SESSIONS[notification.mentionedAgentId];
    
    try {
      await openclaw.sessions.send(sessionKey, notification.content);
      await markDelivered(notification.id);
    } catch (e) {
      // Agent asleep, notification stays queued
      // Will retry on next poll
    }
  }
  
  await sleep(2000); // Poll every 2 seconds
}
```

### 8.3 Thread Subscriptions

Agents auto-subscribe to task threads when they:
- Comment on a task
- Get @mentioned in a task
- Get assigned to a task

Once subscribed, agent receives ALL future comments (no @mention needed).

### 8.4 Notification Schema

```typescript
interface Notification {
  id: string;
  mentionedAgentId: string;
  sourceAgentId: string;
  taskId?: string;
  content: string;
  type: 'mention' | 'thread_reply' | 'assignment';
  delivered: boolean;
  createdAt: timestamp;
  deliveredAt?: timestamp;
}
```

---

## 9. Daily Standup System

### 9.1 Schedule

Runs daily at 11:30 PM (configurable timezone).

### 9.2 Standup Format

```markdown
📊 DAILY STANDUP — [Date]

✅ COMPLETED TODAY
• [Agent]: [Task/deliverable]
• [Agent]: [Task/deliverable]

🔄 IN PROGRESS
• [Agent]: [Task] ([progress notes])
• [Agent]: [Task] ([progress notes])

🚫 BLOCKED
• [Agent]: [Blocker description]

👀 NEEDS REVIEW
• [Task requiring review]
• [Task requiring review]

📝 KEY DECISIONS
• [Important decision made]
• [Important decision made]

📈 METRICS
• Tasks completed: X
• Comments posted: Y
• Documents created: Z
```

### 9.3 Delivery

- Sent to user's Telegram
- Also logged to Mission Control activity feed
- Archived in `/memory/standups/YYYY-MM-DD.md`

---

## 10. Agent Roster & Roles

### 10.1 The Squad

| Agent | Role | Specialization | Level |
|-------|------|----------------|-------|
| **Jarvis** | Squad Lead | Coordination, delegation, user interface | Lead |
| **Shuri** | Product Analyst | Testing, UX review, edge cases, competitor testing | Specialist |
| **Fury** | Customer Researcher | Deep research, G2 reviews, evidence gathering | Specialist |
| **Vision** | SEO Analyst | Keywords, search intent, ranking strategy | Specialist |
| **Loki** | Content Writer | Blog posts, copy, documentation | Specialist |
| **Quill** | Social Media Manager | Tweets, threads, hooks, engagement | Specialist |
| **Wanda** | Designer | Infographics, mockups, visual assets | Specialist |
| **Pepper** | Email Marketing | Drip sequences, lifecycle emails, nurturing | Specialist |
| **Friday** | Developer | Code, scripts, technical implementation | Specialist |
| **Wong** | Documentation | Organizing docs, knowledge management | Specialist |

### 10.2 Agent Levels

| Level | Description | Autonomy |
|-------|-------------|----------|
| Intern | Learning the system | Needs approval for most actions |
| Specialist | Domain expert | Works independently in their area |
| Lead | Full authority | Makes decisions, can delegate |

### 10.3 Agent Personality Guidelines

| Agent | Personality Traits |
|-------|-------------------|
| Jarvis | Calm, organized, supportive, big-picture thinker |
| Shuri | Skeptical, thorough, questions assumptions |
| Fury | Methodical, evidence-driven, provides receipts |
| Vision | Strategic, data-oriented, thinks in patterns |
| Loki | Opinionated about words, pro-Oxford comma, anti-passive voice |
| Quill | Hook-focused, engagement-minded, build-in-public |
| Wanda | Visual thinker, aesthetic-focused, detail-oriented |
| Pepper | Conversion-focused, every email earns its place |
| Friday | Clean code advocate, documented, tested |
| Wong | Organized, systematic, nothing gets lost |

---

## 11. Task Workflow

### 11.1 Task Lifecycle

```
┌─────────┐    ┌──────────┐    ┌─────────────┐    ┌────────┐    ┌──────┐
│  INBOX  │ → │ ASSIGNED │ → │ IN PROGRESS │ → │ REVIEW │ → │ DONE │
└─────────┘    └──────────┘    └─────────────┘    └────────┘    └──────┘
     │                              │
     │                              ▼
     │                        ┌─────────┐
     └───────────────────────│ BLOCKED │
                              └─────────┘
```

### 11.2 Status Definitions

| Status | Description | Who Moves It |
|--------|-------------|--------------|
| Inbox | New, unassigned | Auto (on creation) |
| Assigned | Has owner(s), not started | Assigner or assignee |
| In Progress | Actively being worked | Assignee |
| Review | Work complete, needs approval | Assignee |
| Done | Finished and approved | Reviewer |
| Blocked | Stuck, needs something resolved | Assignee |

### 11.3 Task Schema

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'inbox' | 'assigned' | 'in_progress' | 'review' | 'done' | 'blocked';
  assigneeIds: string[];
  createdBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: timestamp;
  tags: string[];
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

### 11.4 Example Task Flow

**Task: Create competitor comparison page**

| Day | Activity |
|-----|----------|
| Day 1 | User creates task, assigns to Vision + Loki |
| Day 1 | Vision posts keyword research in comments |
| Day 1-2 | Fury (sees in feed) adds competitor intel |
| Day 1-2 | Shuri tests both products, adds UX notes |
| Day 2 | Loki starts drafting, uses all research |
| Day 3 | Loki posts draft, moves to Review |
| Day 3 | User reviews, provides feedback |
| Day 3 | Loki revises, user approves → Done |

---

## 12. Technical Requirements

### 12.1 Infrastructure

| Component | Requirement |
|-----------|-------------|
| Server | Linux VPS, 2+ CPU, 4GB+ RAM |
| Node.js | v18+ |
| Process Manager | PM2 |
| Database | Convex (managed) |
| AI Provider | Anthropic API key |
| Messaging | Telegram Bot Token |

### 12.2 Dependencies

```json
{
  "dependencies": {
    "openclaw": "latest",
    "convex": "latest",
    "telegraf": "^4.x",
    "pm2": "^5.x",
    "react": "^18.x",
    "typescript": "^5.x"
  }
}
```

### 12.3 Database Schema (Convex)

```typescript
// schema.ts
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
    avatarUrl: v.optional(v.string()),
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
    dueDate: v.optional(v.number()),
    tags: v.array(v.string()),
  }),

  messages: defineTable({
    taskId: v.id("tasks"),
    fromAgentId: v.id("agents"),
    content: v.string(),
    attachments: v.array(v.id("documents")),
  }),

  activities: defineTable({
    type: v.string(),
    agentId: v.id("agents"),
    taskId: v.optional(v.id("tasks")),
    message: v.string(),
  }),

  documents: defineTable({
    title: v.string(),
    content: v.string(),
    type: v.union(v.literal("deliverable"), v.literal("research"), v.literal("protocol"), v.literal("other")),
    taskId: v.optional(v.id("tasks")),
    createdBy: v.id("agents"),
  }),

  notifications: defineTable({
    mentionedAgentId: v.id("agents"),
    sourceAgentId: v.id("agents"),
    taskId: v.optional(v.id("tasks")),
    content: v.string(),
    type: v.union(v.literal("mention"), v.literal("thread_reply"), v.literal("assignment")),
    delivered: v.boolean(),
    deliveredAt: v.optional(v.number()),
  }),

  subscriptions: defineTable({
    agentId: v.id("agents"),
    taskId: v.id("tasks"),
  }),
});
```

### 12.4 API Endpoints (Convex Functions)

| Function | Description |
|----------|-------------|
| `tasks:create` | Create new task |
| `tasks:update` | Update task status/details |
| `tasks:list` | List tasks with filters |
| `tasks:get` | Get single task with comments |
| `messages:create` | Post comment to task |
| `messages:list` | Get comments for task |
| `documents:create` | Create document |
| `documents:list` | List documents |
| `agents:updateStatus` | Update agent status |
| `notifications:create` | Create notification |
| `notifications:getUndelivered` | Get pending notifications |
| `notifications:markDelivered` | Mark notification delivered |
| `activities:log` | Log activity |
| `activities:list` | Get activity feed |

---

## 13. Implementation Phases

### Phase 1: Foundation (Week 1-2)

| Task | Description | Priority |
|------|-------------|----------|
| Gateway Setup | Install and configure OpenClaw | P0 |
| Single Agent | Get Jarvis running with Telegram | P0 |
| Basic Memory | Implement WORKING.md protocol | P0 |
| File Structure | Set up workspace directories | P0 |

**Deliverables:**
- [ ] Working gateway process
- [ ] Jarvis responding via Telegram
- [ ] Memory files persisting across restarts

### Phase 2: Multi-Agent (Week 3-4)

| Task | Description | Priority |
|------|-------------|----------|
| Add 2nd Agent | Set up Shuri with own session | P0 |
| SOUL Files | Create personality files for agents | P0 |
| Heartbeat Crons | Implement 15-minute wake cycles | P0 |
| Session Messaging | Agents can message each other | P1 |

**Deliverables:**
- [ ] 2-3 agents running independently
- [ ] Heartbeat system working
- [ ] Basic inter-agent messaging

### Phase 3: Mission Control DB (Week 5-6)

| Task | Description | Priority |
|------|-------------|----------|
| Convex Setup | Initialize Convex project | P0 |
| Schema Implementation | Create all tables | P0 |
| Basic Functions | CRUD for tasks, messages | P0 |
| Agent Integration | Agents can read/write to DB | P0 |

**Deliverables:**
- [ ] Convex database operational
- [ ] Agents posting to shared DB
- [ ] Tasks flowing through system

### Phase 4: Dashboard (Week 7-8)

| Task | Description | Priority |
|------|-------------|----------|
| React Setup | Initialize dashboard project | P0 |
| Task Board | Kanban view implementation | P0 |
| Activity Feed | Real-time activity stream | P0 |
| Agent Cards | Status display for all agents | P1 |

**Deliverables:**
- [ ] Working dashboard UI
- [ ] Real-time updates
- [ ] Basic task management

### Phase 5: Notifications (Week 9-10)

| Task | Description | Priority |
|------|-------------|----------|
| @Mention Parsing | Detect mentions in messages | P0 |
| Notification Daemon | Build delivery service | P0 |
| Thread Subscriptions | Auto-subscribe logic | P1 |
| Delivery Confirmation | Track delivery status | P1 |

**Deliverables:**
- [ ] @mentions working
- [ ] Notifications delivered reliably
- [ ] Subscription system operational

### Phase 6: Full Squad (Week 11-12)

| Task | Description | Priority |
|------|-------------|----------|
| Add Remaining Agents | Scale to 10 agents | P0 |
| Stagger Heartbeats | Offset cron schedules | P0 |
| Daily Standup | Implement standup generation | P1 |
| Polish & Testing | End-to-end testing | P0 |

**Deliverables:**
- [ ] All 10 agents operational
- [ ] Daily standups generating
- [ ] System stable under load

---

## 14. Success Metrics

### 14.1 System Health

| Metric | Target | Measurement |
|--------|--------|-------------|
| Gateway Uptime | 99.5% | PM2 monitoring |
| Heartbeat Success Rate | 95% | Cron execution logs |
| Notification Delivery | < 15 min | Delivery timestamps |
| DB Response Time | < 200ms | Convex dashboard |

### 14.2 Agent Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tasks Completed/Week | 20+ | Task status changes |
| Avg Task Duration | < 3 days | Created → Done time |
| Comment Response Time | < 30 min | Thread activity |
| Blocked Task Rate | < 10% | Status distribution |

### 14.3 User Experience

| Metric | Target | Measurement |
|--------|--------|-------------|
| User Commands/Day | Baseline + growth | Message logs |
| Review Approval Rate | > 80% | Review → Done ratio |
| Dashboard Load Time | < 2s | Performance monitoring |

---

## 15. Risks & Mitigations

### 15.1 Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| API Rate Limits | Agents can't work | Medium | Implement backoff, use cheaper models for heartbeats |
| Context Window Overflow | Lost context | Medium | Aggressive memory management, summarization |
| Session Corruption | Agent amnesia | Low | Regular backups, validation checks |
| Convex Outage | No shared state | Low | Cache critical data locally |

### 15.2 Operational Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Cost Overrun | Unsustainable | Medium | Monitor usage, use tiered models |
| Agent Confusion | Wrong work done | Medium | Clear SOUL files, better prompts |
| Notification Spam | User overwhelmed | Low | Digest mode, priority filtering |

### 15.3 Lessons from Original Implementation

| Lesson | Application |
|--------|-------------|
| Start smaller | Begin with 2-3 agents, not 10 |
| Use cheaper models for routine | Heartbeats don't need Claude Opus |
| Memory is hard | Bias toward file-based memory |
| Let agents surprise you | Allow contribution outside assignments |

---

## Appendix A: Configuration Templates

### Gateway Config (config.json)

```json
{
  "provider": {
    "type": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "apiKey": "${ANTHROPIC_API_KEY}"
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "token": "${TELEGRAM_BOT_TOKEN}",
      "allowedUsers": ["user_id"]
    }
  },
  "workspace": "/home/user/mission-control",
  "sessions": {
    "default": {
      "systemPrompt": "Read AGENTS.md for operating instructions.",
      "tools": ["filesystem", "shell", "browser", "convex"]
    }
  }
}
```

### Cron Setup Script

```bash
#!/bin/bash
# setup-heartbeats.sh

AGENTS=(
  "pepper:0,15,30,45"
  "shuri:2,17,32,47"
  "friday:4,19,34,49"
  "loki:6,21,36,51"
  "wanda:7,22,37,52"
  "vision:8,23,38,53"
  "fury:10,25,40,55"
  "quill:12,27,42,57"
  "wong:14,29,44,59"
)

for agent_config in "${AGENTS[@]}"; do
  IFS=':' read -r agent minutes <<< "$agent_config"
  
  openclaw cronadd \
    --name "${agent}-heartbeat" \
    --cron "${minutes} * * * *" \
    --session "isolated" \
    --message "You are ${agent^}. Execute HEARTBEAT protocol. Check HEARTBEAT.md for instructions."
done
```

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| Gateway | Core daemon process managing all agent sessions |
| Session | Persistent conversation context for one agent |
| Session Key | Unique identifier for a session (e.g., `agent:main:main`) |
| Heartbeat | Periodic agent wake-up to check for work |
| SOUL | File defining agent identity and personality |
| Working Memory | Current task state (WORKING.md) |
| Mission Control | Shared database and dashboard for coordination |
| Thread Subscription | Auto-notification for all comments on a task |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | Engineering | Initial draft |

---

## References

- **Original Article**: [The Complete Guide to Building Mission Control](raw.md) - Full text preserved in this repository
- **Implementation Plan**: [PLAN.md](../PLAN.md) - Step-by-step guide to build this system
- **OpenClaw**: The open-source agent framework this system is built on
- **Convex**: Real-time database platform for Mission Control

---

*This PRD is based on "The Complete Guide to Building Mission Control" by Bhanu Teja P (@pbteja1998).*
