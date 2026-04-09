import { SeededRNG } from './rng.js';
import { generatePalette, hsl, hsla, type ColorPalette } from './palette.js';
import { blobPath, crystalPath, flowingCurve, nodeCircle, ringPath, starburstPath } from './shapes.js';
import type { TraitDNA } from '../../analyzer/dna.js';

interface GenerateOptions {
  width: number;
  height: number;
  level: number;
}

/**
 * Generate a complete creature SVG from Trait DNA.
 * Deterministic: same DNA + level always produces same output.
 */
export function generateCreatureSVG(
  dna: TraitDNA,
  options: GenerateOptions,
): string {
  const { width, height, level } = options;
  const rng = new SeededRNG(dna.formSeed);
  const palette = generatePalette(dna, rng);
  const cx = width / 2;
  const cy = height / 2;
  const baseR = Math.min(width, height) * 0.3;

  // Number of layers increases with level
  const layerCount = Math.min(2 + level, 8);

  const layers: string[] = [];

  // Background
  layers.push(`<rect width="${width}" height="${height}" fill="${palette.background}"/>`);

  // SVG filters for glow and atmosphere
  layers.push(svgFilters(palette));

  // Ambient particles (background atmosphere)
  layers.push(generateAmbientParticles(rng, width, height, palette, level));

  // Main body — archetype determines the composition approach
  switch (dna.archetype) {
    case 'cerebral':
      layers.push(generateCerebral(rng, cx, cy, baseR, palette, dna, layerCount));
      break;
    case 'sentinel':
      layers.push(generateSentinel(rng, cx, cy, baseR, palette, dna, layerCount));
      break;
    case 'athletic':
      layers.push(generateAthletic(rng, cx, cy, baseR, palette, dna, layerCount));
      break;
    case 'winged':
      layers.push(generateWinged(rng, cx, cy, baseR, palette, dna, layerCount));
      break;
    case 'crystalline':
      layers.push(generateCrystalline(rng, cx, cy, baseR, palette, dna, layerCount));
      break;
    case 'playful':
      layers.push(generatePlayful(rng, cx, cy, baseR, palette, dna, layerCount));
      break;
    case 'phantom':
      layers.push(generatePhantom(rng, cx, cy, baseR, palette, dna, layerCount));
      break;
    default:
      // Generic organic form for adaptive, harmonic, organic, primal, radiant
      layers.push(generateOrganic(rng, cx, cy, baseR, palette, dna, layerCount));
      break;
  }

  // Core focal point (eyes/energy center)
  layers.push(generateFocalPoint(rng, cx, cy, baseR * 0.15, palette, level));

  // Level-based energy aura (higher level = more intense outer glow)
  if (level >= 3) {
    const auraIntensity = Math.min(1, (level - 2) / 8);
    const auraR = baseR * (0.8 + auraIntensity * 0.6);
    layers.push(`<circle cx="${cx}" cy="${cy}" r="${auraR}" fill="none" stroke="${palette.glow}" stroke-width="${1 + auraIntensity * 2}" opacity="${auraIntensity * 0.3}" filter="url(#softGlow)"/>`);
  }
  if (level >= 6) {
    const outerR = baseR * 1.3;
    layers.push(`<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${palette.focal}" stroke-width="0.5" opacity="0.15" stroke-dasharray="4 8"/>`);
  }
  if (level >= 9) {
    // Crown particles for legendary creatures
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist = baseR * 1.15;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      layers.push(`<circle cx="${px}" cy="${py}" r="2" fill="${palette.focal}" opacity="0.6"/>`);
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    ...layers,
    `</svg>`,
  ].join('\n');
}

// ─── SVG FILTERS ──────────────────────────────────────

function svgFilters(palette: ColorPalette): string {
  return `<defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="15" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="innerGlow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="blur" in2="SourceGraphic" operator="atop"/>
    </filter>
    <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${palette.focal}" stop-opacity="1"/>
      <stop offset="60%" stop-color="${palette.primary}" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${palette.primary}" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}

// ─── AMBIENT PARTICLES ─────────────────────────────────

function generateAmbientParticles(
  rng: SeededRNG, w: number, h: number, palette: ColorPalette, level: number,
): string {
  const count = 10 + level * 5;
  const particles: string[] = [];

  for (let i = 0; i < count; i++) {
    const x = rng.range(0, w);
    const y = rng.range(0, h);
    const r = rng.range(0.5, 2.5);
    const opacity = rng.range(0.1, 0.4);
    particles.push(
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${palette.glow}" opacity="${opacity}"/>`
    );
  }

  return `<g class="ambient">${particles.join('')}</g>`;
}

