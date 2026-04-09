import Database from 'better-sqlite3';
import { existsSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const TOKENPETS_DIR = join(homedir(), '.tokenpets');
const LEGACY_DIR = join(homedir(), '.aimonsters');
const DB_PATH = join(TOKENPETS_DIR, 'monsters.db');

let db: Database.Database | null = null;

/**
 * Get or create the singleton database connection.
 * Auto-creates ~/.tokenpets/ and runs migrations.
 * Migrates from ~/.aimonsters/ if it exists.
 */
export function getDb(dbPath?: string): Database.Database {
  if (db) return db;

  const path = dbPath ?? DB_PATH;
  const dir = join(path, '..');

  // Migrate from legacy ~/.aimonsters/ directory if needed
  if (path === DB_PATH && !existsSync(TOKENPETS_DIR) && existsSync(LEGACY_DIR)) {
    renameSync(LEGACY_DIR, TOKENPETS_DIR);
  }

  // Ensure directory exists
  mkdirSync(dir, { recursive: true });

  db = new Database(path);

  // Enable WAL mode for concurrent read safety
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  runMigrations(db);

  return db;
}

/**
 * Close the database connection. Used in tests and cleanup.
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Reset the singleton (for tests that use custom paths).
 */
export function resetDbSingleton(): void {
  db = null;
}

/**
 * Run schema migrations based on user_version pragma.
 */
function runMigrations(db: Database.Database): void {
  const version = db.pragma('user_version', { simple: true }) as number;

  if (version < 1) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        remote_url TEXT,
        directory TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL REFERENCES projects(id),
        tokens_in INTEGER NOT NULL DEFAULT 0,
        tokens_out INTEGER NOT NULL DEFAULT 0,
        cost_usd REAL NOT NULL DEFAULT 0,
        tool_calls INTEGER NOT NULL DEFAULT 0,
        outcome TEXT NOT NULL DEFAULT 'success',
        summary TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);

      CREATE TABLE IF NOT EXISTS creatures (
        project_id TEXT PRIMARY KEY REFERENCES projects(id),
        total_tokens_in INTEGER NOT NULL DEFAULT 0,
        total_tokens_out INTEGER NOT NULL DEFAULT 0,
        total_cost_usd REAL NOT NULL DEFAULT 0,
        total_sessions INTEGER NOT NULL DEFAULT 0,
        total_tool_calls INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.pragma('user_version = 1');
  }

  // Future migrations go here:
  // if (version < 2) { ... db.pragma('user_version = 2'); }

  if (version < 2) {
    db.exec(`
      -- Add git diff stats to sessions
      ALTER TABLE sessions ADD COLUMN lines_added INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE sessions ADD COLUMN lines_removed INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE sessions ADD COLUMN files_changed INTEGER NOT NULL DEFAULT 0;

      -- Add coding style metrics to creatures
      ALTER TABLE creatures ADD COLUMN total_lines_added INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE creatures ADD COLUMN total_lines_removed INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE creatures ADD COLUMN total_files_changed INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE creatures ADD COLUMN sessions_success INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE creatures ADD COLUMN sessions_failure INTEGER NOT NULL DEFAULT 0;
    `);
    db.pragma('user_version = 2');
  }

  if (version < 3) {
    db.exec(`
      -- Add Trait DNA to creatures
      ALTER TABLE creatures ADD COLUMN trait_dna TEXT;
    `);
    db.pragma('user_version = 3');
  }
}

export { DB_PATH, TOKENPETS_DIR };
