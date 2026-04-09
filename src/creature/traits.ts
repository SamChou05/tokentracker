import type { CreatureState } from '../store.js';

/** Body shapes — unlocked by session count and coding volume */
export type BodyShape = 'egg' | 'blob' | 'sprite' | 'serpent' | 'dragon' | 'phoenix';

/** Size class — scales with level */
export type SizeClass = 'egg' | 'small' | 'medium' | 'large';

/** Eye style variants */
export type EyeStyle = 'dot' | 'round' | 'fierce' | 'glowing' | 'ancient';

/** Decoration slots */
export type HornStyle = 'none' | 'nubs' | 'curved' | 'crown' | 'antlers';
export type WingStyle = 'none' | 'stubs' | 'bat' | 'feathered' | 'energy';
export type TailStyle = 'none' | 'short' | 'long' | 'forked' | 'flame';
export type AuraStyle = 'none' | 'faint' | 'glow' | 'blaze' | 'cosmic';

/** ANSI color palette */
export interface ColorPalette {
  primary: string;    // Main body color (ANSI escape)
  secondary: string;  // Accent color
  eye: string;        // Eye color
  aura: string;       // Aura/glow color
}

/** Full trait set for rendering */
export interface TraitSet {
  body: BodyShape;
  size: SizeClass;
  eyes: EyeStyle;
  horns: HornStyle;
  wings: WingStyle;
  tail: TailStyle;
  aura: AuraStyle;
  colors: ColorPalette;
  level: number;
  name: string;
}

// ANSI 256-color helpers
const c = (code: number) => `\x1b[38;5;${code}m`;
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

/** Color palettes — selected by a hash of creature stats */
const PALETTES: ColorPalette[] = [
  // 0: Emerald (balanced coder)
  { primary: c(35), secondary: c(48), eye: c(226), aura: c(121) },
  // 1: Crimson (debug warrior)
  { primary: c(196), secondary: c(208), eye: c(226), aura: c(203) },
  // 2: Azure (feature builder)
  { primary: c(39), secondary: c(75), eye: c(231), aura: c(117) },
  // 3: Amethyst (refactorer)
  { primary: c(135), secondary: c(177), eye: c(219), aura: c(183) },
  // 4: Gold (high-value sessions)
  { primary: c(220), secondary: c(214), eye: c(231), aura: c(228) },
  // 5: Obsidian (high efficiency — low tokens, high output)
  { primary: c(245), secondary: c(255), eye: c(196), aura: c(240) },
  // 6: Toxic (lots of failures overcome)
  { primary: c(46), secondary: c(118), eye: c(201), aura: c(82) },
  // 7: Frost (methodical, steady sessions)
  { primary: c(159), secondary: c(195), eye: c(231), aura: c(153) },
];

/**
 * Deterministic hash from creature stats → palette index.
 * Uses a simple but stable mixing of key stats.
 */
function statHash(creature: CreatureState): number {
  const a = creature.total_tokens_in;
  const b = creature.total_tokens_out;
  const c = creature.total_sessions;
  const d = creature.total_tool_calls;
  // Mix bits for even distribution
  return Math.abs(((a * 2654435761) ^ (b * 2246822519) ^ (c * 3266489917) ^ (d * 668265263)) >>> 0);
}

/** Derive body shape from level and session count */
function deriveBody(level: number, sessions: number): BodyShape {
  if (level === 0) return 'egg';
  if (level <= 2) return 'blob';
  if (level <= 4) return 'sprite';
  if (level <= 6) return 'serpent';
  if (level <= 9) return 'dragon';
  return 'phoenix';
}

/** Derive size class from level */
function deriveSize(level: number): SizeClass {
  if (level === 0) return 'egg';
  if (level <= 3) return 'small';
  if (level <= 7) return 'medium';
  return 'large';
}

/** Derive eye style from sessions and level */
function deriveEyes(level: number, sessions: number): EyeStyle {
  if (level <= 1) return 'dot';
  if (level <= 3) return 'round';
  if (level <= 5) return 'fierce';
  if (level <= 8) return 'glowing';
  return 'ancient';
}

/** Derive horns from level */
function deriveHorns(level: number): HornStyle {
  if (level < 3) return 'none';
  if (level < 5) return 'nubs';
  if (level < 7) return 'curved';
  if (level < 10) return 'crown';
  return 'antlers';
}

/** Derive wings from level and token volume */
function deriveWings(level: number, totalTokens: number): WingStyle {
  if (level < 4) return 'none';
  if (level < 6) return 'stubs';
  if (level < 8) return 'bat';
  if (level < 10) return 'feathered';
  return 'energy';
}

/** Derive tail from level */
function deriveTail(level: number): TailStyle {
  if (level < 2) return 'none';
  if (level < 4) return 'short';
  if (level < 6) return 'long';
  if (level < 9) return 'forked';
  return 'flame';
}

/** Derive aura from level */
function deriveAura(level: number): AuraStyle {
  if (level < 3) return 'none';
  if (level < 5) return 'faint';
  if (level < 7) return 'glow';
  if (level < 10) return 'blaze';
  return 'cosmic';
}

/** Derive color palette from creature stats and coding style */
function deriveColors(creature: CreatureState): ColorPalette {
  // Style-influenced palette selection
  const styleWeights: Record<string, number[]> = {
    balanced:   [0, 7],     // Emerald, Frost
    builder:    [2, 4],     // Azure, Gold
    debugger:   [1, 6],     // Crimson, Toxic
    refactorer: [3, 5],     // Amethyst, Obsidian
    architect:  [4, 7],     // Gold, Frost
  };

  const style = creature.coding_style ?? 'balanced';
  const preferred = styleWeights[style] ?? [0, 7];
  const hash = statHash(creature);

  // 60% chance of style-matched palette, 40% any palette
  if (hash % 10 < 6) {
    return PALETTES[preferred[hash % preferred.length]];
  }
  return PALETTES[hash % PALETTES.length];
}

/**
 * Derive a complete trait set from creature state.
 * Deterministic: same creature state always produces same traits.
 */
export function deriveTraits(creature: CreatureState): TraitSet {
  const level = creature.level;

  return {
    body: deriveBody(level, creature.total_sessions),
    size: deriveSize(level),
    eyes: deriveEyes(level, creature.total_sessions),
    horns: deriveHorns(level),
    wings: deriveWings(level, creature.total_tokens),
    tail: deriveTail(level),
    aura: deriveAura(level),
    colors: deriveColors(creature),
    level,
    name: creature.project_name,
  };
}

/**
 * Derive traits for an unfed creature (egg state).
 */
export function eggTraits(projectName: string): TraitSet {
  return {
    body: 'egg',
    size: 'egg',
    eyes: 'dot',
    horns: 'none',
    wings: 'none',
    tail: 'none',
    aura: 'none',
    colors: PALETTES[0],
    level: 0,
    name: projectName,
  };
}

export { RESET, BOLD, c, PALETTES };