// ─── FOCAL POINT (EYES/CORE) ──────────────────────────

function generateFocalPoint(
  rng: SeededRNG, cx: number, cy: number, r: number, palette: ColorPalette, level: number,
): string {
  const glowR = r * (2 + level * 0.3);
  return `<g class="focal" filter="url(#glow)">
    <circle cx="${cx}" cy="${cy}" r="${glowR}" fill="url(#coreGradient)" opacity="0.5"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 1.5}" fill="${palette.focal}" opacity="0.3"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${palette.focal}" opacity="0.8"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.4}" fill="white" opacity="0.9"/>
  </g>`;
}

// ─── ARCHETYPE GENERATORS ─────────────────────────────

function generateCerebral(
  rng: SeededRNG, cx: number, cy: number, baseR: number,
  palette: ColorPalette, dna: TraitDNA, layers: number,
): string {
  const parts: string[] = [];

  // Neural network: nodes connected by flowing curves
  for (let layer = 0; layer < layers; layer++) {
    const r = baseR * (0.4 + layer * 0.15);
    const nodeCount = 5 + layer * 2;
    const nodes = nodeCircle(rng, cx, cy, r, nodeCount);

    // Connection lines
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (rng.chance(0.3)) {
          const opacity = 0.1 + (layers - layer) * 0.05;
          parts.push(
            `<path d="${flowingCurve(rng, nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y, 0.4)}" fill="none" stroke="${palette.secondary}" stroke-width="0.8" opacity="${opacity}"/>`
          );
        }
      }
    }

    // Nodes
    for (const node of nodes) {
      const opacity = 0.3 + (layers - layer) * 0.1;
      parts.push(
        `<circle cx="${node.x}" cy="${node.y}" r="${node.r}" fill="${palette.primary}" opacity="${opacity}"/>`
      );
      if (rng.chance(0.4)) {
        parts.push(
          `<circle cx="${node.x}" cy="${node.y}" r="${node.r * 2}" fill="${palette.glow}" opacity="${opacity * 0.3}"/>`
        );
      }
    }
  }

  // Central organic core
  const corePath = blobPath(rng, cx, cy, baseR * 0.4, 0.3, 10);
  parts.push(`<path d="${corePath}" fill="${palette.primary}" opacity="0.4" filter="url(#softGlow)"/>`);
  parts.push(`<path d="${corePath}" fill="none" stroke="${palette.accent}" stroke-width="1" opacity="0.5"/>`);

  return `<g class="cerebral">${parts.join('\n')}</g>`;
}

function generateSentinel(
  rng: SeededRNG, cx: number, cy: number, baseR: number,
  palette: ColorPalette, dna: TraitDNA, layers: number,
): string {
  const parts: string[] = [];

  // Concentric geometric rings
  for (let i = layers; i >= 1; i--) {
    const r = baseR * (i / layers) * 1.1;
    const facets = 4 + rng.int(0, 4);
    const path = crystalPath(rng, cx, cy, r, facets);
    const opacity = 0.15 + (layers - i) * 0.05;
    parts.push(`<path d="${path}" fill="${palette.primary}" opacity="${opacity}" stroke="${palette.secondary}" stroke-width="0.5"/>`);
  }

  // Armor plate details
  for (let i = 0; i < layers * 2; i++) {
    const angle = rng.range(0, Math.PI * 2);
    const dist = rng.range(baseR * 0.2, baseR * 0.9);
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const plateR = rng.range(5, 15);
    const platePath = crystalPath(rng, px, py, plateR, rng.int(3, 6));
    parts.push(`<path d="${platePath}" fill="${palette.accent}" opacity="0.3" stroke="${palette.secondary}" stroke-width="0.3"/>`);
  }

  // Central shield
  const shieldPath = crystalPath(rng, cx, cy, baseR * 0.3, 6);
  parts.push(`<path d="${shieldPath}" fill="${palette.primary}" opacity="0.5" filter="url(#innerGlow)"/>`);

  return `<g class="sentinel">${parts.join('\n')}</g>`;
}

