#!/usr/bin/env node
/**
 * TokenPets — Claude Code Stop Hook
 *
 * Fires when Claude finishes a response. Reads precise token usage
 * from Claude's conversation JSONL logs and feeds the creature.
 *
 * Hook type: Stop
 * Input (stdin): JSON with session_id, context_window, model, workspace
 *
 * Token source: ~/.claude/projects/<slug>/<session_id>.jsonl
 * Each assistant message has exact usage data (input_tokens, output_tokens,
 * cache_creation_input_tokens, cache_read_input_tokens).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const TOKENPETS_DIR = path.join(os.homedir(), '.tokenpets');
const SESSION_FILE_DIR = path.join(TOKENPETS_DIR, 'sessions');
const CLAUDE_DIR = path.join(os.homedir(), '.claude');

// Find the tokenpets dist directory — try global install first, then local
function findDistDir() {
  const relDist = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(path.join(relDist, 'store.js'))) return relDist;

  try {
    const globalRoot = require('child_process')
      .execSync('npm root -g', { encoding: 'utf-8' }).trim();
    const globalDist = path.join(globalRoot, 'tokenpets', 'dist');
    if (fs.existsSync(path.join(globalDist, 'store.js'))) return globalDist;
  } catch {}

  try {
    const resolved = require.resolve('tokenpets/dist/store.js');
    return path.dirname(resolved);
  } catch {}

  return null;
}

const DIST_DIR = findDistDir();

/**
 * Derive the Claude project slug from a working directory path.
 * Claude uses the pattern: path separators become dashes, e.g.
 * /Users/samchou/tokenpets -> -Users-samchou-tokenpets
 */
function getProjectSlug(cwd) {
  return cwd.replace(/\//g, '-');
}

/**
 * Find the JSONL conversation log for this session.
 * Path: ~/.claude/projects/<slug>/<session_id>.jsonl
 */
function findConversationLog(sessionId, cwd) {
  const slug = getProjectSlug(cwd);
  const jsonlPath = path.join(CLAUDE_DIR, 'projects', slug, `${sessionId}.jsonl`);
  if (fs.existsSync(jsonlPath)) return jsonlPath;

  // Fallback: scan all project dirs for this session
  const projectsDir = path.join(CLAUDE_DIR, 'projects');
  if (!fs.existsSync(projectsDir)) return null;

  try {
    const dirs = fs.readdirSync(projectsDir);
    for (const dir of dirs) {
      const candidate = path.join(projectsDir, dir, `${sessionId}.jsonl`);
      if (fs.existsSync(candidate)) return candidate;
    }
  } catch {}

  return null;
}

/**
 * Parse the JSONL log and sum up precise token usage from all assistant messages.
 * Splits into: uncached input, cache write, cache read, and output.
 *
 * For XP/leveling: all tokens count (you used the AI).
 * For cost: each category has a different rate.
 */
function parseTokenUsage(jsonlPath) {
  const content = fs.readFileSync(jsonlPath, 'utf-8');
  const lines = content.trim().split('\n');

  let input_uncached = 0;
  let input_cache_write = 0;
  let input_cache_read = 0;
  let output = 0;
  let totalMessages = 0;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const usage = entry?.message?.usage;
      if (!usage) continue;

      input_uncached += (usage.input_tokens || 0);
      input_cache_write += (usage.cache_creation_input_tokens || 0);
      input_cache_read += (usage.cache_read_input_tokens || 0);
      output += (usage.output_tokens || 0);
      totalMessages++;
    } catch {}
  }

  // tokens_in = fresh input only (uncached + cache write), excludes cache reads
  // This drives XP/leveling — represents actual new AI usage, not replayed context
  const tokens_in = input_uncached + input_cache_write;
  const tokens_out = output;
  const total_all = input_uncached + input_cache_write + input_cache_read + output;

  return {
    tokens_in,
    tokens_out,
    total_all,
    input_uncached,
    input_cache_write,
    input_cache_read,
    output,
    totalMessages,
  };
}

/**
 * Calculate estimated API cost based on token breakdown and model.
 * Rates per million tokens (as of 2025):
 *   Opus:   input $15, cache_write $18.75, cache_read $1.50, output $75
 *   Sonnet: input $3,  cache_write $3.75,  cache_read $0.30, output $15
 */
