// SPDX-License-Identifier: MIT
// Vice Heat Cover Studio — the editor wiring: four photo slots, composition
// and tone controls, zone pick/zoom/pan on the live preview, and PNG export
// in the three post sizes. A `?shot=` query sets up a fixed scene for a
// screenshot instead (./scenes.js). Photos are read on this machine only;
// nothing is ever uploaded.
import { COMPOSITIONS, SIZES, drawPoster, renderPoster } from './poster.js';
import { TONES } from './tones.js';
import { runScene } from './scenes.js';

/** The four sample photos shipped with the app, made with an image model. */
export const SAMPLES = [
  { id: 'rider', label: 'Sunset rider' },
  { id: 'boat', label: 'Speedboat' },
  { id: 'pool', label: 'Pool party' },
  { id: 'gator', label: 'Gator crossing' },
];

const preview = document.getElementById('preview');
const statusEl = document.getElementById('status');
const zoneLabel = document.getElementById('zoneLabel');
const zonePhotoSelect = document.getElementById('zonePhoto');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panX');
const panYInput = document.getElementById('panY');

/** The editor's whole state: everything drawPoster needs, plus the UI picks. */
export const state = {
  composition: 'hero',
  tone: 'vice',
  title: 'Vice Heat',
  subtitle: 'full throttle into the sunset',
  sizeIndex: 2,
  photos: [null, null, null, null],
  labels: ['', '', '', ''],
  zones: [],
  selectedZone: 0,
};

let zoneRects = [];

/** Rebuilds state.zones for the current composition, keeping edits made. */
export function resetZones() {
  const count = COMPOSITIONS[state.composition].zones;
  const kept = state.zones;
  state.zones = [];
  for (let i = 0; i < count; i++) {
    state.zones.push(kept[i] || { photo: i % 4, zoom: 1, dx: 0, dy: 0 });
  }
  if (state.selectedZone >= count) state.selectedZone = 0;
}

/** Redraws the preview at the chosen export aspect, capped at 900 px long side. */
export function redraw() {
  const size = SIZES[state.sizeIndex];
  const scale = Math.min(1, 900 / Math.max(size.w, size.h));
  preview.width = Math.round(size.w * scale);
  preview.height = Math.round(size.h * scale);
  zoneRects = drawPoster(preview, state);
  drawSelectionOutline();
  syncZoneControls();
}

/** Outlines the selected zone on the preview (preview only, never exported). */
export function drawSelectionOutline() {
  if (!zoneRects[state.selectedZone]) return;
  const ctx = preview.getContext('2d');
  const r = zoneRects[state.selectedZone];
  ctx.save();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 8]);
  ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
  ctx.restore();
}

