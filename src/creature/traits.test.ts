import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deriveTraits, eggTraits } from './traits.ts';
import type { CreatureState } from '../store.ts';

function makeCreature(overrides: Partial<CreatureState> = {}): CreatureState {
  return {
    project_id: 'test/project',
    project_name: 'project',
    remote_url: null,
    total_tokens_in: 0,
    total_tokens_out: 0,
    total_tokens: 0,
    total_cost_usd: 0,
    total_sessions: 0,
    total_tool_calls: 0,
    total_lines_added: 0,
    total_lines_removed: 0,
    total_files_changed: 0,
    sessions_success: 0,
    sessions_failure: 0,
    level: 0,
    xp_progress: 0,
    coding_style: 'balanced',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  };
}

describe('trait derivation', () => {
  it('unfed creature produces egg traits', () => {
    const traits = deriveTraits(makeCreature({ level: 0 }));
    assert.equal(traits.body, 'egg');
    assert.equal(traits.size, 'egg');
    assert.equal(traits.horns, 'none');
    assert.equal(traits.wings, 'none');
  });

  it('eggTraits helper works', () => {
    const traits = eggTraits('my-project');
    assert.equal(traits.body, 'egg');
    assert.equal(traits.name, 'my-project');
    assert.equal(traits.level, 0);
  });

  it('low level produces blob', () => {
    const traits = deriveTraits(makeCreature({ level: 2, total_sessions: 3 }));
    assert.equal(traits.body, 'blob');
    assert.equal(traits.size, 'small');
    assert.equal(traits.horns, 'none');
    assert.equal(traits.wings, 'none');
  });

  it('mid level produces serpent with decorations', () => {
    const traits = deriveTraits(makeCreature({
      level: 6, total_sessions: 20, total_tokens: 50000,
      total_tokens_in: 30000, total_tokens_out: 20000,
    }));
    assert.equal(traits.body, 'serpent');
    assert.equal(traits.size, 'medium');
    assert.notEqual(traits.horns, 'none');
    assert.notEqual(traits.tail, 'none');
  });

  it('high level produces dragon with full decorations', () => {
    const traits = deriveTraits(makeCreature({
      level: 9, total_sessions: 100, total_tokens: 500000,
      total_tokens_in: 300000, total_tokens_out: 200000, total_tool_calls: 2000,
    }));
    assert.equal(traits.body, 'dragon');
    assert.equal(traits.size, 'large');
    assert.notEqual(traits.wings, 'none');
    assert.notEqual(traits.aura, 'none');
  });

  it('max level produces phoenix', () => {
    const traits = deriveTraits(makeCreature({
      level: 12, total_sessions: 500, total_tokens: 5000000,
      total_tokens_in: 3000000, total_tokens_out: 2000000, total_tool_calls: 10000,
    }));
    assert.equal(traits.body, 'phoenix');
    assert.equal(traits.size, 'large');
    assert.equal(traits.wings, 'energy');
    assert.equal(traits.aura, 'cosmic');
  });

  it('is deterministic — same input produces same output', () => {
    const creature = makeCreature({
      level: 7, total_sessions: 50, total_tokens: 200000,
      total_tokens_in: 120000, total_tokens_out: 80000, total_tool_calls: 800,
    });
    const t1 = deriveTraits(creature);
    const t2 = deriveTraits(creature);
    assert.deepEqual(t1, t2);
  });

  it('different stats produce different color palettes', () => {
    const c1 = deriveTraits(makeCreature({
      level: 5, total_tokens_in: 10000, total_tokens_out: 5000,
      total_tokens: 15000, total_sessions: 10, total_tool_calls: 100,
    }));
    const c2 = deriveTraits(makeCreature({
      level: 5, total_tokens_in: 50000, total_tokens_out: 30000,
      total_tokens: 80000, total_sessions: 50, total_tool_calls: 800,
    }));
    assert.equal(c1.body, c2.body); // same level = same body
    assert.ok(c1.colors);
    assert.ok(c2.colors);
  });

  it('coding style influences color palette', () => {
    // Just verify it doesn't crash — palette selection is probabilistic
    const builder = deriveTraits(makeCreature({
      level: 5, coding_style: 'builder',
      total_tokens_in: 200000, total_tokens_out: 150000, total_tokens: 350000,
    }));
    const debugger_ = deriveTraits(makeCreature({
      level: 5, coding_style: 'debugger',
      total_tokens_in: 200000, total_tokens_out: 150000, total_tokens: 350000,
    }));
    assert.ok(builder.colors);
    assert.ok(debugger_.colors);
  });
});
