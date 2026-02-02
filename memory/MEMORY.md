# MEMORY.md — Long-Term Knowledge

This file contains curated, important information that should persist across all sessions. Add entries here when you learn something that will be valuable in the future.

---

## System Facts

### Mission Control Architecture

- **Gateway**: Core daemon managing all agent sessions
- **Sessions**: Independent conversation contexts per agent
- **Convex**: Real-time database for shared task/message storage
- **Heartbeats**: 15-minute wake cycles for cost efficiency

### Agent Roster

| Agent | Role | Session Key |
|-------|------|-------------|
| Jarvis | Squad Lead | agent:main:main |
| Shuri | Product Analyst | agent:product-analyst:main |
| Fury | Customer Researcher | agent:customer-researcher:main |
| Vision | SEO Analyst | agent:seo-analyst:main |
| Loki | Content Writer | agent:content-writer:main |
| Quill | Social Media | agent:social-media-manager:main |
| Wanda | Designer | agent:designer:main |
| Pepper | Email Marketing | agent:email-marketing:main |
| Friday | Developer | agent:developer:main |
| Wong | Documentation | agent:notion-agent:main |

---

## Key Decisions

*Record important decisions here with date and rationale.*

### [Date] Decision Title

**Decision:** What was decided  
**Rationale:** Why this choice was made  
**Implications:** What this means going forward

---

## Lessons Learned

*Add entries when something important is discovered.*

### Memory Management

- Always write important information to files, not "mental notes"
- WORKING.md is the most critical file — read it first, update it often
- Daily notes provide backup context if WORKING.md is unclear

### Coordination

- @mention agents when their input is needed
- Check activity feed for relevant discussions
- Update task status promptly to keep everyone informed

---

## Project Context

*Add information about the project/product being worked on.*

---

## Contacts & Resources

*Links, credentials (references only, not actual secrets), and key resources.*

---

## Changelog

| Date | Entry | Added By |
|------|-------|----------|
| Week 2 | Initial system facts | System setup |
