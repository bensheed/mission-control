# HEARTBEAT.md — Periodic Wake Protocol

This document defines what agents do when they wake up for a scheduled heartbeat.

---

## Heartbeat Schedule

Agents wake every 15 minutes on a staggered schedule:

| Agent | Minutes | Cron Expression |
|-------|---------|-----------------|
| Pepper | :00, :15, :30, :45 | `0,15,30,45 * * * *` |
| Shuri | :02, :17, :32, :47 | `2,17,32,47 * * * *` |
| Friday | :04, :19, :34, :49 | `4,19,34,49 * * * *` |
| Loki | :06, :21, :36, :51 | `6,21,36,51 * * * *` |
| Wanda | :07, :22, :37, :52 | `7,22,37,52 * * * *` |
| Vision | :08, :23, :38, :53 | `8,23,38,53 * * * *` |
| Fury | :10, :25, :40, :55 | `10,25,40,55 * * * *` |
| Quill | :12, :27, :42, :57 | `12,27,42,57 * * * *` |
| Wong | :14, :29, :44, :59 | `14,29,44,59 * * * *` |

**Note:** Jarvis runs as a main session and doesn't use heartbeats.

---

## On Wake Checklist

Execute these steps in order:

### 1. Load Context

- [ ] Read `memory/WORKING.md` for ongoing tasks
- [ ] If task in progress, prepare to resume it
- [ ] Search session memory if context is unclear

### 2. Check for Urgent Items

- [ ] Check Mission Control for @mentions directed at you
- [ ] Check for tasks newly assigned to you
- [ ] Look for any blockers that have been resolved

### 3. Scan Activity Feed

- [ ] Any discussions you should contribute to?
- [ ] Any decisions that affect your work?
- [ ] Any completed work that unblocks you?

### 4. Take Action or Stand Down

**If there's work to do:**
- Do the work
- Update WORKING.md
- Post progress to Mission Control
- Log activity to daily notes

**If nothing to do:**
- Report `HEARTBEAT_OK`
- Session will terminate

---

## Before Sleep Checklist

Before your session terminates:

- [ ] Update `memory/WORKING.md` with current state
- [ ] Log any significant activity to daily notes
- [ ] Ensure Mission Control reflects accurate status
- [ ] Report final status

---

## Heartbeat Response Format

When reporting status, use this format:

### If Active Work

```
HEARTBEAT REPORT — [Agent Name]
Status: ACTIVE
Current Task: [Task title]
Progress: [What you did this cycle]
Next: [What happens next heartbeat]
```

### If Idle

```
HEARTBEAT_OK — [Agent Name]
No pending work. Standing by.
```

### If Blocked

```
HEARTBEAT REPORT — [Agent Name]  
Status: BLOCKED
Task: [Task title]
Blocker: [What's preventing progress]
Need: [What would unblock you]
```

---

## Cost Optimization

Heartbeats should be efficient:

1. **Don't load unnecessary context** — Only read what you need
2. **Be decisive** — Check, act (or don't), report, terminate
3. **Use cheaper models for routine checks** — Save expensive models for creative work
4. **Batch updates** — Make all Mission Control updates at once if possible

---

## Emergency Protocol

If something urgent happens between heartbeats:

1. The notification daemon will wake you immediately via @mention
2. Respond to urgent items before routine checks
3. If you can't handle it, @mention Jarvis or the human
