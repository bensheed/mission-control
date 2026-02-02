# Mission Control

A multi-agent AI orchestration system where 10 specialized AI agents work together as a coordinated team.

> **Credit**: This project is based on ["The Complete Guide to Building Mission Control"](https://x.com/pbteja1998/status/2017662163540971756) by [Bhanu Teja P (@pbteja1998)](https://x.com/pbteja1998). The original article is preserved in [docs/raw.md](docs/raw.md).

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bensheed/mission-control)

## Overview

Mission Control enables multiple AI agents to collaborate like a real team, with:
- **Persistent memory** across sessions
- **Shared workspace** for tasks and documents
- **Inter-agent communication** via @mentions
- **Task management** with full lifecycle tracking
- **Scheduled heartbeats** for cost-efficient operation

## The Squad

| Agent | Role | Specialization |
|-------|------|----------------|
| **Jarvis** | Squad Lead | Coordination, delegation, user interface |
| **Shuri** | Product Analyst | Testing, UX review, edge cases |
| **Fury** | Customer Researcher | Deep research, evidence gathering |
| **Vision** | SEO Analyst | Keywords, search intent, ranking |
| **Loki** | Content Writer | Blog posts, copy, documentation |
| **Quill** | Social Media | Tweets, threads, engagement |
| **Wanda** | Designer | Infographics, mockups, visuals |
| **Pepper** | Email Marketing | Drip sequences, lifecycle emails |
| **Friday** | Developer | Code, scripts, implementation |
| **Wong** | Documentation | Organizing docs, knowledge management |

## Tech Stack

- **Agent Runtime**: [OpenClaw](https://github.com/openclaw/openclaw) - The gateway that runs all agent sessions
- **Database**: [Convex](https://convex.dev) (real-time sync)
- **AI Provider**: Anthropic Claude (via OpenClaw)
- **Dashboard**: Next.js + TypeScript
- **Process Manager**: PM2

## Getting Started

### Prerequisites

- Node.js v22+
- [OpenClaw](https://github.com/openclaw/openclaw) installed and configured
- [Convex](https://convex.dev) account (free tier works)

### 1. Install OpenClaw

OpenClaw is the agent runtime that powers Mission Control. Install it globally:

```bash
npm install -g openclaw@latest

# Run the onboarding wizard
openclaw onboard
```

The wizard will configure your gateway, workspace, and AI provider (Anthropic recommended).

### 2. Clone This Repository

```bash
git clone https://github.com/bensheed/mission-control.git
cd mission-control

npm install
cd dashboard && npm install && cd ..
```

### 3. Configure OpenClaw Workspace

Copy the agent SOUL files to your OpenClaw workspace:

```bash
# Copy agent personalities to OpenClaw workspace
cp -r agents/* ~/.openclaw/workspace/agents/
```

### 4. Set Up Convex

```bash
npx convex login
npx convex dev
```

### 5. Seed the Database

```bash
npx convex run seed:agents
npx convex run seed:sampleTask
```

### 6. Set Up Agent Heartbeats

```bash
# Configure cron jobs for all agents
./scripts/setup-heartbeats.sh
```

### 7. Start Services

```bash
# Start the OpenClaw gateway (if not already running)
openclaw gateway start

# Start the notification daemon
pm2 start services/ecosystem.config.js

# Start the dashboard
cd dashboard && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## License

MIT
