import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getDb, closeDb, resetDbSingleton } from './db.ts';
import {
  upsertProject,
  recordSession,
  getCreature,
  getAllCreatures,
  getSessionHistory,
  calculateLevel,
  calculateXpProgress,
  deriveCodingStyle,
} from './store.ts';
import type { ProjectIdentity } from './project.ts';

let tmpDir: string;
let dbPath: string;

beforeEach(() => {
  resetDbSingleton();
  tmpDir = mkdtempSync(join(tmpdir(), 'aimonsters-test-'));
  dbPath = join(tmpDir, 'test.db');
});

afterEach(() => {
  closeDb();
  resetDbSingleton();
  rmSync(tmpDir, { recursive: true, force: true });
});

const testProject: ProjectIdentity = {
  id: 'samchou/aimonsters',
  name: 'aimonsters',
  remote: 'git@github.com:samchou/aimonsters.git',
  directory: '/Users/samchou/aimonsters',
};

const testProject2: ProjectIdentity = {
  id: 'samchou/webapp',
  name: 'webapp',
  remote: 'git@github.com:samchou/webapp.git',
  directory: '/Users/samchou/webapp',
};

describe('database', () => {
  it('creates DB with WAL mode', () => {
    const db = getDb(dbPath);
    const mode = db.pragma('journal_mode', { simple: true });
    assert.equal(mode, 'wal');
  });

  it('runs migrations to version 3', () => {
    const db = getDb(dbPath);
    const version = db.pragma('user_version', { simple: true });
    assert.equal(version, 3);
  });

  it('creates all tables', () => {
    const db = getDb(dbPath);
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all() as { name: string }[];
    const names = tables.map((t) => t.name);
    assert.ok(names.includes('projects'));
    assert.ok(names.includes('sessions'));
    assert.ok(names.includes('creatures'));
  });
});

describe('calculateLevel (exponential curve)', () => {
  it('returns 0 for zero tokens', () => {
    assert.equal(calculateLevel(0), 0);
  });

  it('returns 0 for small token counts (under 10k)', () => {
    assert.equal(calculateLevel(5000), 0);
    assert.equal(calculateLevel(9999), 0);
  });

  it('returns 1 at 10k tokens', () => {
    assert.equal(calculateLevel(10000), 1);
  });

  it('returns 1 at 25k tokens (still below level 2)', () => {
    assert.equal(calculateLevel(25000), 1);
  });

  it('returns 5 at 350k tokens', () => {
    assert.equal(calculateLevel(350000), 5);
  });

  it('returns 10 at 12M tokens', () => {
    assert.equal(calculateLevel(12000000), 10);
  });

  it('level 15 requires 500M tokens (mythical)', () => {
    assert.equal(calculateLevel(499999999), 14);
    assert.equal(calculateLevel(500000000), 15);
  });

  it('scales much slower than old formula', () => {
    // 100k tokens was Level 7 before, now it's Level 3
    assert.equal(calculateLevel(100000), 3);
    // 1M tokens was Level 10 before, now it's Level 6
    assert.equal(calculateLevel(1000000), 6);
  });
});

describe('calculateXpProgress', () => {
  it('returns 0 at level threshold', () => {
    assert.equal(calculateXpProgress(10000), 0); // Exactly level 1
  });

  it('returns ~0.5 midway between levels', () => {
    // Level 1 = 10k, Level 2 = 30k, midpoint = 20k
    const progress = calculateXpProgress(20000);
    assert.ok(progress > 0.4 && progress < 0.6, `Expected ~0.5, got ${progress}`);
  });

  it('returns close to 1.0 just before next level', () => {
    const progress = calculateXpProgress(29999);
    assert.ok(progress > 0.9, `Expected > 0.9, got ${progress}`);
  });
});

describe('deriveCodingStyle', () => {
  it('returns balanced for insufficient data', () => {
    assert.equal(deriveCodingStyle({
      total_lines_added: 0, total_lines_removed: 0, total_files_changed: 0,
      sessions_success: 1, sessions_failure: 0, total_sessions: 1,
    }), 'balanced');
  });

  it('detects debugger style from high failure rate', () => {
    assert.equal(deriveCodingStyle({
      total_lines_added: 200, total_lines_removed: 100, total_files_changed: 20,
      sessions_success: 3, sessions_failure: 5, total_sessions: 8,
    }), 'debugger');
  });

  it('detects refactorer style from high churn', () => {
    assert.equal(deriveCodingStyle({
      total_lines_added: 500, total_lines_removed: 400, total_files_changed: 30,
      sessions_success: 10, sessions_failure: 1, total_sessions: 11,
    }), 'refactorer');
  });

  it('detects builder style from net additions', () => {
    assert.equal(deriveCodingStyle({
      total_lines_added: 2000, total_lines_removed: 200, total_files_changed: 20,
      sessions_success: 10, sessions_failure: 0, total_sessions: 10,
    }), 'builder');
  });
});

