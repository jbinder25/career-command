#!/usr/bin/env bash
# Render the vertical Teaser composition to MP4 (1080x1920) and a light GIF (540x960).
set -euo pipefail
cd "$(dirname "$0")"
CHROME=${CHROME:-/opt/pw-browsers/chromium-1243/chrome-linux64/chrome}
OUTDIR=${OUTDIR:-/tmp/claude-0/-home-user/36b7efbd-f5b4-594b-b815-c1a33776d1fb/scratchpad}
mkdir -p "$OUTDIR" out && rm -rf out/teaser-frames
npx remotion render src/index.jsx Teaser out/teaser-frames --sequence --image-format=png --browser-executable="$CHROME"
ffmpeg -y -v error -framerate 30 -i out/teaser-frames/element-%03d.png \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart "$OUTDIR/career-command-center-teaser.mp4"
ffmpeg -y -v error -framerate 30 -i out/teaser-frames/element-%03d.png \
  -vf "fps=15,scale=540:960:flags=lanczos,split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle" out/teaser-raw.gif
./node_modules/gifsicle/vendor/gifsicle -O3 --lossy=${LOSSY:-120} out/teaser-raw.gif -o "$OUTDIR/career-command-center-teaser.gif"
ls -la "$OUTDIR"/career-command-center-teaser.*
