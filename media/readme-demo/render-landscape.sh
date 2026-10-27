#!/usr/bin/env bash
# Render the landscape TeaserV2Landscape composition to MP4 (1920x1080) and a README GIF (1200x675, 15 fps).
set -euo pipefail
cd "$(dirname "$0")"
CHROME=${CHROME:-/opt/pw-browsers/chromium-1243/chrome-linux64/chrome}
OUTDIR=${OUTDIR:-/tmp/claude-0/-home-user/36b7efbd-f5b4-594b-b815-c1a33776d1fb/scratchpad}
mkdir -p "$OUTDIR" out && rm -rf out/teaser-v2-landscape-frames
npx remotion render src/index.jsx TeaserV2Landscape out/teaser-v2-landscape-frames --sequence --image-format=png --browser-executable="$CHROME"
ffmpeg -y -v error -framerate 30 -i out/teaser-v2-landscape-frames/element-%03d.png \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart "$OUTDIR/career-command-center-landscape.mp4"
ffmpeg -y -v error -framerate 30 -i out/teaser-v2-landscape-frames/element-%03d.png \
  -vf "fps=15,scale=1200:675:flags=lanczos,split[a][b];[a]palettegen=max_colors=${COLORS:-64}:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle" out/teaser-v2-landscape-raw.gif
./node_modules/gifsicle/vendor/gifsicle -O3 --lossy=${LOSSY:-120} out/teaser-v2-landscape-raw.gif -o "$OUTDIR/career-command-center-landscape.gif"
ls -la "$OUTDIR"/career-command-center-landscape.*
