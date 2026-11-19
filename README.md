# gta6-cover-art-01-entry

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Fawulana/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Fawulana/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Heat Cover Studio — an offline web app that turns your photos and a caption into a bold GTA-style cover, exported as a PNG to share. One hero photo runs full-bleed, three tilted snapshot prints overlap the top, and a slashed title band with a striped setting sun carries the title in huge Anton lettering with a Pacifico script subtitle. Pick up to four photos (samples included, or your own uploads), choose one of three compositions and four colour tones, click any zone to select it, drag to move the photo, scroll to zoom. Exports 1080×1080, 1080×1350 and 1920×1080. Everything runs in the browser; photos never leave your machine. All artwork is original or image-model-made — no Rockstar Games logo, artwork or font.

## How it works

`app/src/poster.js` (`drawPoster`, `renderPoster`) draws the cover: `zoneRects` places the hero, the snapshot prints or the panel grid, `drawZonePhoto` cover-fits each photo with its zoom and pan, `drawPrint` frames the tilted snapshots with handwritten captions, `drawStripedSun` raises the retro sun behind the band, and `drawSlash` letters the title along the band's slope. `app/src/tones.js` holds the four tones, `app/src/editor.js` wires the editor, and `app/src/scenes.js` sets up the fixed screenshot scenes.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080.

---

<sub>Entered on [make.fun](https://make.fun/?ref=fawulan&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
