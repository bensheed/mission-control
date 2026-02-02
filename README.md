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

- **Agent Framework**: OpenClaw/Clawdbot
- **Database**: Convex (real-time)
- **AI Provider**: Anthropic Claude
- **Dashboard**: React + TypeScript
- **Process Manager**: PM2
- **Messaging**: Telegram Bot

## Getting Started

### Prerequisites

- Node.js v18+
- [Convex](https://convex.dev) account (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/bensheed/mission-control.git
cd mission-control

# Install root dependencies
npm install

# Install dashboard dependencies
cd dashboard && npm install && cd ..
```

### Convex Setup

```bash
# Login to Convex (creates account if needed)
npx convex login

# Start Convex dev server (creates project on first run)
npx convex dev
```

This will:
1. Create a new Convex project
2. Deploy the schema from `convex/schema.ts`
3. Generate TypeScript types in `convex/_generated/`
4. Output your deployment URL

### Seed the Database

```bash
# Add all 10 agents to the database
npx convex run seed:agents

# Create a sample task for testing
npx convex run seed:sampleTask
```

### Run the Dashboard

```bash
cd dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## License

MIT
