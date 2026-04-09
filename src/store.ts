import { getDb, closeDb, resetDbSingleton } from './db.js';
import type { ProjectIdentity } from './project.js';

export interface SessionData {
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  tool_calls: number;
  outcome: string;
  summary: string | null;
  lines_added?: number;
  lines_removed?: number;
  files_changed?: number;
}

/** Dominant coding style derived from accumulated metrics */
export type CodingStyle = 'balanced' | 'architect' | 'builder' | 'debugger' | 'refactorer';

export interface CreatureState {
  project_id: string;
  project_name: string;
  remote_url: string | null;
  total_tokens_in: number;
  total_tokens_out: number;
  total_tokens: number;
  total_cost_usd: number;
  total_sessions: number;
  total_tool_calls: number;
  total_lines_added: number;
  total_lines_removed: number;
  total_files_changed: number;
  sessions_success: number;
  sessions_failure: number;
  level: number;
  xp_progress: number;  // 0.0 - 1.0 progress to next level
  coding_style: CodingStyle;
  trait_dna: import('./analyzer/dna.js').TraitDNA | null;
  created_at: string;
  updated_at: string;
}

export interface SessionRecord {
  id: number;
  project_id: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  tool_calls: number;
  outcome: string;
  summary: string | null;
  lines_added: number;
  lines_removed: number;
  files_changed: number;
  created_at: string;
}

/**
 * XP thresholds — exponential curve.
 * High levels are genuinely hard to reach.
 *
 *  Lv 1:     10k tokens  (~1 solid session)
 *  Lv 3:     75k tokens  (~a week of light use)
 *  Lv 5:    350k tokens  (~committed user, ~2 weeks heavy)
 *  Lv 7:   1.5M tokens  (~major project, ~1-2 months)
 *  Lv 10:   12M tokens  (~6+ months of daily use)
 *  Lv 13:  100M tokens  (~serious long-term commitment)
 *  Lv 15:  500M tokens  (~mythical status)
 */
const LEVEL_THRESHOLDS = [
  0,            // Level 0 (egg — unfed)
  10_000,       // Level 1 — first real session
  30_000,       // Level 2 — a few sessions
  75_000,       // Level 3 — getting into it
  150_000,      // Level 4 — regular user
  350_000,      // Level 5 — committed
  750_000,      // Level 6 — serious project
  1_500_000,    // Level 7 — major project
  3_000_000,    // Level 8 — veteran
  6_000_000,    // Level 9 — elite
  12_000_000,   // Level 10 — legendary
  25_000_000,   // Level 11
  50_000_000,   // Level 12
  100_000_000,  // Level 13
  200_000_000,  // Level 14
  500_000_000,  // Level 15 — mythical
];

/** Calculate creature level from total tokens using threshold table */
export function calculateLevel(totalTokens: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalTokens >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
}

/** Calculate XP progress (0.0-1.0) toward the next level */
export function calculateXpProgress(totalTokens: number): number {
  const level = calculateLevel(totalTokens);
  if (level >= LEVEL_THRESHOLDS.length - 1) return 1.0; // Max level

  const currentThreshold = LEVEL_THRESHOLDS[level];
  const nextThreshold = LEVEL_THRESHOLDS[level + 1];
  const range = nextThreshold - currentThreshold;

  if (range === 0) return 1.0;
  return Math.min(1.0, (totalTokens - currentThreshold) / range);
}

/** Get the token threshold for a specific level */
export function getLevelThreshold(level: number): number {
  return LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)] ?? 0;
}

/** Get the max defined level */
export function getMaxLevel(): number {
  return LEVEL_THRESHOLDS.length - 1;
}

/**
 * Derive dominant coding style from accumulated metrics.
 */
export function deriveCodingStyle(creature: {
  total_lines_added: number;
  total_lines_removed: number;
  total_files_changed: number;
  sessions_success: number;
  sessions_failure: number;
  total_sessions: number;
}): CodingStyle {
  const { total_lines_added, total_lines_removed, total_files_changed, sessions_success, sessions_failure, total_sessions } = creature;

  // Not enough data to determine style
  if (total_sessions < 2 || (total_lines_added + total_lines_removed) === 0) {
    return 'balanced';
  }

  const churnRatio = total_lines_removed / (total_lines_added + 1); // How much deletion vs addition
  const failureRatio = sessions_failure / (total_sessions || 1);
  const netLines = total_lines_added - total_lines_removed;
  const avgFilesPerSession = total_files_changed / (total_sessions || 1);

  // Debugger: high failure rate (lots of trial and error)
  if (failureRatio > 0.3) return 'debugger';

  // Refactorer: high churn ratio (deleting almost as much as adding)
  if (churnRatio > 0.6 && total_lines_removed > 100) return 'refactorer';

  // Architect: touches many files, moderate changes (structural work)
  if (avgFilesPerSession > 8 && churnRatio > 0.3) return 'architect';

  // Builder: lots of net additions (feature work)
  if (netLines > 500 && churnRatio < 0.3) return 'builder';

  return 'balanced';
}

