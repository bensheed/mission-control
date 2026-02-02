#!/bin/bash
# send-message.sh
# Send a message to another agent's session
# Usage: ./send-message.sh <session-key> "<message>"
# Example: ./send-message.sh agent:developer:main "Friday, can you review this code?"

set -u

if [ $# -lt 2 ]; then
  echo "Usage: $0 <session-key> \"<message>\""
  echo ""
  echo "Session keys:"
  echo "  agent:main:main              - Jarvis (Squad Lead)"
  echo "  agent:product-analyst:main   - Shuri (Product Analyst)"
  echo "  agent:developer:main         - Friday (Developer)"
  echo "  agent:customer-researcher:main - Fury (Customer Researcher)"
  echo "  agent:seo-analyst:main       - Vision (SEO Analyst)"
  echo "  agent:content-writer:main    - Loki (Content Writer)"
  echo "  agent:social-media-manager:main - Quill (Social Media)"
  echo "  agent:designer:main          - Wanda (Designer)"
  echo "  agent:email-marketing:main   - Pepper (Email Marketing)"
  echo "  agent:notion-agent:main      - Wong (Documentation)"
  echo ""
  echo "Example: $0 agent:developer:main \"Friday, can you review this code?\""
  exit 1
fi

SESSION_KEY=$1
MESSAGE=$2

echo "Sending message to session: $SESSION_KEY"
echo "Message: $MESSAGE"
echo ""

clawdbot sessions send --session "$SESSION_KEY" --message "$MESSAGE"

echo ""
echo "✓ Message sent"
