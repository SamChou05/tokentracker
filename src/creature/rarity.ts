import type { TraitDNA } from '../analyzer/dna.js';
import type { CreatureState } from '../store.js';

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface RarityResult {
  tier: RarityTier;
  score: number;       // 0-100, higher = rarer
  reasons: string[];   // Human-readable reasons for rarity
}

/** Languages that are uncommon and increase rarity */
const RARE_LANGUAGES = new Set([
  'haskell', 'elixir', 'erlang', 'clojure', 'lisp', 'ocaml',
  'zig', 'nim', 'crystal', 'julia', 'fortran', 'ada', 'cobol',
]);

const UNCOMMON_LANGUAGES = new Set([
  'rust', 'scala', 'kotlin', 'dart', 'r', 'lua',
]);

/** Element + archetype combos that are unusual (higher rarity) */
const RARE_COMBOS = new Set([
  'metal/cerebral',     // Rust + ML
  'arcane/athletic',    // Haskell + fitness
  'nature/crystalline', // Python + crypto
  'fire/phantom',       // Swift + security
  'void/playful',       // Assembly + games
  'water/cerebral',     // PHP + ML
  'arcane/sentinel',    // Haskell + API
]);

/**
 * Calculate rarity tier from Trait DNA and creature state.
 * Higher score = rarer creature.
 *
 * Target distribution:
 *   Common:    0-30  (~50% of creatures)
 *   Uncommon: 31-50  (~25%)
 *   Rare:     51-70  (~15%)
 *   Epic:     71-85  (~8%)
 *   Legendary: 86+   (~2%)
 */
export function calculateRarity(dna: TraitDNA | null, creature: CreatureState): RarityResult {
  if (!dna) {
    return { tier: 'common', score: 0, reasons: ['No DNA analyzed yet'] };
  }

  let score = 0;
  const reasons: string[] = [];

  // 1. Language rarity (0-25 points)
  if (RARE_LANGUAGES.has(dna.primaryLanguage)) {
    score += 25;
    reasons.push(`Rare language: ${dna.primaryLanguage}`);
  } else if (UNCOMMON_LANGUAGES.has(dna.primaryLanguage)) {
    score += 12;
    reasons.push(`Uncommon language: ${dna.primaryLanguage}`);
  }

  // 2. High level (0-20 points)
  if (creature.level >= 10) {
    score += 20;
    reasons.push('Legendary level (10+)');
  } else if (creature.level >= 8) {
    score += 15;
    reasons.push('Elite level (8+)');
  } else if (creature.level >= 6) {
    score += 8;
    reasons.push('Veteran level (6+)');
  }

  // 3. Unusual element+archetype combo (0-20 points)
  const combo = `${dna.element}/${dna.archetype}`;
  if (RARE_COMBOS.has(combo)) {
    score += 20;
    reasons.push(`Rare combo: ${dna.element} × ${dna.archetype}`);
  }

  // 4. Multi-language project (0-10 points)
  if (dna.secondaryLanguage) {
    score += 5;
    reasons.push('Multi-language project');
    if (RARE_LANGUAGES.has(dna.secondaryLanguage) || UNCOMMON_LANGUAGES.has(dna.secondaryLanguage)) {
      score += 5;
      reasons.push(`Secondary language: ${dna.secondaryLanguage}`);
    }
  }

  // 5. High framework diversity (0-10 points)
  if (dna.frameworks.length >= 4) {
    score += 10;
    reasons.push('Complex tech stack (4+ frameworks)');
  } else if (dna.frameworks.length >= 2) {
    score += 5;
    reasons.push('Multi-framework project');
  }

  // 6. High session diversity — both success and failure (0-10 points)
  if (creature.sessions_success > 0 && creature.sessions_failure > 0) {
    const failRatio = creature.sessions_failure / creature.total_sessions;
    if (failRatio > 0.2 && failRatio < 0.5) {
      score += 10;
      reasons.push('Battle-tested (diverse outcomes)');
    } else if (failRatio > 0 && failRatio <= 0.2) {
      score += 5;
      reasons.push('Resilient coder');
    }
  }

  // 7. High code churn (0-5 points)
  if (creature.total_lines_removed > 0 && creature.total_lines_added > 0) {
    const churnRatio = creature.total_lines_removed / creature.total_lines_added;
    if (churnRatio > 0.7) {
      score += 5;
      reasons.push('Heavy refactorer');
    }
  }

  // Cap at 100
  score = Math.min(100, score);

  const tier = scoreToTier(score);

  return { tier, score, reasons };
}

function scoreToTier(score: number): RarityTier {
  if (score >= 86) return 'legendary';
  if (score >= 71) return 'epic';
  if (score >= 51) return 'rare';
  if (score >= 31) return 'uncommon';
  return 'common';
}

/** Display labels for rarity tiers */
export const RARITY_LABELS: Record<RarityTier, string> = {
  common: '⚪ Common',
  uncommon: '🟢 Uncommon',
  rare: '🔵 Rare',
  epic: '🟣 Epic',
  legendary: '🟡 Legendary',
};

/** CSS color for rarity tier */
export const RARITY_COLORS: Record<RarityTier, string> = {
  common: '#9ca3af',     // Gray
  uncommon: '#22c55e',   // Green
  rare: '#3b82f6',       // Blue
  epic: '#a855f7',       // Purple
  legendary: '#f59e0b',  // Gold
};
