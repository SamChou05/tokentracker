#!/usr/bin/env node

import { getProjectIdentity } from './project.js';
import { getCreature, getAllCreatures, getLevelThreshold, getMaxLevel } from './store.js';
import { getSessionHistory } from './store.js';
import { deriveTraits, eggTraits } from './creature/traits.js';
import { renderCreature, renderCreatureCompact } from './creature/render.js';
import { calculateRarity, RARITY_LABELS } from './creature/rarity.js';
import { getDb } from './db.js';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const WHITE = '\x1b[37m';

/** Format a UTC datetime string as relative time (e.g., "3 hours ago") */
function formatTimeSince(dateStr: string): string {
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'Z');
  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 0) return 'just now';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  return `${Math.floor(months / 12)}y ago`;
}

function showCreature(projectId?: string): void {
  // Ensure DB is initialized
  try {
    getDb();
  } catch (err: any) {
    console.error(`\n  ${RED}Error:${RESET} Could not open database: ${err.message}`);
    console.error(`  ${DIM}Run ${BOLD}tokenpets init${RESET}${DIM} to set up.${RESET}\n`);
    process.exit(1);
  }

  let creature;
  let projectName: string;

  if (projectId) {
    creature = getCreature(projectId);
    projectName = projectId.split('/').pop() || projectId;
  } else {
    const project = getProjectIdentity();
    projectName = project.name;
    creature = getCreature(project.id);
  }

  if (!creature) {
    const traits = eggTraits(projectName);
    console.log(renderCreature(traits));
    console.log(`  ${DIM}Feed your pet by coding with Claude!${RESET}`);
    console.log(`  ${DIM}Run ${BOLD}tokenpets init${RESET}${DIM} if you haven't set up yet.${RESET}\n`);
    return;
  }

  const traits = deriveTraits(creature);
  console.log(renderCreature(traits));

  // Show quick stats
  const STAGE_LABELS: Record<string, string> = {
    egg: '🥚 Egg', blob: '🟢 Blob', sprite: '✨ Sprite',
    serpent: '🐍 Serpent', dragon: '🐉 Dragon', phoenix: '🔥 Phoenix',
  };
  const STYLE_LABELS: Record<string, string> = {
    balanced: '⚖️  Balanced', builder: '🏗️  Builder', debugger: '🔍 Debugger',
    refactorer: '♻️  Refactorer', architect: '📐 Architect',
  };

  const progressPct = Math.round(creature.xp_progress * 100);
  const nextThreshold = getLevelThreshold(creature.level + 1);
  const timeSinceFed = formatTimeSince(creature.updated_at);

  console.log(`  ${DIM}Stage:${RESET}   ${STAGE_LABELS[traits.body] || traits.body}`);
  if (creature.trait_dna) {
    const ELEMENT_ICONS: Record<string, string> = {
      electric: '⚡', nature: '🌿', metal: '⚙️', wind: '💨', fire: '🔥',
      crystal: '💎', earth: '🪨', void: '🌑', arcane: '✨', water: '🌊',
    };
    const ARCHETYPE_ICONS: Record<string, string> = {
      athletic: '💪', winged: '🪽', playful: '🎮', sentinel: '🛡️', cerebral: '🧠',
      crystalline: '💠', harmonic: '🎵', organic: '🧬', phantom: '👻', primal: '⚔️',
      radiant: '🌟', adaptive: '🔮',
    };
    const dna = creature.trait_dna;
    console.log(`  ${DIM}Element:${RESET} ${ELEMENT_ICONS[dna.element] || ''} ${dna.element} (${dna.primaryLanguage})`);
    console.log(`  ${DIM}Type:${RESET}    ${ARCHETYPE_ICONS[dna.archetype] || ''} ${dna.archetype}`);
    if (dna.frameworks.length > 0) {
      console.log(`  ${DIM}Frames:${RESET}  ${dna.frameworks.join(', ')}`);
    }
    console.log(`  ${DIM}DNA:${RESET}     ${DIM}#${dna.dnaHash}${RESET}`);
  }
  const rarity = calculateRarity(creature.trait_dna, creature);
  console.log(`  ${DIM}Rarity:${RESET}  ${RARITY_LABELS[rarity.tier]}${rarity.reasons.length > 0 ? ` ${DIM}(${rarity.reasons[0]})${RESET}` : ''}`);
  console.log(`  ${DIM}Tokens:${RESET}  ${creature.total_tokens.toLocaleString()} (${creature.total_tokens_in.toLocaleString()} in / ${creature.total_tokens_out.toLocaleString()} out)`);
  if (creature.level < getMaxLevel()) {
    console.log(`  ${DIM}Next Lv:${RESET} ${progressPct}% → Lv.${creature.level + 1} at ${nextThreshold.toLocaleString()} tokens`);
  } else {
    console.log(`  ${DIM}Status:${RESET}  ${BOLD}⭐ MYTHICAL${RESET}`);
  }
  console.log(`  ${DIM}Style:${RESET}   ${STYLE_LABELS[creature.coding_style] || creature.coding_style}`);
  console.log(`  ${DIM}Cost:${RESET}    $${creature.total_cost_usd.toFixed(2)}`);
  console.log(`  ${DIM}Sessions:${RESET} ${creature.total_sessions}`);
  if (creature.total_lines_added + creature.total_lines_removed > 0) {
    console.log(`  ${DIM}Code:${RESET}    +${creature.total_lines_added.toLocaleString()} / -${creature.total_lines_removed.toLocaleString()} lines`);
  }
  console.log(`  ${DIM}Last fed:${RESET} ${timeSinceFed}`);
  console.log('');
}