function calculateCost(usage, model) {
  const isOpus = model?.toLowerCase().includes('opus');

  const rates = isOpus
    ? { input: 15, cache_write: 18.75, cache_read: 1.50, output: 75 }
    : { input: 3, cache_write: 3.75, cache_read: 0.30, output: 15 };

  return (
    (usage.input_uncached / 1_000_000) * rates.input +
    (usage.input_cache_write / 1_000_000) * rates.cache_write +
    (usage.input_cache_read / 1_000_000) * rates.cache_read +
    (usage.output / 1_000_000) * rates.output
  );
}

// Read JSON from stdin
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    handleStop(data);
  } catch (err) {
    process.exit(0);
  }
});

function handleStop(data) {
  const sessionId = data.session_id;
  if (!sessionId) return process.exit(0);

  const cwd = data.workspace?.current_dir || process.cwd();
  const model = data.model?.display_name || 'unknown';

  // Ensure session tracking dir exists
  if (!fs.existsSync(SESSION_FILE_DIR)) {
    fs.mkdirSync(SESSION_FILE_DIR, { recursive: true });
  }

  // Load or create session accumulator
  const sessionFile = path.join(SESSION_FILE_DIR, `${sessionId}.json`);
  let session;
  try {
    session = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
  } catch {
    session = {
      sessionId,
      cwd,
      model,
      startedAt: Date.now(),
      responseCount: 0,
      lastFedTokensIn: 0,
      lastFedTokensOut: 0,
    };
  }

  session.responseCount++;
  session.lastActivity = Date.now();

  // Save session state
  fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));

  // Feed the creature every 3 responses (not on every single stop)
  if (session.responseCount % 3 === 0 || session.responseCount === 1) {
    feedCreature(session, cwd);
  }

  // Output empty JSON (no modifications to Claude's behavior)
  console.log(JSON.stringify({}));
  process.exit(0);
}

function feedCreature(session, cwd) {
  if (!DIST_DIR) return;

  // Read precise token usage from JSONL
  const jsonlPath = findConversationLog(session.sessionId, cwd);
  if (!jsonlPath) return;

  let usage;
  try {
    usage = parseTokenUsage(jsonlPath);
  } catch {
    return;
  }

  // Calculate delta since last feed (only send new tokens)
  // Use total_all for XP (includes cache reads — you still used the AI)
  const deltaIn = usage.tokens_in - (session.lastFedTokensIn || 0);
  const deltaOut = usage.tokens_out - (session.lastFedTokensOut || 0);
  const deltaTotalAll = usage.total_all - (session.lastFedTotalAll || 0);

  // Nothing new to feed
  if (deltaTotalAll <= 0) return;

  // Calculate cost for just the delta
  const deltaUsage = {
    input_uncached: usage.input_uncached - (session.lastFedUncached || 0),
    input_cache_write: usage.input_cache_write - (session.lastFedCacheWrite || 0),
    input_cache_read: usage.input_cache_read - (session.lastFedCacheRead || 0),
    output: usage.output - (session.lastFedOutput || 0),
  };

  // Update session with what we've fed so far
  session.lastFedTokensIn = usage.tokens_in;
  session.lastFedTokensOut = usage.tokens_out;
  session.lastFedTotalAll = usage.total_all;
  session.lastFedUncached = usage.input_uncached;
  session.lastFedCacheWrite = usage.input_cache_write;
  session.lastFedCacheRead = usage.input_cache_read;
  session.lastFedOutput = usage.output;
  const sessionFile = path.join(SESSION_FILE_DIR, `${session.sessionId}.json`);
  fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));

  try {
    const { getProjectIdentity } = require(DIST_DIR + '/project.js');
    const { upsertProject, recordSession, saveTraitDNA } = require(DIST_DIR + '/store.js');
    const { analyzeProject } = require(DIST_DIR + '/analyzer/index.js');

    const project = getProjectIdentity(cwd);
    upsertProject(project);

    const costEstimate = calculateCost(deltaUsage, session.model);

    const { creature } = recordSession(project.id, {
      tokens_in: deltaIn,
      tokens_out: deltaOut,
      cost_usd: costEstimate,
      tool_calls: session.responseCount,
      outcome: 'success',
      summary: 'Auto-tracked via Claude Code hook (precise)',
    });

    // Analyze DNA on first feed
    if (!creature.trait_dna) {
      try {
        const dna = analyzeProject(cwd);
        saveTraitDNA(project.id, dna);
        creature.trait_dna = dna;
      } catch(e) {}
    }

    // Sync to web (fire-and-forget, non-blocking)
    try {
      const { syncInBackground } = require(DIST_DIR + '/sync.js');
      syncInBackground(creature);
    } catch(e) {}
  } catch {}
}