function generateAthletic(
  rng: SeededRNG, cx: number, cy: number, baseR: number,
  palette: ColorPalette, dna: TraitDNA, layers: number,
): string {
  const parts: string[] = [];

  // Radial energy bursts
  const spikePath = starburstPath(rng, cx, cy, baseR * 0.3, baseR * 0.9, 5 + layers);
  parts.push(`<path d="${spikePath}" fill="${palette.primary}" opacity="0.2" filter="url(#softGlow)"/>`);

  // Muscular flowing forms — layered organic blobs
  for (let i = 0; i < layers; i++) {
    const offsetX = rng.gaussian() * baseR * 0.1;
    const offsetY = rng.gaussian() * baseR * 0.1;
    const r = baseR * (0.7 - i * 0.06);
    const path = blobPath(rng, cx + offsetX, cy + offsetY, r, 0.4, 8 + i);
    const opacity = 0.15 + i * 0.05;
    parts.push(`<path d="${path}" fill="${palette.primary}" opacity="${opacity}"/>`);
    parts.push(`<path d="${path}" fill="none" stroke="${palette.accent}" stroke-width="0.5" opacity="${opacity * 0.8}"/>`);
  }

  // Energy rings
  for (let i = 0; i < 3; i++) {
    const r = baseR * (0.5 + i * 0.2);
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette.glow}" stroke-width="1" opacity="${0.2 - i * 0.05}"/>`);
  }

  return `<g class="athletic">${parts.join('\n')}</g>`;
}

function generateWinged(
  rng: SeededRNG, cx: number, cy: number, baseR: number,
  palette: ColorPalette, dna: TraitDNA, layers: number,
): string {
  const parts: string[] = [];

  // Spread wing patterns — mirrored flowing curves
  for (let i = 0; i < layers; i++) {
    const span = baseR * (0.5 + i * 0.15);
    const lift = rng.range(-baseR * 0.3, baseR * 0.1);

    // Left wing curve
    const leftPath = flowingCurve(rng, cx, cy + lift, cx - span, cy - span * 0.5, 0.5);
    parts.push(`<path d="${leftPath}" fill="none" stroke="${palette.primary}" stroke-width="${2 - i * 0.2}" opacity="${0.4 - i * 0.03}"/>`);

    // Right wing curve (mirrored)
    const rightPath = flowingCurve(rng, cx, cy + lift, cx + span, cy - span * 0.5, 0.5);
    parts.push(`<path d="${rightPath}" fill="none" stroke="${palette.primary}" stroke-width="${2 - i * 0.2}" opacity="${0.4 - i * 0.03}"/>`);
  }

  // Network nodes between wings
  const nodeCount = 8 + layers * 2;
  const nodes = nodeCircle(rng, cx, cy, baseR * 0.6, nodeCount);
  for (const node of nodes) {
    parts.push(`<circle cx="${node.x}" cy="${node.y}" r="${node.r * 0.8}" fill="${palette.accent}" opacity="0.3"/>`);
  }

  // Central body — soft organic
  const bodyPath = blobPath(rng, cx, cy, baseR * 0.35, 0.2, 8);
  parts.push(`<path d="${bodyPath}" fill="${palette.primary}" opacity="0.4" filter="url(#softGlow)"/>`);

  return `<g class="winged">${parts.join('\n')}</g>`;
}

function generateCrystalline(
  rng: SeededRNG, cx: number, cy: number, baseR: number,
  palette: ColorPalette, dna: TraitDNA, layers: number,
): string {
  const parts: string[] = [];

  // Faceted crystal cluster
  for (let i = 0; i < layers * 3; i++) {
    const angle = rng.range(0, Math.PI * 2);
    const dist = rng.range(0, baseR * 0.8);
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const size = rng.range(8, baseR * 0.3);
    const facets = rng.int(3, 7);
    const path = crystalPath(rng, px, py, size, facets);
    const opacity = 0.1 + rng.next() * 0.3;

    parts.push(`<path d="${path}" fill="${rng.chance(0.5) ? palette.primary : palette.secondary}" opacity="${opacity}" stroke="${palette.accent}" stroke-width="0.3"/>`);
  }

  // Refractive glow lines
  for (let i = 0; i < layers * 2; i++) {
    const x1 = cx + rng.gaussian() * baseR * 0.5;
    const y1 = cy + rng.gaussian() * baseR * 0.5;
    const x2 = cx + rng.gaussian() * baseR * 0.5;
    const y2 = cy + rng.gaussian() * baseR * 0.5;
    parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${palette.glow}" stroke-width="0.5" opacity="0.2"/>`);
  }

  return `<g class="crystalline">${parts.join('\n')}</g>`;
}

