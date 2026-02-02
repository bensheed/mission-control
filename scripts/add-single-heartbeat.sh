#!/bin/bash
# add-single-heartbeat.sh
# Adds a heartbeat cron for a single agent
# Usage: ./add-single-heartbeat.sh <agent-name> <session-key> <minutes>
# Example: ./add-single-heartbeat.sh shuri agent:product-analyst:main "2,17,32,47"

set -u

if [ $# -lt 3 ]; then
  echo "Usage: $0 <agent-name> <session-key> <minutes>"
  echo "Example: $0 shuri agent:product-analyst:main \"2,17,32,47\""
  exit 1
fi

AGENT_NAME=$1
SESSION_KEY=$2
MINUTES=$3

# Capitalize first letter for display name
DISPLAY_NAME="$(tr '[:lower:]' '[:upper:]' <<< ${AGENT_NAME:0:1})${AGENT_NAME:1}"

echo "Adding heartbeat for $DISPLAY_NAME..."
echo "  Session: $SESSION_KEY"
echo "  Schedule: $MINUTES * * * *"

clawdbot cronadd \
  --name "${AGENT_NAME}-heartbeat" \
  --cron "${MINUTES} * * * *" \
  --session "isolated" \
  --session-key "$SESSION_KEY" \
  --message "You are ${DISPLAY_NAME}. Execute HEARTBEAT protocol per HEARTBEAT.md. Read your SOUL.md at agents/${AGENT_NAME}/SOUL.md for your identity."

echo ""
echo "✓ Heartbeat configured for $DISPLAY_NAME"
echo ""
echo "To verify: clawdbot cronlist"
echo "To remove: clawdbot cronremove --name ${AGENT_NAME}-heartbeat"
