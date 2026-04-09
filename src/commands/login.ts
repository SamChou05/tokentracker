import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { execSync } from 'node:child_process';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';

const AIMONSTERS_DIR = join(homedir(), '.aimonsters');
const TOKEN_PATH = join(AIMONSTERS_DIR, 'sync-token');
const CONFIG_PATH = join(AIMONSTERS_DIR, 'config.json');

// Default to the Convex site URL — can be overridden in config
const DEFAULT_SYNC_URL = 'https://festive-corgi-668.convex.site';

export interface SyncConfig {
  syncUrl: string;
  syncToken: string;
}

/** Read sync config if it exists */
export function getSyncConfig(): SyncConfig | null {
  try {
    if (!existsSync(TOKEN_PATH)) return null;
    const token = readFileSync(TOKEN_PATH, 'utf-8').trim();
    if (!token) return null;

    let syncUrl = DEFAULT_SYNC_URL;
    if (existsSync(CONFIG_PATH)) {
      const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
      if (config.syncUrl) syncUrl = config.syncUrl;
    }

    return { syncUrl, syncToken: token };
  } catch {
    return null;
  }
}

/** Save sync token to disk */
function saveSyncToken(token: string): void {
  mkdirSync(AIMONSTERS_DIR, { recursive: true });
  writeFileSync(TOKEN_PATH, token, { mode: 0o600 }); // Owner-only read/write
}

/** Save config to disk */
function saveConfig(config: Record<string, string>): void {
  mkdirSync(AIMONSTERS_DIR, { recursive: true });

  let existing: Record<string, string> = {};
  if (existsSync(CONFIG_PATH)) {
    try {
      existing = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    } catch { /* ignore */ }
  }

  writeFileSync(CONFIG_PATH, JSON.stringify({ ...existing, ...config }, null, 2));
}

export async function runLogin(): Promise<void> {
  console.log(`\n  ${BOLD}${CYAN}🐉 AI Monsters — Login${RESET}\n`);

  // Check existing token
  const existing = getSyncConfig();
  if (existing) {
    console.log(`  ${GREEN}✓${RESET} Already logged in (token: ${existing.syncToken.slice(0, 8)}...)`);
    console.log(`  ${DIM}To re-login, run with --force${RESET}\n`);

    if (!process.argv.includes('--force')) {
      return;
    }
    console.log(`  ${DIM}Re-generating token...${RESET}\n`);
  }

  // Open browser to token page
  const tokenUrl = `${DEFAULT_SYNC_URL.replace('.convex.site', '')}`; // This won't work cleanly
  const webUrl = 'http://localhost:3000/cli-token'; // Dev URL — will be aimonsters.dev in prod

  console.log(`  ${DIM}Step 1:${RESET} Sign in on the web and get your sync token.\n`);
  console.log(`  Opening: ${CYAN}${webUrl}${RESET}\n`);

  try {
    execSync(`open "${webUrl}"`, { stdio: 'pipe' });
  } catch {
    console.log(`  ${DIM}Could not open browser automatically.${RESET}`);
    console.log(`  ${DIM}Please visit the URL above manually.${RESET}\n`);
  }

  // Prompt for token
  const rl = createInterface({ input: stdin, output: stdout });
  const token = await rl.question(`  ${DIM}Step 2:${RESET} Paste your sync token: `);
  rl.close();

  const trimmed = token.trim();
  if (!trimmed) {
    console.log(`\n  ${RED}✗${RESET} No token provided. Login cancelled.\n`);
    process.exit(1);
  }

  if (!trimmed.startsWith('ams_')) {
    console.log(`\n  ${RED}✗${RESET} Invalid token format. Tokens start with 'ams_'.\n`);
    process.exit(1);
  }

  // Validate token against Convex
  console.log(`\n  ${DIM}Validating token...${RESET}`);
  try {
    const resp = await fetch(`${DEFAULT_SYNC_URL}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: trimmed,
        creature: {
          projectId: '__validation__',
          name: 'validation',
          level: 0,
          totalTokensIn: 0,
          totalTokensOut: 0,
          totalTokens: 0,
          totalCostUsd: 0,
          totalSessions: 0,
          totalToolCalls: 0,
          totalLinesAdded: 0,
          totalLinesRemoved: 0,
          totalFilesChanged: 0,
          sessionsSuccess: 0,
          sessionsFailure: 0,
          codingStyle: 'balanced',
          xpProgress: 0,
          localCreatedAt: '',
          localUpdatedAt: '',
        },
      }),
    });

    if (resp.status === 401) {
      console.log(`  ${RED}✗${RESET} Invalid token. Please check and try again.\n`);
      process.exit(1);
    }

    if (!resp.ok) {
      console.log(`  ${RED}✗${RESET} Server error (${resp.status}). Try again later.\n`);
      process.exit(1);
    }
  } catch (err: any) {
    console.log(`  ${RED}✗${RESET} Could not reach server: ${err.message}\n`);
    process.exit(1);
  }

  // Save token
  saveSyncToken(trimmed);
  saveConfig({ syncUrl: DEFAULT_SYNC_URL });

  console.log(`  ${GREEN}✓${RESET} Token validated and saved`);
  console.log(`\n  ${GREEN}${BOLD}🎉 Logged in!${RESET}`);
  console.log(`  ${DIM}Your creatures will now auto-sync to your web profile.${RESET}\n`);
}