/** Helper: build CreatureState from DB row */
function rowToCreature(row: any): CreatureState {
  const totalTokens = row.total_tokens_in + row.total_tokens_out;
  const style = deriveCodingStyle({
    total_lines_added: row.total_lines_added ?? 0,
    total_lines_removed: row.total_lines_removed ?? 0,
    total_files_changed: row.total_files_changed ?? 0,
    sessions_success: row.sessions_success ?? 0,
    sessions_failure: row.sessions_failure ?? 0,
    total_sessions: row.total_sessions,
  });

  return {
    project_id: row.project_id,
    project_name: row.project_name,
    remote_url: row.remote_url,
    total_tokens_in: row.total_tokens_in,
    total_tokens_out: row.total_tokens_out,
    total_tokens: totalTokens,
    total_cost_usd: row.total_cost_usd,
    total_sessions: row.total_sessions,
    total_tool_calls: row.total_tool_calls,
    total_lines_added: row.total_lines_added ?? 0,
    total_lines_removed: row.total_lines_removed ?? 0,
    total_files_changed: row.total_files_changed ?? 0,
    sessions_success: row.sessions_success ?? 0,
    sessions_failure: row.sessions_failure ?? 0,
    level: calculateLevel(totalTokens),
    xp_progress: calculateXpProgress(totalTokens),
    coding_style: style,
    trait_dna: row.trait_dna ? JSON.parse(row.trait_dna) : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Insert or update a project record */
export function upsertProject(identity: ProjectIdentity, dbPath?: string): void {
  const db = getDb(dbPath);
  db.prepare(`
    INSERT INTO projects (id, name, remote_url, directory, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      remote_url = excluded.remote_url,
      directory = excluded.directory,
      updated_at = datetime('now')
  `).run(identity.id, identity.name, identity.remote, identity.directory);
}

/** Record a session and update creature totals atomically. Returns previous and new level for level-up detection. */
export function recordSession(projectId: string, session: SessionData, dbPath?: string): { creature: CreatureState; previousLevel: number; leveledUp: boolean } {
  const db = getDb(dbPath);

  const result = db.transaction(() => {
    // Get previous level
    const prev = db.prepare(`
      SELECT total_tokens_in + total_tokens_out as total_tokens FROM creatures WHERE project_id = ?
    `).get(projectId) as { total_tokens: number } | undefined;
    const previousLevel = calculateLevel(prev?.total_tokens ?? 0);

    const linesAdded = session.lines_added ?? 0;
    const linesRemoved = session.lines_removed ?? 0;
    const filesChanged = session.files_changed ?? 0;
    const isSuccess = session.outcome === 'success' ? 1 : 0;
    const isFailure = session.outcome === 'failure' ? 1 : 0;

    // Insert session
    db.prepare(`
      INSERT INTO sessions (project_id, tokens_in, tokens_out, cost_usd, tool_calls, outcome, summary, lines_added, lines_removed, files_changed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      projectId,
      session.tokens_in,
      session.tokens_out,
      session.cost_usd,
      session.tool_calls,
      session.outcome,
      session.summary,
      linesAdded,
      linesRemoved,
      filesChanged,
    );

    // Upsert creature totals
    db.prepare(`
      INSERT INTO creatures (project_id, total_tokens_in, total_tokens_out, total_cost_usd, total_sessions, total_tool_calls,
        total_lines_added, total_lines_removed, total_files_changed, sessions_success, sessions_failure, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(project_id) DO UPDATE SET
        total_tokens_in = total_tokens_in + excluded.total_tokens_in,
        total_tokens_out = total_tokens_out + excluded.total_tokens_out,
        total_cost_usd = total_cost_usd + excluded.total_cost_usd,
        total_sessions = total_sessions + 1,
        total_tool_calls = total_tool_calls + excluded.total_tool_calls,
        total_lines_added = total_lines_added + excluded.total_lines_added,
        total_lines_removed = total_lines_removed + excluded.total_lines_removed,
        total_files_changed = total_files_changed + excluded.total_files_changed,
        sessions_success = sessions_success + excluded.sessions_success,
        sessions_failure = sessions_failure + excluded.sessions_failure,
        updated_at = datetime('now')
    `).run(
      projectId,
      session.tokens_in,
      session.tokens_out,
      session.cost_usd,
      session.tool_calls,
      linesAdded,
      linesRemoved,
      filesChanged,
      isSuccess,
      isFailure,
    );

    // Return updated creature state
    const row = db.prepare(`
      SELECT c.*, p.name as project_name, p.remote_url
      FROM creatures c
      JOIN projects p ON p.id = c.project_id
      WHERE c.project_id = ?
    `).get(projectId) as any;

    return { row, previousLevel };
  })();

  const creature = rowToCreature(result.row);
  return {
    creature,
    previousLevel: result.previousLevel,
    leveledUp: creature.level > result.previousLevel,
  };
}

/** Get creature state for a project, or null if never fed */
export function getCreature(projectId: string, dbPath?: string): CreatureState | null {
  const db = getDb(dbPath);
  const row = db.prepare(`
    SELECT c.*, p.name as project_name, p.remote_url
    FROM creatures c
    JOIN projects p ON p.id = c.project_id
    WHERE c.project_id = ?
  `).get(projectId) as any;

  if (!row) return null;
  return rowToCreature(row);
}

/** Get all creatures for the user */
export function getAllCreatures(dbPath?: string): CreatureState[] {
  const db = getDb(dbPath);
  const rows = db.prepare(`
    SELECT c.*, p.name as project_name, p.remote_url
    FROM creatures c
    JOIN projects p ON p.id = c.project_id
    ORDER BY c.updated_at DESC
  `).all() as any[];

  return rows.map(rowToCreature);
}

/** Get recent sessions for a project */
export function getSessionHistory(projectId: string, limit: number = 20, dbPath?: string): SessionRecord[] {
  const db = getDb(dbPath);
  return db.prepare(`
    SELECT * FROM sessions
    WHERE project_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT ?
  `).all(projectId, limit) as SessionRecord[];
}

/** Save or update trait DNA for a creature */
export function saveTraitDNA(projectId: string, dna: import('./analyzer/dna.js').TraitDNA, dbPath?: string): void {
  const db = getDb(dbPath);
  db.prepare(`
    UPDATE creatures SET trait_dna = ? WHERE project_id = ?
  `).run(JSON.stringify(dna), projectId);
}

export { closeDb, resetDbSingleton, LEVEL_THRESHOLDS };
