# Mission Control Dashboard

React dashboard for the Mission Control AI Agent Squad.

## Features

- **Kanban Task Board** — Visual task management with drag-and-drop
- **Real-time Updates** — Powered by Convex subscriptions
- **Agent Status Cards** — See what each agent is working on
- **Activity Feed** — Live stream of system activity
- **Warm Editorial Design** — Easy on the eyes for long sessions

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Update `NEXT_PUBLIC_CONVEX_URL` with your Convex deployment URL

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Convex (real-time)
- **Icons**: Lucide React
- **Dates**: date-fns

## Directory Structure

```
dashboard/
├── src/
│   ├── app/
│   │   ├── globals.css      # Global styles & Tailwind
│   │   ├── layout.tsx       # Root layout with Convex provider
│   │   └── page.tsx         # Main dashboard page
│   ├── components/
│   │   ├── ConvexClientProvider.tsx  # Convex React setup
│   │   ├── Header.tsx       # Dashboard header
│   │   ├── TaskBoard.tsx    # Kanban board
│   │   ├── TaskCard.tsx     # Individual task card
│   │   ├── ActivityFeed.tsx # Activity stream (Week 8)
│   │   └── AgentCard.tsx    # Agent status (Week 8)
│   └── lib/
│       └── utils.ts         # Helper functions
├── convex/                  # Symlink to ../convex for types
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Design System

### Colors

| Name | Hex | Usage |
|------|-----|-------|
| Cream | #FEFCF3 | Background |
| Sand | #F5F0E8 | Secondary background |
| Terracotta | #C1666B | Accent, alerts |
| Forest | #4A7C59 | Success, positive |
| Slate | #36454F | Secondary text |
| Ink | #1A1A2E | Primary text |

### Typography

- **Headers**: Georgia (serif)
- **Body**: Inter (sans-serif)

## Development

The dashboard connects to Convex for real-time data. Make sure:

1. The Convex backend is running (`npx convex dev` in project root)
2. Agents have been seeded (`npx convex run agents:seed`)
3. The `NEXT_PUBLIC_CONVEX_URL` matches your deployment
