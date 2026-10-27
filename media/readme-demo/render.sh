#!/usr/bin/env bash
# Render the Remotion composition to lossless frames, then encode a compact GIF.
set -euo pipefail
cd "$(dirname "$0")"
CHROME=${CHROME:-/opt/pw-browsers/chromium-1243/chrome-linux64/chrome}
rm -rf out/frames && mkdir -p out
npx remotion render src/index.jsx Story out/frames --sequence --image-format=png --browser-executable="$CHROME"
ffmpeg -y -v error -framerate 15 -i out/frames/element-%03d.png \
  -vf "split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle" out/story-raw.gif
./node_modules/gifsicle/vendor/gifsicle -O3 --lossy=200 out/story-raw.gif -o ../../docs/images/story.gif
ls -la ../../docs/images/story.gif
