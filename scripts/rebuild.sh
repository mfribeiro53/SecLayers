#!/bin/bash
set -euo pipefail

LOG=/tmp/seclayers-rebuild.log
DOCKER=/usr/local/bin/docker
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE=seclayers
CONTAINER=seclayers-test
PORT=3020

notify() {
  osascript -e "display notification \"$1\" with title \"SecLayers Build\" sound name \"Glass\""
}

free_port() {
  local PORT_PID
  PORT_PID=$(lsof -ti :"$1" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$PORT_PID" ]; then
    kill -9 "$PORT_PID" 2>/dev/null || true
    sleep 1
  fi
}

rebuild() {
  "$DOCKER" stop "$CONTAINER" 2>/dev/null || true
  "$DOCKER" rm "$CONTAINER" 2>/dev/null || true
  free_port "$PORT"
  "$DOCKER" build -t "$IMAGE" "$PROJECT_DIR" || return 1
  "$DOCKER" run -d -p "$PORT":3000 --name "$CONTAINER" "$IMAGE" || return 1
  sleep 2
  "$DOCKER" inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null | grep -q '^true$' || return 1
}

if rebuild >> "$LOG" 2>&1; then
  notify "Build succeeded. Running on port $PORT."
  exit 0
else
  notify "Build FAILED. Check $LOG for details."
  exit 1
fi
