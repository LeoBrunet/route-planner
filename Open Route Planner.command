#!/bin/zsh
# Browser version: serves the map on http://localhost:8765 (needed for routing + location in Safari) and opens it.
cd "$(dirname "$0")"
if ! lsof -iTCP:8765 -sTCP:LISTEN >/dev/null 2>&1; then
  nohup python3 -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1 &
  sleep 1
fi
open "http://localhost:8765/route-planner.html"
