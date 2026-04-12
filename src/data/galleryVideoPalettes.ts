import type { CSSProperties } from 'react';

export type GalleryVideoPalette = {
  hueRotate: number;
  saturate: number;
  brightness: number;
  contrast: number;
  overlay: string;
  mixBlendMode?: CSSProperties['mixBlendMode'];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

function buildOverlay(
  r1: number,
  g1: number,
  b1: number,
  a1: number,
  r2: number,
  g2: number,
  b2: number,
  a2: number
) {
  return `linear-gradient(135deg, rgba(${Math.round(r1)},${Math.round(g1)},${Math.round(
    b1
  )},${a1}), rgba(${Math.round(r2)},${Math.round(g2)},${Math.round(b2)},${a2}))`;
}

export function getGalleryVideoPalette(level: number): GalleryVideoPalette {
  const safeLevel = clamp(Math.floor(level || 1), 1, 100);
  const t = (safeLevel - 1) / 99;

  const hueRotate = Math.round(lerp(0, 320, t));
  const saturate = Number(lerp(1.08, 1.68, t).toFixed(2));
  const brightness = Number(lerp(0.93, 1.03, t).toFixed(3));
  const contrast = Number(lerp(1.08, 1.24, t).toFixed(3));

  const r1 = lerp(70, 255, t);
  const g1 = lerp(110, 210, t);
  const b1 = lerp(255, 80, t);

  const r2 = lerp(130, 255, t);
  const g2 = lerp(70, 110, t);
  const b2 = lerp(255, 30, t);

  const overlay = buildOverlay(r1, g1, b1, 0.18, r2, g2, b2, 0.14);

  let mixBlendMode: CSSProperties['mixBlendMode'] = 'soft-light';

  if (safeLevel >= 34 && safeLevel <= 66) {
    mixBlendMode = 'overlay';
  } else if (safeLevel >= 67) {
    mixBlendMode = 'color';
  }

  return {
    hueRotate,
    saturate,
    brightness,
    contrast,
    overlay,
    mixBlendMode,
  };
}
