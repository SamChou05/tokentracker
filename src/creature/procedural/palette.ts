import { SeededRNG } from './rng.js';
import type { TraitDNA } from '../../analyzer/dna.js';

export interface ColorPalette {
  /** Primary creature color */
  primary: string;
  /** Secondary/accent color */
  secondary: string;
  /** Tertiary accent */
  accent: string;
  /** Background color (dark) */
  background: string;
  /** Glow/energy color */
  glow: string;
  /** Eye/focal point color */
  focal: string;
  /** Muted version for subtle elements */
  muted: string;
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h % 360)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

function hsla(h: number, s: number, l: number, a: number): string {
  return `hsla(${Math.round(h % 360)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
}

/**
 * Generate a full color palette from Trait DNA.
 * Uses color harmony rules based on archetype.
 */
export function generatePalette(dna: TraitDNA, rng: SeededRNG): ColorPalette {
  const h = dna.hue;
  const s = dna.saturation;
  const b = dna.brightness;

  // Harmony offset depends on archetype
  const harmonyOffsets: Record<string, number[]> = {
    athletic: [0, 30, 15],         // Analogous warm
    winged: [0, 120, 240],         // Triadic
    playful: [0, 60, 180],         // Split complementary
    sentinel: [0, 15, 195],        // Near-complementary
    cerebral: [0, 45, 180],        // Extended complementary
    crystalline: [0, 150, 210],    // Cool shifted
    harmonic: [0, 40, 80],         // Analogous wide
    organic: [0, 30, 60],          // Analogous tight
    phantom: [0, 180, 270],        // Complementary + accent
    primal: [0, 20, 40],           // Monochromatic-ish
    radiant: [0, 60, 120],         // Triadic warm
    adaptive: [0, 90, 180],        // Square-ish
  };

  const offsets = harmonyOffsets[dna.archetype] ?? [0, 120, 240];

  // Slight randomization for variety within same DNA
  const hueShift = rng.range(-5, 5);

  const primary = hsl(h + offsets[0] + hueShift, s, b);
  const secondary = hsl(h + offsets[1] + hueShift, s * 0.8, b * 0.9);
  const accent = hsl(h + offsets[2] + hueShift, s * 0.9, b * 1.1);
  const glow = hsla(h + offsets[0], s * 1.2, b * 1.3, 0.6);
  const focal = hsl(h + offsets[0], 90, 70);
  const muted = hsl(h + offsets[0], s * 0.3, b * 0.5);
  const background = hsl(h + offsets[0], 10, 8);

  return { primary, secondary, accent, background, glow, focal, muted };
}

export { hsl, hsla };
