import { SeededRNG } from './rng.js';

/**
 * Generate an organic blob shape as an SVG path.
 * Uses polar coordinates with noise for natural-looking forms.
 */
export function blobPath(
  rng: SeededRNG,
  cx: number, cy: number,
  radius: number,
  irregularity: number = 0.3,
  points: number = 8,
): string {
  const angles: number[] = [];
  const radii: number[] = [];

  for (let i = 0; i < points; i++) {
    const baseAngle = (i / points) * Math.PI * 2;
    const angleNoise = rng.gaussian() * irregularity * 0.3;
    angles.push(baseAngle + angleNoise);

    const radiusNoise = 1 + rng.gaussian() * irregularity;
    radii.push(radius * Math.max(0.5, Math.min(1.5, radiusNoise)));
  }

  // Build smooth path using cubic bezier
  const pts = angles.map((a, i) => ({
    x: cx + Math.cos(a) * radii[i],
    y: cy + Math.sin(a) * radii[i],
  }));

  return smoothClosedPath(pts);
}

/**
 * Generate a crystalline faceted shape.
 */
export function crystalPath(
  rng: SeededRNG,
  cx: number, cy: number,
  radius: number,
  facets: number = 6,
): string {
  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i < facets; i++) {
    const angle = (i / facets) * Math.PI * 2 - Math.PI / 2;
    const r = radius * (0.7 + rng.next() * 0.6);
    pts.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }

  // Straight lines for crystalline look
  return `M ${pts[0].x} ${pts[0].y} ` +
    pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') + ' Z';
}

/**
 * Generate flowing curves (for interconnected/neural patterns).
 */
export function flowingCurve(
  rng: SeededRNG,
  x1: number, y1: number,
  x2: number, y2: number,
  waviness: number = 0.3,
): string {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  const cpOffset = dist * waviness;
  const cp1x = midX + rng.gaussian() * cpOffset;
  const cp1y = midY + rng.gaussian() * cpOffset;

  return `M ${x1} ${y1} Q ${cp1x} ${cp1y} ${x2} ${y2}`;
}

/**
 * Generate a circle of dots/nodes (for neural/network patterns).
 */
export function nodeCircle(
  rng: SeededRNG,
  cx: number, cy: number,
  radius: number,
  count: number,
): { x: number; y: number; r: number }[] {
  const nodes: { x: number; y: number; r: number }[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rng.range(-0.1, 0.1);
    const dist = radius * (0.6 + rng.next() * 0.8);
    nodes.push({
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      r: 2 + rng.next() * 4,
    });
  }

  return nodes;
}

/**
 * Generate concentric ring path.
 */
export function ringPath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
}

/**
 * Convert points to a smooth closed SVG path using cubic bezier curves.
 */
function smoothClosedPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 3) return '';

  const n = pts.length;
  let d = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];

    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d + ' Z';
}

/**
 * Generate a starburst / radial spike pattern.
 */
export function starburstPath(
  rng: SeededRNG,
  cx: number, cy: number,
  innerR: number, outerR: number,
  spikes: number,
): string {
  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0
      ? outerR * (0.8 + rng.next() * 0.4)
      : innerR * (0.7 + rng.next() * 0.6);
    pts.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }

  return `M ${pts[0].x} ${pts[0].y} ` +
    pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') + ' Z';
}
