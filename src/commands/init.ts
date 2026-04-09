import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';

/** Resolve the path to the MCP server entry point (dist/index.js) */
function getMcpServerPath(): string {
  // __dirname equivalent for ESM
  const thisFile = fileURLToPath(import.meta.url);
  const distDir = dirname(thisFile);
  // If running from dist/commands/init.js, go up to dist/index.js
  // If running from src/commands/init.ts via tsx, resolve to dist/index.js relative to project root
  const candidate = join(distDir, '..', 'index.js');
  if (existsSync(candidate)) return candidate;

  // Fallback: resolve from package root
  const packageRoot = join(distDir, '..', '..');
  return join(packageRoot, 'dist', 'index.js');
}

/** Check if a command exists on PATH */
function commandExists(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/** Check if aimonsters MCP is already registered */
function isAlreadyRegistered(): boolean {
  try {
    const output = execSync('claude mcp list', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return output.includes('aimonsters');
  } catch {
    return false;
  }
}

export function runInit(): void {
  console.log(`\n  ${BOLD}${CYAN}🐉 AI Monsters — Setup${RESET}\n`);

  // Step 1: Check Claude Code CLI
  console.log(`  ${DIM}Checking Claude Code CLI...${RESET}`);
  if (!commandExists('claude')) {
    console.log(`  ${RED}✗${RESET} Claude Code CLI not found.\n`);
    console.log(`  ${DIM}Install it from: ${CYAN}https://docs.anthropic.com/en/docs/claude-code${RESET}`);
    console.log(`  ${DIM}Then run ${BOLD}aimonsters init${RESET}${DIM} again.${RESET}\n`);
    process.exit(1);
  }
  console.log(`  ${GREEN}✓${RESET} Claude Code CLI found`);

  // Step 2: Check if already registered
  console.log(`  ${DIM}Checking MCP registration...${RESET}`);
  if (isAlreadyRegistered()) {
    console.log(`  ${GREEN}✓${RESET} AI Monsters MCP server already registered\n`);
    console.log(`  ${DIM}You're all set! Start coding with Claude and your monster will grow.${RESET}`);
    console.log(`  ${DIM}Run ${BOLD}aimonsters${RESET}${DIM} to see your creature.${RESET}\n`);
    return;
  }

  // Step 3: Create data directory
  const dataDir = join(homedir(), '.aimonsters');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
    console.log(`  ${GREEN}✓${RESET} Created ${DIM}~/.aimonsters/${RESET}`);
  } else {
    console.log(`  ${GREEN}✓${RESET} Data directory exists`);
  }

  // Step 4: Register MCP server
  const mcpPath = getMcpServerPath();
  if (!existsSync(mcpPath)) {
    console.log(`  ${RED}✗${RESET} MCP server not found at ${mcpPath}`);
    console.log(`  ${DIM}Try running ${BOLD}npm run build${RESET}${DIM} first.${RESET}\n`);
    process.exit(1);
  }

  console.log(`  ${DIM}Registering MCP server with Claude Code...${RESET}`);
  try {
    execSync(`claude mcp add -s user aimonsters -- node ${mcpPath}`, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(`  ${GREEN}✓${RESET} MCP server registered (user scope)`);
  } catch (err: any) {
    const stderr = err.stderr?.toString() || '';
    if (stderr.includes('already exists')) {
      console.log(`  ${GREEN}✓${RESET} MCP server already registered`);
    } else {
      console.log(`  ${RED}✗${RESET} Failed to register MCP server`);
      console.log(`  ${DIM}${stderr.trim()}${RESET}`);
      console.log(`\n  ${DIM}Try manually: ${BOLD}claude mcp add -s user aimonsters -- node ${mcpPath}${RESET}\n`);
      process.exit(1);
    }
  }

  // Step 5: Install Stop hook for auto-tracking
  console.log(`  ${DIM}Installing session tracking hook...${RESET}`);
  const hooksDir = join(dirname(getMcpServerPath()), '..', 'hooks');
  const hookSource = join(hooksDir, 'stop-feed.js');
  const userHooksDir = join(homedir(), '.claude', 'hooks');

  if (existsSync(hookSource)) {
    try {
      mkdirSync(userHooksDir, { recursive: true });

      // Copy hook file
      const destHook = join(userHooksDir, 'aimonsters-stop-feed.js');
      copyFileSync(hookSource, destHook);
      chmodSync(destHook, 0o755);

      // Read existing settings or create new
      const settingsPath = join(homedir(), '.claude', 'settings.json');
      let settings: any = {};
      if (existsSync(settingsPath)) {
        try { settings = JSON.parse(readFileSync(settingsPath, 'utf-8')); } catch {}
      }

      // Add hook to settings
      if (!settings.hooks) settings.hooks = {};
      if (!settings.hooks.Stop) settings.hooks.Stop = [];

      // Check if already installed
      const alreadyInstalled = settings.hooks.Stop.some((h: any) =>
        JSON.stringify(h).includes('aimonsters')
      );

      if (!alreadyInstalled) {
        settings.hooks.Stop.push({
          hooks: [{
            type: 'command',
            command: `node ${destHook}`,
            timeout: 5,
          }],
        });
        writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      }

      console.log(`  ${GREEN}✓${RESET} Auto-tracking hook installed`);
    } catch (err: any) {
      console.log(`  ${YELLOW}⚠${RESET} Could not install hook: ${err.message}`);
      console.log(`  ${DIM}Sessions can still be tracked via MCP feed_session tool${RESET}`);
    }
  } else {
    console.log(`  ${DIM}Hook not found — skipping auto-tracking${RESET}`);
  }

  // Step 6: Verify
  console.log(`  ${DIM}Verifying connection...${RESET}`);
  try {
    const listOutput = execSync('claude mcp list', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    if (listOutput.includes('aimonsters')) {
      console.log(`  ${GREEN}✓${RESET} Connection verified`);
    }
  } catch {
    console.log(`  ${YELLOW}⚠${RESET} Could not verify — this is usually fine, it'll connect on next Claude session`);
  }

  // Done!
  console.log(`
  ${GREEN}${BOLD}🎉 Setup complete!${RESET}

  ${BOLD}What happens now:${RESET}
  ${DIM}1.${RESET} Open a new Claude Code session: ${BOLD}claude${RESET}
  ${DIM}2.${RESET} Code as normal — your monster feeds automatically
  ${DIM}3.${RESET} Check your creature: ${BOLD}aimonsters${RESET}
  ${DIM}4.${RESET} See all creatures: ${BOLD}aimonsters show --all${RESET}
  ${DIM}5.${RESET} View stats: ${BOLD}aimonsters stats${RESET}

  ${DIM}Your monster data lives at ~/.aimonsters/monsters.db${RESET}
`);
}
