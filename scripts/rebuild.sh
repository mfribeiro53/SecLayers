#!/bin/bash
set -euo pipefail

LOG=/tmp/seclayers-rebuild.log

notify() {
  osascript -e "display notification \"$1\" with title \"SecLayer Build\" sound name \"Glass\""
}

{
  /usr/local/bin/docker stop seclayers-test 2>/dev/null || true
  /usr/local/bin/docker rm seclayers-test 2>/dev/null || true
  /usr/local/bin/docker build -t seclayers /Users/miguelfribeiro/Documents/SecLayer
  /usr/local/bin/docker run -d -p 3020:3000 --name seclayers-test seclayers
} >> "$LOG" 2>&1 && notify "Build succeeded. Running on port 3020." || notify "Build FAILED. Check $LOG for details."