function showAll(): void {
  getDb();
  const creatures = getAllCreatures();

  if (creatures.length === 0) {
    console.log(`\n  ${DIM}No pets yet. Start coding with Claude to hatch your first!${RESET}\n`);
    return;
  }

  console.log(`\n  ${BOLD}${CYAN}🐉 Your Pets${RESET}\n`);

  for (const creature of creatures) {
    const traits = deriveTraits(creature);
    console.log(renderCreatureCompact(traits));
  }

  console.log(`\n  ${DIM}${creatures.length} creature${creatures.length !== 1 ? 's' : ''} total${RESET}\n`);
}

function showStats(): void {
  getDb();
  const project = getProjectIdentity();
  const creature = getCreature(project.id);

  console.log(`\n  ${BOLD}${CYAN}📊 ${project.name}${RESET} ${DIM}(${project.id})${RESET}\n`);

  if (!creature) {
    console.log(`  ${DIM}No sessions recorded yet.${RESET}\n`);
    return;
  }

  // Summary stats
  console.log(`  ${DIM}Level:${RESET}      ${creature.level}`);
  console.log(`  ${DIM}Tokens:${RESET}     ${creature.total_tokens.toLocaleString()}`);
  console.log(`  ${DIM}  In:${RESET}       ${creature.total_tokens_in.toLocaleString()}`);
  console.log(`  ${DIM}  Out:${RESET}      ${creature.total_tokens_out.toLocaleString()}`);
  console.log(`  ${DIM}Cost:${RESET}       $${creature.total_cost_usd.toFixed(2)}`);
  console.log(`  ${DIM}Sessions:${RESET}   ${creature.total_sessions}`);
  console.log(`  ${DIM}Tool calls:${RESET} ${creature.total_tool_calls.toLocaleString()}`);
  console.log('');

  // Recent sessions
  const history = getSessionHistory(project.id, 10);
  if (history.length > 0) {
    console.log(`  ${BOLD}Recent Sessions${RESET}\n`);
    console.log(`  ${DIM}${'Date'.padEnd(20)} ${'Tokens'.padStart(10)} ${'Cost'.padStart(8)} Outcome${RESET}`);
    console.log(`  ${DIM}${'─'.repeat(55)}${RESET}`);

    for (const session of history) {
      const tokens = session.tokens_in + session.tokens_out;
      const date = session.created_at.replace('T', ' ').slice(0, 19);
      const outcomeIcon = session.outcome === 'success' ? '✅' : session.outcome === 'failure' ? '❌' : '⚠️';

      console.log(`  ${date.padEnd(20)} ${tokens.toLocaleString().padStart(10)} ${('$' + session.cost_usd.toFixed(2)).padStart(8)} ${outcomeIcon} ${session.outcome}`);
    }
    console.log('');
  }
}

function showHelp(): void {
  console.log(`
  ${BOLD}${CYAN}🐉 tokenpets${RESET} — Your AI coding companion

  ${BOLD}Usage:${RESET}
    tokenpets init         Set up TokenPets + register MCP server
    tokenpets login        Link your CLI to your web profile
    tokenpets              Show your pet for the current project
    tokenpets show         Same as above
    tokenpets show --all   Show all your pets
    tokenpets stats        Show session history and detailed stats
    tokenpets version      Show version
    tokenpets help         Show this help message

  ${BOLD}How it works:${RESET}
    1. Code with Claude as normal
    2. Your sessions are tracked via the MCP server
    3. Your pet evolves based on your coding activity
    4. Each project gets its own unique creature

  ${DIM}Data stored at ~/.tokenpets/monsters.db${RESET}
`);
}

// Parse args
const args = process.argv.slice(2);
const command = args[0] || 'show';

switch (command) {
  case 'init': {
    const { runInit } = await import('./commands/init.js');
    runInit();
    break;
  }
  case 'login': {
    const { runLogin } = await import('./commands/login.js');
    await runLogin();
    break;
  }
  case 'show':
    if (args.includes('--all') || args.includes('-a')) {
      showAll();
    } else {
      showCreature();
    }
    break;
  case 'stats':
    showStats();
    break;
  case 'version':
  case '--version':
  case '-v':
    console.log('tokenpets v0.1.0');
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    showCreature();
    break;
}
