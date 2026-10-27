#!/usr/bin/env bash
# Landscape story as a 1920x1080 h264 MP4 (Remotion --scale=1.6).
set -euo pipefail
cd "$(dirname "$0")"
CHROME=${CHROME:-/opt/pw-browsers/chromium-1243/chrome-linux64/chrome}
OUTDIR=${OUTDIR:-/tmp/claude-0/-home-user/36b7efbd-f5b4-594b-b815-c1a33776d1fb/scratchpad}
npx remotion render src/index.jsx Story "$OUTDIR/career-command-center-story.mp4" --codec=h264 --crf=18 --scale=1.6 --pixel-format=yuv420p --browser-executable="$CHROME"
