import { analyzeLanguages, type Element } from './languages.js';
import { analyzeFrameworks, type FormModifier } from './frameworks.js';
import { analyzeDomain, type Archetype } from './domain.js';

/** Complete Trait DNA for a creature */
export interface TraitDNA {
  /** Primary element type (from language) */
  element: Element;
  /** Creature archetype (from domain) */
  archetype: Archetype;
  /** Form modifier (from framework) */
  formModifier: FormModifier;

  /** Color palette seeds (deterministic from project) */
  hue: number;          // 0-360 primary hue
  saturation: number;   // 0-100
  brightness: number;   // 0-100

  /** Shape generation seed (deterministic hash) */
  formSeed: number;

  /** Visual parameters (0.0-1.0) */
  complexity: number;   // How intricate the art is (from file count / code volume)
  energy: number;       // How dynamic/animated it feels (from coding intensity)
  symmetry: number;     // How symmetric the patterns are (from code structure)
  density: number;      // How dense the visual elements are

  /** Detected metadata */
  primaryLanguage: string;
  secondaryLanguage: string | null;
  frameworks: string[];
  domainKeywords: string[];
  domainConfidence: number;

  /** Hash of all inputs for change detection */
  dnaHash: string;
}

/**
 * Element → base hue mapping for color palette generation.
 */
const ELEMENT_HUES: Record<Element, number> = {
  electric: 195,   // Cyan/blue
  nature: 120,     // Green
  metal: 220,      // Steel blue
  wind: 165,       // Teal
  fire: 15,        // Orange-red
  crystal: 330,    // Pink/magenta
  earth: 35,       // Warm brown-orange
  void: 270,       // Purple
  arcane: 280,     // Deep purple
  water: 200,      // Blue
};

/**
 * Simple deterministic hash function.
 * Produces a 32-bit integer from a string.
 */
function hashString(str: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return hash >>> 0; // Ensure unsigned
}

/**
 * Convert a hash to a float in [0, 1).
 */
function hashToFloat(hash: number, salt: number = 0): number {
  return ((hash ^ (salt * 2654435761)) >>> 0) / 0xFFFFFFFF;
}

/**
 * Analyze a project directory and produce deterministic Trait DNA.
 */
export function analyzeProject(cwd: string): TraitDNA {
  const lang = analyzeLanguages(cwd);
  const fw = analyzeFrameworks(cwd);
  const domain = analyzeDomain(cwd);

  // Build a deterministic seed from all signals
  const seedString = [
    lang.primary,
    lang.secondary || '',
    lang.totalFiles.toString(),
    fw.formModifier,
    fw.frameworks.join(','),
    domain.archetype,
    domain.matchedKeywords.join(','),
  ].join('|');

  const seed = hashString(seedString);

  // Color palette — base hue from element, shifted by project uniqueness
  const baseHue = ELEMENT_HUES[lang.element] ?? 195;
  const hueShift = (hashToFloat(seed, 1) - 0.5) * 40; // ±20 degrees variation
  const hue = ((baseHue + hueShift) % 360 + 360) % 360;

  const saturation = 50 + hashToFloat(seed, 2) * 40;  // 50-90
  const brightness = 40 + hashToFloat(seed, 3) * 35;  // 40-75

  // Complexity from total file count (more files = more intricate)
  const complexity = Math.min(1.0, lang.totalFiles / 200);

  // Energy from framework type
  const energyMap: Record<FormModifier, number> = {
    interconnected: 0.7, flowing: 0.6, structured: 0.4,
    minimal: 0.3, systematic: 0.5, reactive: 0.8,
    spatial: 0.7, analytical: 0.5, native: 0.6, foundational: 0.4,
  };
  const energy = energyMap[fw.formModifier] ?? 0.5;

  // Symmetry — structured frameworks tend toward symmetry
  const symmetryMap: Record<FormModifier, number> = {
    interconnected: 0.5, flowing: 0.3, structured: 0.8,
    minimal: 0.6, systematic: 0.9, reactive: 0.4,
    spatial: 0.5, analytical: 0.7, native: 0.6, foundational: 0.5,
  };
  const symmetry = symmetryMap[fw.formModifier] ?? 0.5;

  // Density from language count
  const langCount = Object.keys(lang.distribution).length;
  const density = Math.min(1.0, langCount / 6);

  const dnaHash = hashString(seedString + hue.toFixed(2)).toString(16).padStart(8, '0');

  return {
    element: lang.element,
    archetype: domain.archetype,
    formModifier: fw.formModifier,
    hue: Math.round(hue),
    saturation: Math.round(saturation),
    brightness: Math.round(brightness),
    formSeed: seed,
    complexity,
    energy,
    symmetry,
    density,
    primaryLanguage: lang.primary,
    secondaryLanguage: lang.secondary,
    frameworks: fw.frameworks,
    domainKeywords: domain.matchedKeywords,
    domainConfidence: domain.confidence,
    dnaHash,
  };
}
