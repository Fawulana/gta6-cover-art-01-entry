// SPDX-License-Identifier: MIT
// Neon Shore Cover Lab — the editor wiring: photo slots, layout and grade controls,
// panel pick/zoom/pan on the live preview, and PNG export in the three post sizes.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
// Photos are read on this machine only; nothing is ever uploaded.
import { LAYOUTS, SIZES, drawCover, renderCover } from './cover.js';
import { GRADES } from './grades.js';
import { runShot } from './shots.js';

/** The four sample photos shipped with the app, made with an image model. */
export const SAMPLES = [
  { id: 'boulevard', label: 'Boulevard' },
  { id: 'rooftop', label: 'Rooftop' },
  { id: 'neon', label: 'Neon street' },
  { id: 'pier', label: 'Pier' },
];

const preview = document.getElementById('preview');
const statusEl = document.getElementById('status');
const panelLabel = document.getElementById('panelLabel');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panX');
const panYInput = document.getElementById('panY');

/** The editor's whole state: everything drawCover needs, plus the UI's picks. */
export const state = {
  layout: 'hero3',
  grade: 'sunset',
  title: 'Neon Shore',
  subtitle: 'a sunset story',
  sizeIndex: 0,
  photos: [null, null, null],
  panels: [],
  selectedPanel: 0,
};

let panelRects = [];

/** Rebuilds state.panels for the current layout, keeping any edits already made. */
export function resetPanels() {
  const count = LAYOUTS[state.layout].panels;
  const kept = state.panels;
  state.panels = [];
  for (let i = 0; i < count; i++) {
    state.panels.push(kept[i] || { photo: i % 3, zoom: 1, dx: 0, dy: 0 });
  }
  if (state.selectedPanel >= count) state.selectedPanel = 0;
}

/** Redraws the preview at the chosen export aspect, capped at 900 px long side. */
export function redraw() {
  const size = SIZES[state.sizeIndex];
  const scale = Math.min(1, 900 / Math.max(size.w, size.h));
  preview.width = Math.round(size.w * scale);
  preview.height = Math.round(size.h * scale);
  panelRects = drawCover(preview, state);
  drawSelectionOutline();
  syncPanelControls();
}

/** Outlines the selected panel on the preview (preview only, never exported). */
export function drawSelectionOutline() {
  if (!panelRects[state.selectedPanel]) return;
  const ctx = preview.getContext('2d');
  const r = panelRects[state.selectedPanel];
  ctx.save();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 8]);
  ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
  ctx.restore();
}

/** Copies the selected panel's zoom and pan into the sliders. */
export function syncPanelControls() {
  const panel = state.panels[state.selectedPanel];
  if (!panel) return;
  panelLabel.textContent = `Panel ${state.selectedPanel + 1} of ${state.panels.length}`;
  zoomInput.value = String(panel.zoom);
  panXInput.value = String(panel.dx);
  panYInput.value = String(panel.dy);
}

/** Loads an image from a URL, resolving once it can be drawn on a canvas. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Loads a sample photo into one of the three photo slots. */
export async function loadSample(slot, sampleId) {
  state.photos[slot] = await loadImage(`samples/${sampleId}.jpg`);
  if (slotSelects[slot]) slotSelects[slot].value = sampleId;
  redraw();
}

/** Loads an uploaded file into one of the three photo slots. */
export async function loadUpload(slot, file) {
  state.photos[slot] = await loadImage(URL.createObjectURL(file));
  redraw();
}

