#!/usr/bin/env bash
# Start SwasthyaSetu dev server detached from this shell so it survives tool timeouts.
cd "$(dirname "$0")"
setsid nohup node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 3000 --strictPort > /tmp/swasthyasetu-dev.log 2>&1 < /dev/null &
echo "Dev server starting on http://localhost:3000 — log: /tmp/swasthyasetu-dev.log"
