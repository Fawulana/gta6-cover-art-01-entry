// SPDX-License-Identifier: MIT
// Vice Heat Cover Studio — the poster engine: one bold hero photo full-bleed,
// three tilted snapshot prints across the top, and a slashed title band with a
// striped setting sun. Pure canvas 2D, no libraries, no network. Deterministic:
// the grain comes from a fixed-seed generator, so the same state always draws
// the same pixels.
import { TONES } from './tones.js';

/** The compositions the editor offers, with how many photo zones each has. */
export const COMPOSITIONS = {
  hero: { label: 'Hero + snapshots', zones: 4 },
  split: { label: 'Split screen', zones: 3 },
  grid: { label: 'Four squares', zones: 4 },
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
 * The slashed title band's top edge: it runs from (0, 0.70h) up to (w, 0.62h).
 * Returns the band's top y at a given x, and the slope angle in radians.
 */
export function bandTopAt(x, w, h) {
  return h * 0.70 - (h * 0.08 * x) / w;
}
export function bandAngle(w, h) {
  return Math.atan2(-0.08 * h, w);
}

/**
 * Photo zones for a composition, in canvas pixels. The hero layout is one
 * full-bleed hero plus three tilted snapshot prints; split and grid tile the
 * area above the title band. Each zone is {x, y, w, h, kind, angle}.
 */
export function zoneRects(composition, w, h) {
  const artH = Math.round(h * 0.70);
  if (composition === 'split') {
    return [
      { x: 0, y: 0, w: Math.round(w * 0.55), h: artH, kind: 'photo', angle: 0 },
      { x: Math.round(w * 0.55), y: 0, w: w - Math.round(w * 0.55), h: Math.round(artH / 2), kind: 'photo', angle: 0 },
      { x: Math.round(w * 0.55), y: Math.round(artH / 2), w: w - Math.round(w * 0.55), h: artH - Math.round(artH / 2), kind: 'photo', angle: 0 },
    ];
  }
  if (composition === 'grid') {
    return [
      { x: 0, y: 0, w: Math.round(w / 2), h: Math.round(artH / 2), kind: 'photo', angle: 0 },
      { x: Math.round(w / 2), y: 0, w: w - Math.round(w / 2), h: Math.round(artH / 2), kind: 'photo', angle: 0 },
      { x: 0, y: Math.round(artH / 2), w: Math.round(w / 2), h: artH - Math.round(artH / 2), kind: 'photo', angle: 0 },
      { x: Math.round(w / 2), y: Math.round(artH / 2), w: w - Math.round(w / 2), h: artH - Math.round(artH / 2), kind: 'photo', angle: 0 },
    ];
  }
  // hero: full-bleed hero, then three snapshot prints across the top.
  // The prints stay small and leave gaps between them, so the hero's subject
  // (centred in the sample photos) reads through the collage.
  const fw = Math.round(w * 0.19);
  const fh = Math.round(fw * 1.05);
  const y = Math.round(h * 0.03);
  return [
    { x: 0, y: 0, w, h, kind: 'hero', angle: 0 },
    { x: Math.round(w * 0.03), y, w: fw, h: fh, kind: 'print', angle: -0.06 },
    { x: Math.round(w * 0.33), y: y + Math.round(h * 0.012), w: fw, h: fh, kind: 'print', angle: 0.035 },
    { x: Math.round(w * 0.72), y: y - Math.round(h * 0.006), w: fw, h: fh, kind: 'print', angle: -0.025 },
  ];
}

/** Draws one photo into a rect, cover-fit, with the zone's zoom and pan. */
export function drawZonePhoto(ctx, photo, rect, zone, tone) {
  if (!photo) return;
  const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight);
  const scale = base * (zone.zoom || 1);
  const dw = photo.naturalWidth * scale;
  const dh = photo.naturalHeight * scale;
  const cx = rect.x + rect.w / 2 + (zone.dx || 0) * rect.w;
  const cy = rect.y + rect.h / 2 + (zone.dy || 0) * rect.h;
  ctx.save();
  ctx.filter = tone.photoFilter;
  ctx.drawImage(photo, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

/** Stamps the tone's sunset wash over a rect. */
export function washRect(ctx, rect, tone) {
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, tone.washTop);
  wash.addColorStop(1, tone.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/**
 * Draws one tilted snapshot print: a white border, a soft drop shadow, the
 * photo cover-fit inside, and a handwritten-style caption on the white strip.
 */
export function drawPrint(ctx, photo, rect, zone, tone, caption) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rect.angle);
  ctx.shadowColor = 'rgba(5, 2, 12, 0.55)';
  ctx.shadowBlur = Math.max(8, rect.w * 0.04);
  ctx.shadowOffsetY = Math.max(4, rect.w * 0.015);
  ctx.fillStyle = '#f7f2e8';
  ctx.fillRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rect.angle);
  const border = Math.max(4, rect.w * 0.045);
  const strip = Math.max(10, rect.h * 0.16);
  const inner = {
    x: -rect.w / 2 + border,
    y: -rect.h / 2 + border,
    w: rect.w - border * 2,
    h: rect.h - border * 2 - strip,
  };
  ctx.beginPath();
  ctx.rect(inner.x, inner.y, inner.w, inner.h);
  ctx.clip();
  if (photo) {
    drawZonePhoto(ctx, photo, inner, zone, tone);
    washRect(ctx, inner, tone);
  } else {
    ctx.fillStyle = '#241a33';
    ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
  }
  ctx.restore();

  // The caption sits on the print's white strip, in the script font.
  if (caption) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rect.angle);
    let size = Math.max(9, rect.h * 0.075);
    ctx.font = `${size}px Pacifico, cursive`;
    while (ctx.measureText(caption).width > rect.w - border * 2 && size > 8) {
      size -= 1;
      ctx.font = `${size}px Pacifico, cursive`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2b2b33';
    ctx.fillText(caption, 0, rect.h / 2 - strip / 2);
    ctx.restore();
  }
}

