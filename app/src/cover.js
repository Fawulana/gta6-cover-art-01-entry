// SPDX-License-Identifier: MIT
// Neon Shore Cover Lab — the cover engine: draws a multi-panel GTA-poster-style cover
// from the user's photos, a caption and a colour grade, onto any canvas at any size.
// Pure canvas 2D, no libraries, no network. Deterministic: the grain pattern comes from
// a fixed-seed generator, so the same state always draws the same pixels.
import { GRADES } from './grades.js';

/** The layouts the editor offers, in the order the controls list them. */
export const LAYOUTS = {
  hero3: { label: 'Hero + three', panels: 4 },
  grid4: { label: 'Four panels', panels: 4 },
  strip3: { label: 'Comic strip', panels: 3 },
  tilt: { label: 'Diagonal hero', panels: 3 },
  fullbleed: { label: 'Full bleed', panels: 1 },
};

/** The export sizes the app offers, in pixels. */
export const SIZES = [
  { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
];

/** A tiny deterministic generator, so the grain never changes between runs. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainTile = null;
/** Builds (once) the 128 px grain tile every cover stamps over itself. */
export function grainPattern(ctx) {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 128; tile.height = 128;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(128, 128);
  const rand = mulberry32(20261119);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rand() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  grainTile = ctx.createPattern(tile, 'repeat');
  return grainTile;
}

/**
 * Panel rectangles for a layout, as fractions of the art area (the part above the
 * title band). Each entry is {x, y, w, h, slant} in 0..1 of the art area.
 */
export function layoutPanels(layout, artW, artH) {
  switch (layout) {
    case 'grid4':
      return [
        { x: 0, y: 0, w: 0.5, h: 0.5 },
        { x: 0.5, y: 0, w: 0.5, h: 0.5 },
        { x: 0, y: 0.5, w: 0.5, h: 0.5 },
        { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
      ];
    case 'strip3':
      return [
        { x: 0, y: 0, w: 1 / 3, h: 1 },
        { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
        { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
      ];
    case 'tilt':
      return [
        { x: 0, y: 0, w: 0.62, h: 1, slant: 0.09 },
        { x: 0.62, y: 0, w: 0.38, h: 0.5 },
        { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
      ];
    case 'fullbleed':
      return [{ x: 0, y: 0, w: 1, h: 1 }];
    case 'hero3':
    default:
      return [
        { x: 0, y: 0, w: 0.6, h: 1 },
        { x: 0.6, y: 0, w: 0.4, h: 1 / 3 },
        { x: 0.6, y: 1 / 3, w: 0.4, h: 1 / 3 },
        { x: 0.6, y: 2 / 3, w: 0.4, h: 1 / 3 },
      ];
  }
}

/** Draws one photo into a panel rect, cover-fit, with the panel's zoom and pan. */
export function drawPanelPhoto(ctx, photo, rect, panel, grade) {
  if (!photo) return;
  const pw = rect.w; const ph = rect.h;
  const base = Math.max(pw / photo.naturalWidth, ph / photo.naturalHeight);
  const scale = base * (panel.zoom || 1);
  const dw = photo.naturalWidth * scale;
  const dh = photo.naturalHeight * scale;
  const cx = rect.x + pw / 2 + (panel.dx || 0) * pw;
  const cy = rect.y + ph / 2 + (panel.dy || 0) * ph;
  ctx.save();
  ctx.filter = grade.photoFilter;
  ctx.drawImage(photo, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

/** Stamps a warm sunset wash over one photo panel. */
export function gradePanel(ctx, rect, grade) {
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(1, grade.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** Draws the alternating sunburst rays behind the title band. */
export function drawSunburst(ctx, cx, cy, radius, color, rays) {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < rays; i++) {
    const a0 = (i / rays) * Math.PI * 2;
    const a1 = ((i + 0.5) / rays) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Fits the title to the band width and draws it with a hard offset shadow. */
export function drawTitleBlock(ctx, state, band, grade) {
  const { title, subtitle } = state;
  const bx = band.x; const by = band.y; const bw = band.w; const bh = band.h;
  const bg = ctx.createLinearGradient(bx, by, bx, by + bh);
  bg.addColorStop(0, grade.bandTop);
  bg.addColorStop(1, grade.bandBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(bx, by, bw, bh);
  drawSunburst(ctx, bx + bw / 2, by + bh * 1.15, bh * 1.6, grade.rayColor, 14);

  const pad = bw * 0.045;
  const sub = (subtitle || '').trim();
  if (sub) {
    let subSize = bh * 0.16;
    ctx.font = `${subSize}px Pacifico, cursive`;
    while (ctx.measureText(sub).width > bw - pad * 2 && subSize > 10) {
      subSize -= 1;
      ctx.font = `${subSize}px Pacifico, cursive`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = grade.subtitleColor;
    ctx.fillText(sub, bx + bw / 2, by + bh * 0.20);
  }

  const text = (title || '').trim().toUpperCase();
  if (text) {
    let size = bh * 0.46;
    ctx.font = `${size}px Anton, sans-serif`;
    while (ctx.measureText(text).width > bw - pad * 2 && size > 12) {
      size -= 2;
      ctx.font = `${size}px Anton, sans-serif`;
    }
    const ty = by + bh * (sub ? 0.62 : 0.52);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    // Hard extruded shadow, then the face, then a dark keyline.
    ctx.fillStyle = grade.titleShadow;
    ctx.fillText(text, bx + bw / 2 + size * 0.045, ty + size * 0.05);
    const tg = ctx.createLinearGradient(bx, ty - size / 2, bx, ty + size / 2);
    tg.addColorStop(0, grade.titleTop);
    tg.addColorStop(1, grade.titleBottom);
    ctx.fillStyle = tg;
    ctx.fillText(text, bx + bw / 2, ty);
    ctx.strokeStyle = grade.titleStroke;
    ctx.lineWidth = Math.max(1.5, size * 0.045);
    ctx.strokeText(text, bx + bw / 2, ty);
  }

  // Footer strip: invented city on the left, a five-star heat meter on the right.
  const fy = by + bh * 0.90;
  ctx.font = `bold ${Math.max(10, bh * 0.085)}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = grade.footerColor;
  ctx.fillText('SUNSET COAST', bx + pad, fy);
  ctx.textAlign = 'right';
  ctx.fillText('★★★★★', bx + bw - pad, fy);
  ctx.strokeStyle = grade.footerColor;
  ctx.lineWidth = Math.max(1, bh * 0.012);
  ctx.beginPath();
  ctx.moveTo(bx + pad, by + bh * 0.80);
  ctx.lineTo(bx + bw - pad, by + bh * 0.80);
  ctx.stroke();
}

/**
 * Draws the whole cover for `state` onto `canvas` (at the canvas's own size).
 * Returns the panel rectangles in canvas pixels, for hit-testing in the editor.
 * state: { layout, grade, title, subtitle, photos: [img|null x3],
 *          panels: [{ photo, zoom, dx, dy }] }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width; const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const gutter = Math.max(3, Math.round(w * 0.005));
  const frame = Math.max(4, Math.round(w * 0.008));

  ctx.fillStyle = '#0d0a14';
  ctx.fillRect(0, 0, w, h);

  const bandH = Math.round(h * (w > h ? 0.24 : w === h ? 0.17 : 0.15));
  const artH = h - bandH;
  const panels = layoutPanels(state.layout, w, artH);
  const rects = [];

  panels.forEach((p, i) => {
    const rect = {
      x: Math.round(p.x * w) + gutter,
      y: Math.round(p.y * artH) + gutter,
      w: Math.round(p.w * w) - gutter * 2,
      h: Math.round(p.h * artH) - gutter * 2,
    };
    rects.push(rect);
    const panel = state.panels[i] || { photo: i % 3, zoom: 1, dx: 0, dy: 0 };
    const photo = state.photos[panel.photo] || null;
    ctx.save();
    ctx.beginPath();
    if (p.slant) {
      const s = p.slant * artH;
      ctx.moveTo(rect.x, rect.y);
      ctx.lineTo(rect.x + rect.w, rect.y);
      ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
      ctx.lineTo(rect.x, rect.y + rect.h - s);
    } else {
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.closePath();
    ctx.clip();
    if (photo) {
      drawPanelPhoto(ctx, photo, rect, panel, grade);
    } else {
      ctx.fillStyle = '#241a33';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    gradePanel(ctx, rect, grade);
    ctx.restore();
    // White poster gutter keyline around the panel.
    ctx.strokeStyle = '#f5f0e6';
    ctx.lineWidth = Math.max(2, gutter * 0.7);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  drawTitleBlock(ctx, state, { x: 0, y: artH, w, h: bandH }, grade);

  // Grain, vignette and the outer frame finish the poster look.
  ctx.save();
  ctx.globalAlpha = 0.055;
  ctx.fillStyle = grainPattern(ctx);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,4,20,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#0d0a14';
  ctx.lineWidth = frame;
  ctx.strokeRect(frame / 2, frame / 2, w - frame, h - frame);
  return rects;
}

/** Renders the cover at full export size and returns the fresh canvas. */
export function renderCover(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, state);
  return canvas;
}
