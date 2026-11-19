// SPDX-License-Identifier: MIT
// Vice Heat Cover Studio — fixed scenes for screenshots: ?shot=cover draws one
// exported cover full frame (the app's own drawing, at the export size);
// ?shot=editor shows the editor with the sample photos loaded.
// window.__shotReady is set once painted.
import { COMPOSITIONS, SIZES, drawPoster } from './poster.js';
import { TONES } from './tones.js';
import { SAMPLES, loadSample, redraw, resetZones, state } from './editor.js';

/** Applies the scene's query params (composition, tone, title, subtitle, size, photos). */
export function applyScene(query) {
  const composition = query.get('composition');
  if (composition && COMPOSITIONS[composition]) state.composition = composition;
  const tone = query.get('tone');
  if (tone && TONES[tone]) state.tone = tone;
  const title = query.get('title');
  if (title !== null) state.title = title;
  const subtitle = query.get('subtitle');
  if (subtitle !== null) state.subtitle = subtitle;
  const size = query.get('size');
  if (size) {
    const found = SIZES.findIndex((s) => `${s.w}x${s.h}` === size);
    if (found >= 0) state.sizeIndex = found;
  }
  resetZones();
}

/** Loads the scene's photos: `photos=a,b,c,d` sample ids, or the four defaults. */
export async function loadScenePhotos(query) {
  const ids = (query.get('photos') || 'rider,boat,pool,gator').split(',');
  await Promise.all(ids.map((id, i) => {
    const sample = SAMPLES.find((s) => s.id === id) || SAMPLES[i % SAMPLES.length];
    return loadSample(i, sample.id);
  }));
}

/** Waits for the display fonts, then paints once and marks the scene ready. */
export async function paintWhenReady(paint) {
  await Promise.all([
    document.fonts.load('90px Anton'),
    document.fonts.load('40px Pacifico'),
    document.fonts.ready,
  ]);
  paint();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

/** Runs one fixed scene: 'cover' (full-frame cover) or 'editor' (the editor at work). */
export async function runScene(shot, query) {
  applyScene(query);
  await loadScenePhotos(query);
  const preview = document.getElementById('preview');
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const size = SIZES[state.sizeIndex];
    await paintWhenReady(() => {
      preview.width = size.w;
      preview.height = size.h;
      drawPoster(preview, state);
    });
  } else if (shot === 'editor') {
    await paintWhenReady(() => redraw());
  } else {
    // An unknown ?shot= value still shows the editor, so the page never blanks.
    await paintWhenReady(() => redraw());
  }
}