/** Draws the retro striped sun that peeks above the title band. */
export function drawStripedSun(ctx, cx, cy, radius, tone) {
  const bars = 7;
  for (let i = 0; i < bars; i++) {
    const y0 = cy - radius + (i * 2 * radius) / bars;
    const y1 = cy - radius + ((i + 0.72) * 2 * radius) / bars;
    const mid = (y0 + y1) / 2;
    const dy = Math.min(Math.abs(mid - cy), radius * 0.999);
    const half = Math.sqrt(radius * radius - dy * dy);
    const grad = ctx.createLinearGradient(cx, y0, cx, y1);
    grad.addColorStop(0, tone.sunTop);
    grad.addColorStop(1, tone.sunBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(cx - half, y0, half * 2, y1 - y0);
  }
}

/** Fits the title to the band width and letters it along the band's slope. */
export function drawSlash(ctx, state, w, h, tone) {
  const angle = bandAngle(w, h);
  const topMid = bandTopAt(w / 2, w, h);
  const bandH = h - topMid;

  // The sun rises behind the band's right side — only on the hero layout,
  // where it peeks over one full-bleed photo; on the tiled layouts it would
  // land across a panel's photo instead.
  if (state.composition === 'hero') {
    drawStripedSun(ctx, w * 0.82, topMid + bandH * 0.05, bandH * 0.58, tone);
  }

  // The slashed band itself, with a hot top edge.
  const bg = ctx.createLinearGradient(0, topMid, 0, h);
  bg.addColorStop(0, tone.bandTop);
  bg.addColorStop(1, tone.bandBottom);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(0, bandTopAt(0, w, h));
  ctx.lineTo(w, bandTopAt(w, w, h));
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = tone.slashEdge;
  ctx.lineWidth = Math.max(2, h * 0.004);
  ctx.beginPath();
  ctx.moveTo(0, bandTopAt(0, w, h));
  ctx.lineTo(w, bandTopAt(w, w, h));
  ctx.stroke();

  const cx = w / 2;
  const pad = w * 0.05;
  const sub = (state.subtitle || '').trim();
  const text = (state.title || '').trim().toUpperCase();

  ctx.save();
  ctx.translate(cx, topMid + bandH * 0.58);
  ctx.rotate(angle);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (sub) {
    let subSize = bandH * 0.14;
    ctx.font = `${subSize}px Pacifico, cursive`;
    while (ctx.measureText(sub).width > w - pad * 2 && subSize > 10) {
      subSize -= 1;
      ctx.font = `${subSize}px Pacifico, cursive`;
    }
    ctx.fillStyle = tone.subtitleColor;
    ctx.fillText(sub, 0, -bandH * 0.30);
  }

  if (text) {
    let size = bandH * 0.44;
    ctx.font = `${size}px Anton, sans-serif`;
    while (ctx.measureText(text).width > w - pad * 2 && size > 12) {
      size -= 2;
      ctx.font = `${size}px Anton, sans-serif`;
    }
    const ty = sub ? bandH * 0.06 : -bandH * 0.02;
    ctx.lineJoin = 'round';
    ctx.fillStyle = tone.titleShadow;
    ctx.fillText(text, size * 0.05, ty + size * 0.055);
    const tg = ctx.createLinearGradient(0, ty - size / 2, 0, ty + size / 2);
    tg.addColorStop(0, tone.titleTop);
    tg.addColorStop(1, tone.titleBottom);
    ctx.fillStyle = tg;
    ctx.fillText(text, 0, ty);
    ctx.strokeStyle = tone.titleStroke;
    ctx.lineWidth = Math.max(1.5, size * 0.04);
    ctx.strokeText(text, 0, ty);
  }
  ctx.restore();

  // Footer strip: invented coast on the left, a five-star heat meter right.
  // Drawn level, not along the band's slope: the slope would drop the left
  // end below the canvas on wide covers.
  ctx.save();
  ctx.translate(cx, topMid + bandH * 0.90);
  ctx.font = `bold ${Math.max(10, bandH * 0.085)}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = tone.footerColor;
  ctx.fillText('VICE COAST', -w / 2 + pad, 0);
  ctx.textAlign = 'right';
  ctx.fillText('★★★★★', w / 2 - pad, 0);
  ctx.strokeStyle = tone.footerColor;
  ctx.lineWidth = Math.max(1, bandH * 0.012);
  ctx.beginPath();
  ctx.moveTo(-w / 2 + pad, -bandH * 0.10);
  ctx.lineTo(w / 2 - pad, -bandH * 0.10);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws the whole cover for `state` onto `canvas` (at the canvas's own size).
 * Returns the zone rectangles in canvas pixels, for hit-testing in the editor.
 * state: { composition, tone, title, subtitle, photos: [img|null x4],
 *          zones: [{ photo, zoom, dx, dy }], labels: [string x4] }
 */
export function drawPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width; const h = canvas.height;
  const tone = TONES[state.tone] || TONES.vice;
  const gutter = Math.max(3, Math.round(w * 0.005));
  const frame = Math.max(4, Math.round(w * 0.008));

  ctx.fillStyle = '#0d0a14';
  ctx.fillRect(0, 0, w, h);

  const zones = zoneRects(state.composition, w, h);
  const rects = zones.map((z) => ({ ...z }));

  if (state.composition === 'hero') {
    const hero = zones[0];
    const heroZone = state.zones[0] || { photo: 0, zoom: 1, dx: 0, dy: 0 };
    const heroPhoto = state.photos[heroZone.photo] || null;
    if (heroPhoto) drawZonePhoto(ctx, heroPhoto, hero, heroZone, tone);
    else { ctx.fillStyle = '#241a33'; ctx.fillRect(0, 0, w, h); }
    washRect(ctx, { x: 0, y: 0, w, h }, tone);
    for (let i = 1; i < zones.length; i++) {
      const zone = state.zones[i] || { photo: i, zoom: 1, dx: 0, dy: 0 };
      const photo = state.photos[zone.photo] || null;
      drawPrint(ctx, photo, zones[i], zone, tone, state.labels ? state.labels[zone.photo] : '');
    }
  } else {
    zones.forEach((z, i) => {
      const zone = state.zones[i] || { photo: i, zoom: 1, dx: 0, dy: 0 };
      const photo = state.photos[zone.photo] || null;
      const rect = {
        x: z.x + gutter, y: z.y + gutter,
        w: z.w - gutter * 2, h: z.h - gutter * 2,
      };
      rects[i] = { ...z, ...rect };
      ctx.save();
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
      if (photo) drawZonePhoto(ctx, photo, rect, zone, tone);
      else { ctx.fillStyle = '#241a33'; ctx.fillRect(rect.x, rect.y, rect.w, rect.h); }
      washRect(ctx, rect, tone);
      ctx.restore();
      ctx.strokeStyle = '#f5f0e6';
      ctx.lineWidth = Math.max(2, gutter * 0.7);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    });
  }

  drawSlash(ctx, state, w, h, tone);

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
export function renderPoster(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawPoster(canvas, state);
  return canvas;
}