/** Renders the cover at full export size and downloads it as a PNG. */
export function exportCover(sizeIndex) {
  const size = SIZES[sizeIndex];
  statusEl.textContent = `Rendering ${size.w} x ${size.h} PNG…`;
  const canvas = renderCover(state, size.w, size.h);
  const slug = state.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'cover';
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${slug}-${size.w}x${size.h}.png`;
    a.click();
    statusEl.textContent = `Saved ${a.download}`;
  }, 'image/png');
}

/** Finds which panel a preview point (in canvas pixels) falls inside. */
export function hitPanel(x, y) {
  for (let i = panelRects.length - 1; i >= 0; i--) {
    const r = panelRects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

// ---- Controls: layout, grade, caption, size --------------------------------

const layoutBox = document.getElementById('layouts');
Object.entries(LAYOUTS).forEach(([id, def]) => {
  const label = document.createElement('label');
  label.className = 'chip';
  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'layout';
  radio.value = id;
  radio.checked = id === state.layout;
  radio.addEventListener('change', () => { state.layout = id; resetPanels(); redraw(); });
  label.append(radio, document.createTextNode(def.label));
  layoutBox.append(label);
});

const gradeSelect = document.getElementById('grade');
Object.entries(GRADES).forEach(([id, def]) => {
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = def.label;
  gradeSelect.append(opt);
});
gradeSelect.addEventListener('change', () => { state.grade = gradeSelect.value; redraw(); });

document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });

const sizeBox = document.getElementById('sizes');
SIZES.forEach((size, i) => {
  const label = document.createElement('label');
  label.className = 'chip';
  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'size';
  radio.value = String(i);
  radio.checked = i === state.sizeIndex;
  radio.addEventListener('change', () => { state.sizeIndex = i; redraw(); });
  label.append(radio, document.createTextNode(size.label));
  sizeBox.append(label);
});

// ---- Controls: the three photo slots ----------------------------------------

const slotsBox = document.getElementById('slots');
const slotSelects = [];
const SLOT_DEFAULTS = ['boulevard', 'rooftop', 'neon'];
for (let slot = 0; slot < 3; slot++) {
  const row = document.createElement('div');
  row.className = 'slot';
  const title = document.createElement('span');
  title.textContent = `Photo ${slot + 1}`;
  const select = document.createElement('select');
  select.setAttribute('aria-label', `Sample photo for slot ${slot + 1}`);
  SAMPLES.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.label;
    select.append(opt);
  });
  select.value = SLOT_DEFAULTS[slot];
  slotSelects.push(select);
  select.addEventListener('change', () => loadSample(slot, select.value).catch(() => {
    statusEl.textContent = `Could not load ${select.value}.jpg`;
  }));
  const upload = document.createElement('input');
  upload.type = 'file';
  upload.accept = 'image/*';
  upload.setAttribute('aria-label', `Upload a photo for slot ${slot + 1}`);
  upload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await loadUpload(slot, file);
    statusEl.textContent = `Photo ${slot + 1} loaded from ${file.name}`;
  });
  row.append(title, select, upload);
  slotsBox.append(row);
}

// ---- Controls: the selected panel's zoom and pan ----------------------------

zoomInput.addEventListener('input', () => {
  state.panels[state.selectedPanel].zoom = Number(zoomInput.value);
  redraw();
});
panXInput.addEventListener('input', () => {
  state.panels[state.selectedPanel].dx = Number(panXInput.value);
  redraw();
});
panYInput.addEventListener('input', () => {
  state.panels[state.selectedPanel].dy = Number(panYInput.value);
  redraw();
});

// ---- Preview: click a panel to select it, drag to pan, wheel to zoom --------

let drag = null;
preview.addEventListener('pointerdown', (e) => {
  const rect = preview.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (preview.width / rect.width);
  const y = (e.clientY - rect.top) * (preview.height / rect.height);
  const hit = hitPanel(x, y);
  if (hit < 0) return;
  state.selectedPanel = hit;
  drag = { x, y, dx: state.panels[hit].dx, dy: state.panels[hit].dy, rect };
  preview.setPointerCapture(e.pointerId);
  redraw();
});
preview.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = preview.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (preview.width / rect.width);
  const y = (e.clientY - rect.top) * (preview.height / rect.height);
  const panel = state.panels[state.selectedPanel];
  const r = panelRects[state.selectedPanel];
  panel.dx = Math.max(-0.5, Math.min(0.5, drag.dx + (x - drag.x) / r.w));
  panel.dy = Math.max(-0.5, Math.min(0.5, drag.dy + (y - drag.y) / r.h));
  redraw();
});
preview.addEventListener('pointerup', () => { drag = null; });
preview.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selectedPanel];
  panel.zoom = Math.max(1, Math.min(2.5, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  redraw();
}, { passive: false });

// ---- Export -----------------------------------------------------------------

document.getElementById('export').addEventListener('click', () => exportCover(state.sizeIndex));
document.getElementById('exportAll').addEventListener('click', () => {
  SIZES.forEach((_, i) => exportCover(i));
  statusEl.textContent = 'Exported all three sizes.';
});

// ---- Boot -------------------------------------------------------------------

resetPanels();
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search));
} else {
  Promise.all([
    document.fonts.load('90px Anton'),
    document.fonts.load('40px Pacifico'),
    loadSample(0, 'boulevard'),
    loadSample(1, 'rooftop'),
    loadSample(2, 'neon'),
  ]).then(() => {
    redraw();
    window.__shotReady = true;
  }).catch(() => redraw());
}
