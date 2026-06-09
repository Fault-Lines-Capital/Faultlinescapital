#!/bin/bash
# Fault Lines Capital — local dev server
cd "$(dirname "$0")"
PORT=8765

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   FAULT LINES CAPITAL — ONLINE       ║"
echo "  ╚══════════════════════════════════════╝"
echo ""
echo "  Local:   http://localhost:$PORT"
echo "  Network: http://$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}'):$PORT"
echo ""
echo "  Press Ctrl+C to stop."
echo ""

if command -v python3 &>/dev/null; then
    python3 -m http.server "$PORT"
elif command -v python &>/dev/null; then
    python -m http.server "$PORT"
else
    echo "Error: Python not found. Install Python 3 to run the server."
    exit 1
fi
