# README demo GIF

Builds `docs/images/story.gif`: real screenshots of the tracker (captured with Playwright) composed with Remotion. **All data shown is made up** (`mock-supabase.js`, `tailor-api.json`); no real people or companies.

```bash
cd media/readme-demo
npm install
npm run capture   # node capture.mjs -> public/shots/*.png (light theme, 1600x900 @2x)
npm run render    # ./render.sh -> Remotion frames -> ffmpeg palette -> gifsicle -> ../../docs/images/story.gif
```

`render.sh` runs `remotion render src/index.jsx Story out/frames --sequence --browser-executable=<chromium>`
(Remotion cannot download its own browser offline; set `CHROME=/path/to/chrome` to override). Frames are encoded to a 64-colour GIF with ffmpeg and compressed with gifsicle (`--lossy`) to stay under 5 MB. Requires `ffmpeg` and Playwright (installed globally).

Vertical teaser (1080x1920, 30 fps, ~10 s) for phones and social: `npm run capture:mobile` (390x844 @3x shots to `public/shots/mobile/`), then `npm run render:teaser` (`render-teaser.sh`) renders the `Teaser` composition (`src/Teaser.jsx`) to an MP4 and a 540x960 GIF.
Outputs go to `$OUTDIR` (default: the session scratchpad); copy them into `docs/images/` when you want them in the README. Text stays out of the top 220 px and bottom 300 px for social UI overlays.

The "Built for this role." beat (requirement chips, bullet library, matching bullets assembling a resume page) is the illustrative `src/BulletMatch.jsx`, shared by `Story` (landscape) and `Teaser` (portrait). `./render-story-mp4.sh` renders the story as a 1920x1080 MP4.

Teaser V2 (1080x1920, 30 fps, ~18 s, one headline per scene): `npm run render:teaser-v2` (`render-teaser-v2.sh`) renders the `TeaserV2` composition (`src/TeaserV2.jsx`) to `career-command-center-teaser-v2.mp4` and a 540x960 GIF in `$OUTDIR`. It reuses the mobile shots from `public/shots/mobile/`; the tailoring scene is built from simple components with fictional text only.

Landscape Teaser V2 (1920x1080, 30 fps, same scenes and timing): `npm run render:landscape` (`render-landscape.sh`) renders `TeaserV2Landscape` (`src/TeaserV2Landscape.jsx`, reusing the pieces exported from `TeaserV2.jsx`) to `career-command-center-landscape.mp4` and a 1200x675 GIF in `$OUTDIR`.