function generatePlayful(
  rng: SeededRNG, cx: number, cy: number, baseR: number,
  palette: ColorPalette, dna: TraitDNA, layers: number,
): string {
  const parts: string[] = [];

  // Bouncy circles and soft shapes
  for (let i = 0; i < layers * 3; i++) {
    const angle = rng.range(0, Math.PI * 2);
    const dist = rng.range(0, baseR * 0.9);
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const r = rng.range(5, 25);
    const color = rng.pick([palette.primary, palette.secondary, palette.accent]);
    parts.push(`<circle cx="${px}" cy="${py}" r="${r}" fill="${color}" opacity="${rng.range(0.15, 0.45)}"/>`);
  }

  // Central blob body
  const bodyPath = blobPath(rng, cx, cy, baseR * 0.4, 0.5, 10);
  parts.push(`<path d="${bodyPath}" fill="${palette.primary}" opacity="0.5"/>`);

  return `<g class="playful">${parts.join('\n')}</g>`;
}

function generatePhantom(
  rng: SeededRNG, cx: number, cy: number, baseR: number,
  palette: ColorPalette, dna: TraitDNA, layers: number,
): string {
  const parts: string[] = [];

  // Ethereal wisps — flowing curves that fade
  for (let i = 0; i < layers * 3; i++) {
    const startAngle = rng.range(0, Math.PI * 2);
    const startDist = rng.range(baseR * 0.1, baseR * 0.4);
    const endDist = rng.range(baseR * 0.5, baseR * 1.2);
    const x1 = cx + Math.cos(startAngle) * startDist;
    const y1 = cy + Math.sin(startAngle) * startDist;
    const x2 = cx + Math.cos(startAngle + rng.range(-0.5, 0.5)) * endDist;
    const y2 = cy + Math.sin(startAngle + rng.range(-0.5, 0.5)) * endDist;

    parts.push(
      `<path d="${flowingCurve(rng, x1, y1, x2, y2, 0.6)}" fill="none" stroke="${palette.primary}" stroke-width="${rng.range(0.5, 3)}" opacity="${rng.range(0.1, 0.3)}" filter="url(#softGlow)"/>`
    );
  }

  // Central void
  const voidPath = blobPath(rng, cx, cy, baseR * 0.25, 0.2, 8);
  parts.push(`<path d="${voidPath}" fill="${palette.muted}" opacity="0.6"/>`);

  return `<g class="phantom">${parts.join('\n')}</g>`;
}

function generateOrganic(
  rng: SeededRNG, cx: number, cy: number, baseR: number,
  palette: ColorPalette, dna: TraitDNA, layers: number,
): string {
  const parts: string[] = [];

  // Layered organic blobs with increasing detail
  for (let i = layers; i >= 0; i--) {
    const r = baseR * (0.3 + i * 0.1);
    const irregularity = 0.2 + dna.energy * 0.3;
    const points = 6 + i * 2;
    const path = blobPath(rng, cx, cy, r, irregularity, points);
    const opacity = 0.1 + (layers - i) * 0.05;
    const color = i % 2 === 0 ? palette.primary : palette.secondary;
    parts.push(`<path d="${path}" fill="${color}" opacity="${opacity}"/>`);
  }

  // Organic tendrils
  for (let i = 0; i < layers; i++) {
    const angle = rng.range(0, Math.PI * 2);
    const x1 = cx + Math.cos(angle) * baseR * 0.2;
    const y1 = cy + Math.sin(angle) * baseR * 0.2;
    const x2 = cx + Math.cos(angle) * baseR * (0.7 + rng.next() * 0.5);
    const y2 = cy + Math.sin(angle) * baseR * (0.7 + rng.next() * 0.5);
    parts.push(
      `<path d="${flowingCurve(rng, x1, y1, x2, y2, 0.5)}" fill="none" stroke="${palette.accent}" stroke-width="1.5" opacity="0.25"/>`
    );
  }

  return `<g class="organic">${parts.join('\n')}</g>`;
}
