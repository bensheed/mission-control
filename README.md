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

> 🚧 Implementation in progress. See the [PRD](docs/PRD.md) for the full roadmap.

## License

MIT
