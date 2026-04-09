#!/usr/bin/env node
/**
 * AI Monsters — Claude Code Stop Hook
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

const AIMONSTERS_DIR = path.join(os.homedir(), '.aimonsters');
const SESSION_FILE_DIR = path.join(AIMONSTERS_DIR, 'sessions');
const CLAUDE_DIR = path.join(os.homedir(), '.claude');

// Find the aimonsters dist directory — try global install first, then local
function findDistDir() {
  const relDist = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(path.join(relDist, 'store.js'))) return relDist;

  try {
    const globalRoot = require('child_process')
      .execSync('npm root -g', { encoding: 'utf-8' }).trim();
    const globalDist = path.join(globalRoot, 'aimonsters', 'dist');
    if (fs.existsSync(path.join(globalDist, 'store.js'))) return globalDist;
  } catch {}

  try {
    const resolved = require.resolve('aimonsters/dist/store.js');
    return path.dirname(resolved);
  } catch {}

  return null;
}

const DIST_DIR = findDistDir();

/**
 * Derive the Claude project slug from a working directory path.
 * Claude uses the pattern: path separators become dashes, e.g.
 * /Users/samchou/aimonsters -> -Users-samchou-aimonsters
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
 * Returns { tokens_in, tokens_out, total_messages }
 */
function parseTokenUsage(jsonlPath) {
  const content = fs.readFileSync(jsonlPath, 'utf-8');
  const lines = content.trim().split('\n');

  let tokens_in = 0;
  let tokens_out = 0;
  let totalMessages = 0;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const usage = entry?.message?.usage;
      if (!usage) continue;

      // input_tokens = direct input (non-cached)
      // cache_creation_input_tokens = tokens written to cache
      // cache_read_input_tokens = tokens read from cache
      // All represent actual input token processing
      tokens_in += (usage.input_tokens || 0)
                 + (usage.cache_creation_input_tokens || 0)
                 + (usage.cache_read_input_tokens || 0);
      tokens_out += (usage.output_tokens || 0);
      totalMessages++;
    } catch {}
  }

  return { tokens_in, tokens_out, totalMessages };
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
  const deltaIn = usage.tokens_in - (session.lastFedTokensIn || 0);
  const deltaOut = usage.tokens_out - (session.lastFedTokensOut || 0);

  // Nothing new to feed
  if (deltaIn <= 0 && deltaOut <= 0) return;

  // Update session with what we've fed so far
  session.lastFedTokensIn = usage.tokens_in;
  session.lastFedTokensOut = usage.tokens_out;
  const sessionFile = path.join(SESSION_FILE_DIR, `${session.sessionId}.json`);
  fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));

  try {
    const storePath = DIST_DIR + '/store.js';
    const projectPath = DIST_DIR + '/project.js';
    const analyzerPath = DIST_DIR + '/analyzer/index.js';
    const syncPath = DIST_DIR + '/sync.js';

    if (!fs.existsSync(storePath)) return;

    // Estimate cost based on model pricing (rough averages)
    // Opus: ~$15/M input, ~$75/M output; Sonnet: ~$3/M input, ~$15/M output
    const isOpus = session.model?.toLowerCase().includes('opus');
    const inputRate = isOpus ? 0.000015 : 0.000003;
    const outputRate = isOpus ? 0.000075 : 0.000015;
    const costEstimate = (deltaIn * inputRate) + (deltaOut * outputRate);

    const script = `
      const { getProjectIdentity } = require('${projectPath}');
      const { upsertProject, recordSession, getCreature, saveTraitDNA } = require('${storePath}');
      const { analyzeProject } = require('${analyzerPath}');

      try {
        const project = getProjectIdentity('${session.cwd.replace(/'/g, "\\'")}');
        upsertProject(project);

        const { creature } = recordSession(project.id, {
          tokens_in: ${deltaIn},
          tokens_out: ${deltaOut},
          cost_usd: ${costEstimate},
          tool_calls: ${session.responseCount},
          outcome: 'success',
          summary: 'Auto-tracked via Claude Code hook (precise)',
        });

        if (!creature.trait_dna) {
          try {
            const dna = analyzeProject('${session.cwd.replace(/'/g, "\\'")}');
            saveTraitDNA(project.id, dna);
            creature.trait_dna = dna;
          } catch(e) {}
        }

        try {
          const { syncInBackground } = require('${syncPath}');
          syncInBackground(creature);
        } catch(e) {}
      } catch(e) {}
    `;

    require('child_process').exec(
      `node -e ${JSON.stringify(script)}`,
      { timeout: 5000, env: { ...process.env, HOME: os.homedir() } }
    );
  } catch {}
}