describe('store', () => {
  it('upserts a project', () => {
    upsertProject(testProject, dbPath);
    const db = getDb(dbPath);
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(testProject.id) as any;
    assert.equal(row.name, 'aimonsters');
    assert.equal(row.remote_url, testProject.remote);
  });

  it('updates project on re-upsert', () => {
    upsertProject(testProject, dbPath);
    upsertProject({ ...testProject, name: 'aimonsters-v2' }, dbPath);
    const db = getDb(dbPath);
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(testProject.id) as any;
    assert.equal(row.name, 'aimonsters-v2');
  });

  it('records a session and creates creature', () => {
    upsertProject(testProject, dbPath);
    const { creature } = recordSession(testProject.id, {
      tokens_in: 10000,
      tokens_out: 5000,
      cost_usd: 0.15,
      tool_calls: 30,
      outcome: 'success',
      summary: 'Built feature X',
      lines_added: 200,
      lines_removed: 50,
      files_changed: 8,
    }, dbPath);

    assert.equal(creature.total_tokens, 15000);
    assert.equal(creature.total_sessions, 1);
    assert.equal(creature.project_name, 'aimonsters');
    assert.equal(creature.level, 1); // 15k = level 1 under new curve
    assert.equal(creature.total_lines_added, 200);
    assert.equal(creature.total_lines_removed, 50);
  });

  it('detects level-up', () => {
    upsertProject(testProject, dbPath);

    // First session: 25k tokens → Level 1
    const { creature: c1, leveledUp: l1 } = recordSession(testProject.id, {
      tokens_in: 15000, tokens_out: 10000, cost_usd: 0.25,
      tool_calls: 50, outcome: 'success', summary: 'Session 1',
    }, dbPath);
    assert.equal(c1.level, 1);

    // Second session: +20k = 45k total → Level 2 (threshold 30k)
    const { creature: c2, leveledUp: l2 } = recordSession(testProject.id, {
      tokens_in: 12000, tokens_out: 8000, cost_usd: 0.20,
      tool_calls: 40, outcome: 'success', summary: 'Session 2',
    }, dbPath);
    assert.equal(c2.level, 2);
    assert.equal(l2, true);
  });

  it('accumulates git diff stats across sessions', () => {
    upsertProject(testProject, dbPath);

    recordSession(testProject.id, {
      tokens_in: 10000, tokens_out: 5000, cost_usd: 0.15,
      tool_calls: 30, outcome: 'success', summary: 'S1',
      lines_added: 200, lines_removed: 50, files_changed: 8,
    }, dbPath);

    const { creature } = recordSession(testProject.id, {
      tokens_in: 8000, tokens_out: 4000, cost_usd: 0.12,
      tool_calls: 25, outcome: 'failure', summary: 'S2',
      lines_added: 100, lines_removed: 80, files_changed: 5,
    }, dbPath);

    assert.equal(creature.total_lines_added, 300);
    assert.equal(creature.total_lines_removed, 130);
    assert.equal(creature.total_files_changed, 13);
    assert.equal(creature.sessions_success, 1);
    assert.equal(creature.sessions_failure, 1);
  });

  it('isolates creatures per project', () => {
    upsertProject(testProject, dbPath);
    upsertProject(testProject2, dbPath);

    recordSession(testProject.id, {
      tokens_in: 10000, tokens_out: 5000, cost_usd: 0.15,
      tool_calls: 30, outcome: 'success', summary: null,
    }, dbPath);

    recordSession(testProject2.id, {
      tokens_in: 3000, tokens_out: 1000, cost_usd: 0.04,
      tool_calls: 10, outcome: 'success', summary: null,
    }, dbPath);

    const c1 = getCreature(testProject.id, dbPath);
    const c2 = getCreature(testProject2.id, dbPath);

    assert.equal(c1!.total_tokens, 15000);
    assert.equal(c2!.total_tokens, 4000);
  });

  it('returns null for unfed creature', () => {
    upsertProject(testProject, dbPath);
    const creature = getCreature(testProject.id, dbPath);
    assert.equal(creature, null);
  });

  it('gets all creatures', () => {
    upsertProject(testProject, dbPath);
    upsertProject(testProject2, dbPath);

    recordSession(testProject.id, {
      tokens_in: 10000, tokens_out: 5000, cost_usd: 0.15,
      tool_calls: 30, outcome: 'success', summary: null,
    }, dbPath);

    recordSession(testProject2.id, {
      tokens_in: 3000, tokens_out: 1000, cost_usd: 0.04,
      tool_calls: 10, outcome: 'success', summary: null,
    }, dbPath);

    const creatures = getAllCreatures(dbPath);
    assert.equal(creatures.length, 2);
  });

  it('gets session history in reverse chronological order', () => {
    upsertProject(testProject, dbPath);

    recordSession(testProject.id, {
      tokens_in: 5000, tokens_out: 2000, cost_usd: 0.07,
      tool_calls: 15, outcome: 'success', summary: 'First',
    }, dbPath);

    recordSession(testProject.id, {
      tokens_in: 8000, tokens_out: 4000, cost_usd: 0.12,
      tool_calls: 25, outcome: 'success', summary: 'Second',
    }, dbPath);

    const history = getSessionHistory(testProject.id, 10, dbPath);
    assert.equal(history.length, 2);
    assert.equal(history[0].summary, 'Second');
    assert.equal(history[1].summary, 'First');
  });
});
