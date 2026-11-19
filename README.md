# gta6-cover-art-01-entry

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Fawulana/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Fawulana/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Shore Cover Lab — an offline web app that turns your photos and a caption into GTA-style multi-panel cover art, exported as a PNG to share. Pick up to three photos (samples included, or your own uploads), choose one of five poster layouts, a sunset or neon colour grade, and a title in bold Anton lettering with a Pacifico script subtitle. Click a panel to select it, drag to move the photo, scroll to zoom. Exports 1080×1080, 1080×1350 and 1920×1080. Everything runs in the browser; photos never leave your machine. All artwork is original or image-model-made — no Rockstar Games logo, artwork or font.

## How it works

`app/src/cover.js` (`drawCover`, `renderCover`) draws the cover: `layoutPanels` places the panels, `drawPanelPhoto` cover-fits each photo with its zoom and pan, `gradePanel` stamps the colour wash, and `drawTitleBlock` letters the title with a sunburst band. `app/src/grades.js` holds the five grades, `app/src/main.js` wires the editor, and `app/src/shots.js` sets up the fixed screenshot scenes.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080.

---

<sub>Entered on [make.fun](https://make.fun/?ref=fawulan&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
