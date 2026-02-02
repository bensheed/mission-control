# Mission Control

A multi-agent AI orchestration system where 10 specialized AI agents work together as a coordinated team.

> **Credit**: This project is based on ["The Complete Guide to Building Mission Control"](https://x.com/pbteja1998/status/2017662163540971756) by [Bhanu Teja P (@pbteja1998)](https://x.com/pbteja1998). The original article is preserved in [docs/raw.md](docs/raw.md).

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

## Architecture

```
User (Telegram/Dashboard) 
    ↓
Gateway (Session Manager + Cron Scheduler)
    ↓
Agent Sessions (10 independent AI agents)
    ↓
Shared Infrastructure (Convex DB + File System + AI Provider)
```

## Documentation

- [Implementation Plan](PLAN.md) - Step-by-step guide to build the system (start here!)
- [Product Requirements Document (PRD)](docs/PRD.md) - Full system specification
- [Original Article](docs/raw.md) - Source material by @pbteja1998

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
- Convex account
- Anthropic API key
- Telegram bot token (optional)

### Quick Start

```bash
# Install dependencies
npm install

# Initialize Convex
npx convex dev

# Seed the database
npx convex run seed:agents

# Start the dashboard
cd dashboard && npm run dev

# Start notification daemon (in another terminal)
pm2 start services/ecosystem.config.js
```

### Documentation

- [Implementation Plan](PLAN.md) - 12-week build guide
- [PRD](docs/PRD.md) - Full system specification
- [Runbook](docs/RUNBOOK.md) - Operational procedures
- [Original Article](docs/raw.md) - Source material by @pbteja1998

## Project Structure

```
mission-control/
├── agents/           # Agent SOUL.md personality files
├── convex/           # Database schema and functions
├── dashboard/        # React dashboard (Next.js 14)
├── docs/             # PRD, runbook, original article
├── memory/           # Working memory, daily notes, standups
├── scripts/          # Setup and utility scripts
├── services/         # Notification daemon, standup generator
└── config/           # Configuration files
```

## Status

✅ **Complete** - All 12 weeks of implementation finished

- 10 AI agents with unique personalities
- Convex real-time database
- @mention notification system
- Subscription preferences & alert routing
- Daily standup generation
- React dashboard with task board

## License

MIT
