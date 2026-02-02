#!/bin/bash
# setup-heartbeats.sh
# Sets up heartbeat cron jobs for all agents using OpenClaw

set -u

echo "Setting up heartbeat crons for Mission Control agents..."
echo ""

# Check if openclaw is installed
if ! command -v openclaw &> /dev/null; then
  echo "Error: OpenClaw is not installed."
  echo "Install with: npm install -g openclaw@latest"
  echo "Then run: openclaw onboard"
  exit 1
fi

# Agent configurations: name:session_key:minutes
# Jarvis runs as main session, doesn't need heartbeat cron
# All other agents wake on 15-minute intervals with staggered offsets
AGENTS=(
  "pepper:agent:email-marketing:main:0,15,30,45"
  "shuri:agent:product-analyst:main:2,17,32,47"
  "friday:agent:developer:main:4,19,34,49"
  "loki:agent:content-writer:main:6,21,36,51"
  "wanda:agent:designer:main:7,22,37,52"
  "vision:agent:seo-analyst:main:8,23,38,53"
  "fury:agent:customer-researcher:main:10,25,40,55"
  "quill:agent:social-media-manager:main:12,27,42,57"
  "wong:agent:notion-agent:main:14,29,44,59"
)

for agent_config in "${AGENTS[@]}"; do
  IFS=':' read -r name session_key minutes <<< "$agent_config"
  
  # Capitalize first letter for display name
  display_name="$(tr '[:lower:]' '[:upper:]' <<< ${name:0:1})${name:1}"
  
  echo "Adding heartbeat for $display_name ($session_key) at minutes: $minutes"
  
  openclaw cron add \
    --name "${name}-heartbeat" \
    --schedule "${minutes} * * * *" \
    --session-key "$session_key" \
    --message "You are ${display_name}. Execute HEARTBEAT protocol per HEARTBEAT.md. Read your SOUL.md at agents/${name}/SOUL.md for your identity."
done

echo ""
echo "✓ Heartbeat crons configured for ${#AGENTS[@]} agents"
echo ""
echo "Note: Jarvis (agent:main:main) runs as a main session and doesn't use heartbeats."
echo ""
echo "Useful commands:"
echo "  openclaw cron list              - List all cron jobs"
echo "  openclaw cron remove <name>     - Remove a cron job"
echo "  openclaw gateway status         - Check gateway status"
