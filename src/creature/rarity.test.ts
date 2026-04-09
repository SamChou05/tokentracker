import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateRarity } from './rarity.ts';
import type { CreatureState } from '../store.ts';
import type { TraitDNA } from '../analyzer/dna.ts';

function makeDNA(overrides: Partial<TraitDNA> = {}): TraitDNA {
  return {
    element: 'electric', archetype: 'adaptive', formModifier: 'foundational',
    hue: 195, saturation: 70, brightness: 55, formSeed: 12345,
    complexity: 0.5, energy: 0.5, symmetry: 0.5, density: 0.5,
    primaryLanguage: 'typescript', secondaryLanguage: null,
    frameworks: [], domainKeywords: [], domainConfidence: 0,
    dnaHash: 'test1234',
    ...overrides,
  };
}

function makeCreature(overrides: Partial<CreatureState> = {}): CreatureState {
  return {
    project_id: 'test/project', project_name: 'project', remote_url: null,
    total_tokens_in: 10000, total_tokens_out: 5000, total_tokens: 15000,
    total_cost_usd: 0.15, total_sessions: 5, total_tool_calls: 50,
    total_lines_added: 200, total_lines_removed: 50, total_files_changed: 10,
    sessions_success: 5, sessions_failure: 0,
    level: 2, xp_progress: 0.3, coding_style: 'balanced', trait_dna: null,
    created_at: '2026-01-01', updated_at: '2026-04-08',
    ...overrides,
  };
}

describe('rarity calculation', () => {
  it('common TypeScript project is common tier', () => {
    const result = calculateRarity(makeDNA(), makeCreature());
    assert.equal(result.tier, 'common');
    assert.ok(result.score < 31);
  });

  it('rare language increases rarity', () => {
    const result = calculateRarity(
      makeDNA({ primaryLanguage: 'haskell', element: 'arcane' }),
      makeCreature(),
    );
    assert.ok(result.score >= 25);
    assert.ok(result.reasons.some(r => r.includes('Rare language')));
  });

  it('high level increases rarity', () => {
    const result = calculateRarity(makeDNA(), makeCreature({ level: 10 }));
    assert.ok(result.score >= 20);
    assert.ok(result.reasons.some(r => r.includes('Legendary level')));
  });

  it('rare combo increases rarity', () => {
    const result = calculateRarity(
      makeDNA({ element: 'metal', archetype: 'cerebral', primaryLanguage: 'rust' }),
      makeCreature(),
    );
    assert.ok(result.reasons.some(r => r.includes('Rare combo')));
  });

  it('Haskell + high level + rare combo = epic or legendary', () => {
    const result = calculateRarity(
      makeDNA({
        primaryLanguage: 'haskell', element: 'arcane', archetype: 'sentinel',
        frameworks: ['Servant', 'Yesod'],
      }),
      makeCreature({ level: 10, sessions_success: 80, sessions_failure: 20, total_sessions: 100 }),
    );
    assert.ok(result.tier === 'epic' || result.tier === 'legendary');
    assert.ok(result.score >= 71);
  });

  it('returns common with no DNA', () => {
    const result = calculateRarity(null, makeCreature());
    assert.equal(result.tier, 'common');
    assert.equal(result.score, 0);
  });

  it('multi-language adds rarity', () => {
    const result = calculateRarity(
      makeDNA({ secondaryLanguage: 'python' }),
      makeCreature(),
    );
    assert.ok(result.reasons.some(r => r.includes('Multi-language')));
  });

  it('battle-tested adds rarity', () => {
    const result = calculateRarity(
      makeDNA(),
      makeCreature({ sessions_success: 7, sessions_failure: 3, total_sessions: 10 }),
    );
    assert.ok(result.reasons.some(r => r.includes('Battle-tested')));
  });
});
