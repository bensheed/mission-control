#!/bin/bash
# create-daily-notes.sh
# Creates a new daily notes file for today if it doesn't exist

TODAY=$(date -u +%Y-%m-%d)
NOTES_FILE="memory/${TODAY}.md"

if [ -f "$NOTES_FILE" ]; then
  echo "Daily notes already exist for $TODAY"
  exit 0
fi

cat > "$NOTES_FILE" << EOF
# Daily Notes — ${TODAY}

## Summary

*Add a brief summary of today's activities at end of day*

---

## Activity Log

### [Time UTC] — [Agent Name]

**Activity:** [What was done]

---

## Tasks Touched

| Task | Status | Agent | Action |
|------|--------|-------|--------|
| | | | |

---

## Decisions Made

*Record any significant decisions with rationale*

---

## Blockers Encountered

*Note any blockers and their resolution status*

---

## Tomorrow's Priorities

1. 
2. 
3. 
EOF

echo "✓ Created daily notes: $NOTES_FILE"