/** Copies the selected zone's photo, zoom and pan into the sliders. */
export function syncZoneControls() {
  const zone = state.zones[state.selectedZone];
  if (!zone) return;
  const kind = state.composition === 'hero'
    ? (state.selectedZone === 0 ? 'Hero photo' : `Snapshot ${state.selectedZone}`)
    : `Panel ${state.selectedZone + 1}`;
  zoneLabel.textContent = `${kind} — zone ${state.selectedZone + 1} of ${state.zones.length}`;
  zonePhotoSelect.value = String(zone.photo);
  zoomInput.value = String(zone.zoom);
  panXInput.value = String(zone.dx);
  panYInput.value = String(zone.dy);
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

/** Loads a sample photo into one of the four photo slots. */
export async function loadSample(slot, sampleId) {
  state.photos[slot] = await loadImage(`samples/${sampleId}.jpg`);
  const sample = SAMPLES.find((s) => s.id === sampleId);
  state.labels[slot] = sample ? sample.label : '';
  if (slotSelects[slot]) slotSelects[slot].value = sampleId;
  redraw();
}

/** Loads an uploaded file into one of the four photo slots. */
export async function loadUpload(slot, file) {
  state.photos[slot] = await loadImage(URL.createObjectURL(file));
  state.labels[slot] = file.name.replace(/\.[^.]+$/, '').slice(0, 24) || 'Your photo';
  redraw();
}

/** Renders the cover at full export size and downloads it as a PNG. */
export function exportCover(sizeIndex) {
  const size = SIZES[sizeIndex];
  statusEl.textContent = `Rendering ${size.w} x ${size.h} PNG…`;
  const canvas = renderPoster(state, size.w, size.h);
  const slug = state.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'cover';
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${slug}-${size.w}x${size.h}.png`;
    a.click();
    statusEl.textContent = `Saved ${a.download}`;
  }, 'image/png');
}

/** Finds which zone a preview point (in canvas pixels) falls inside. */
export function hitZone(x, y) {
  for (let i = zoneRects.length - 1; i >= 0; i--) {
    const r = zoneRects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

// ---- Controls: composition, tone, caption, size ------------------------------

const compositionBox = document.getElementById('compositions');
Object.entries(COMPOSITIONS).forEach(([id, def]) => {
  const label = document.createElement('label');
  label.className = 'chip';
  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'composition';
  radio.value = id;
  radio.checked = id === state.composition;
  radio.addEventListener('change', () => { state.composition = id; resetZones(); redraw(); });
  label.append(radio, document.createTextNode(def.label));
  compositionBox.append(label);
});

const toneSelect = document.getElementById('tone');
Object.entries(TONES).forEach(([id, def]) => {
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = def.label;
  toneSelect.append(opt);
});
toneSelect.addEventListener('change', () => { state.tone = toneSelect.value; redraw(); });

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

// ---- Controls: the four photo slots -----------------------------------------

const slotsBox = document.getElementById('slots');
const slotSelects = [];
const SLOT_DEFAULTS = ['rider', 'boat', 'pool', 'gator'];
for (let slot = 0; slot < 4; slot++) {
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

// ---- Controls: the selected zone's photo, zoom and pan ----------------------

for (let slot = 0; slot < 4; slot++) {
  const opt = document.createElement('option');
  opt.value = String(slot);
  opt.textContent = `Photo ${slot + 1}`;
  zonePhotoSelect.append(opt);
}
zonePhotoSelect.addEventListener('change', () => {
  state.zones[state.selectedZone].photo = Number(zonePhotoSelect.value);
  redraw();
});
zoomInput.addEventListener('input', () => {
  state.zones[state.selectedZone].zoom = Number(zoomInput.value);
  redraw();
});
panXInput.addEventListener('input', () => {
  state.zones[state.selectedZone].dx = Number(panXInput.value);
  redraw();
});
panYInput.addEventListener('input', () => {
  state.zones[state.selectedZone].dy = Number(panYInput.value);
  redraw();
});

// ---- Preview: click a zone to select it, drag to pan, wheel to zoom --------

let drag = null;
preview.addEventListener('pointerdown', (e) => {
  const rect = preview.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (preview.width / rect.width);
  const y = (e.clientY - rect.top) * (preview.height / rect.height);
  const hit = hitZone(x, y);
  if (hit < 0) return;
  state.selectedZone = hit;
  drag = { x, y, dx: state.zones[hit].dx, dy: state.zones[hit].dy, rect };
  preview.setPointerCapture(e.pointerId);
  redraw();
});
preview.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = preview.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (preview.width / rect.width);
  const y = (e.clientY - rect.top) * (preview.height / rect.height);
  const zone = state.zones[state.selectedZone];
  const r = zoneRects[state.selectedZone];
  zone.dx = Math.max(-0.5, Math.min(0.5, drag.dx + (x - drag.x) / r.w));
  zone.dy = Math.max(-0.5, Math.min(0.5, drag.dy + (y - drag.y) / r.h));
  redraw();
});
preview.addEventListener('pointerup', () => { drag = null; });
preview.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zone = state.zones[state.selectedZone];
  zone.zoom = Math.max(1, Math.min(2.5, zone.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  redraw();
}, { passive: false });

// ---- Export -----------------------------------------------------------------

document.getElementById('export').addEventListener('click', () => exportCover(state.sizeIndex));
document.getElementById('exportAll').addEventListener('click', () => {
  SIZES.forEach((_, i) => exportCover(i));
  statusEl.textContent = 'Exported all three sizes.';
});

// ---- Boot -------------------------------------------------------------------

resetZones();
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runScene(shot, new URLSearchParams(location.search));
} else {
  Promise.all([
    document.fonts.load('90px Anton'),
    document.fonts.load('40px Pacifico'),
    loadSample(0, 'rider'),
    loadSample(1, 'boat'),
    loadSample(2, 'pool'),
    loadSample(3, 'gator'),
  ]).then(() => {
    redraw();
    window.__shotReady = true;
  }).catch(() => redraw());
}
