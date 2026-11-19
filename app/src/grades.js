// SPDX-License-Identifier: MIT
// Neon Shore Cover Lab — the colour grades: one preset per mood. Each grade carries
// the photo filter, the wash stamped over every panel, and the title-band palette.
// All colours are the app's own; no game artwork, logo or font is referenced anywhere.

/**
 * A grade: { label, photoFilter, washTop, washBottom, bandTop, bandBottom,
 * rayColor, titleTop, titleBottom, titleShadow, titleStroke, subtitleColor,
 * footerColor }. Wash colours are translucent so the photo shows through.
 */
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    photoFilter: 'saturate(1.3) contrast(1.1) brightness(1.03)',
    washTop: 'rgba(255, 140, 60, 0.10)',
    washBottom: 'rgba(214, 48, 120, 0.34)',
    bandTop: '#3b1155',
    bandBottom: '#ff7a3d',
    rayColor: 'rgba(255, 214, 120, 0.16)',
    titleTop: '#fff7e8',
    titleBottom: '#ffd166',
    titleShadow: '#c22e6e',
    titleStroke: '#1c0b2e',
    subtitleColor: '#ffe9a8',
    footerColor: '#ffe9c9',
  },
  neon: {
    label: 'Neon Nights',
    photoFilter: 'saturate(1.45) contrast(1.12) brightness(0.98)',
    washTop: 'rgba(0, 229, 255, 0.10)',
    washBottom: 'rgba(255, 0, 128, 0.30)',
    bandTop: '#0a1030',
    bandBottom: '#b3126e',
    rayColor: 'rgba(0, 229, 255, 0.18)',
    titleTop: '#ffffff',
    titleBottom: '#7df9ff',
    titleShadow: '#ff2e88',
    titleStroke: '#12041f',
    subtitleColor: '#ff7ad9',
    footerColor: '#bfefff',
  },
  pink: {
    label: 'Hot Pink',
    photoFilter: 'saturate(1.4) contrast(1.08)',
    washTop: 'rgba(255, 110, 180, 0.12)',
    washBottom: 'rgba(120, 20, 160, 0.34)',
    bandTop: '#4d0a4d',
    bandBottom: '#ff4d9d',
    rayColor: 'rgba(255, 255, 255, 0.14)',
    titleTop: '#fff0f7',
    titleBottom: '#ff9ecf',
    titleShadow: '#5e0a68',
    titleStroke: '#26032e',
    subtitleColor: '#ffd6ec',
    footerColor: '#ffe3f2',
  },
  teal: {
    label: 'Teal Dusk',
    photoFilter: 'saturate(1.2) contrast(1.1) brightness(1.02)',
    washTop: 'rgba(64, 224, 208, 0.10)',
    washBottom: 'rgba(8, 60, 120, 0.36)',
    bandTop: '#062a3a',
    bandBottom: '#0f766e',
    rayColor: 'rgba(255, 190, 90, 0.16)',
    titleTop: '#f2fffc',
    titleBottom: '#8ff5e1',
    titleShadow: '#083344',
    titleStroke: '#03131c',
    subtitleColor: '#ffd166',
    footerColor: '#c8fff2',
  },
  noir: {
    label: 'Noir',
    photoFilter: 'grayscale(1) contrast(1.18) brightness(1.04)',
    washTop: 'rgba(255, 255, 255, 0.06)',
    washBottom: 'rgba(0, 0, 0, 0.30)',
    bandTop: '#111111',
    bandBottom: '#3a3a3a',
    rayColor: 'rgba(255, 255, 255, 0.10)',
    titleTop: '#ffffff',
    titleBottom: '#d4d4d4',
    titleShadow: '#000000',
    titleStroke: '#000000',
    subtitleColor: '#e5e5e5',
    footerColor: '#cccccc',
  },
};

/** The grade ids, in the order the grade picker lists them. */
export const GRADE_IDS = Object.keys(GRADES);
