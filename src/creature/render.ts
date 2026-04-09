import type { TraitSet } from './traits.js';
import { RESET, BOLD } from './traits.js';
import { BODY_ART } from './parts.js';

/**
 * Render a creature to a colored terminal string.
 */
export function renderCreature(traits: TraitSet): string {
  const art = getBodyArt(traits);
  const colored = applyColors(art, traits);
  const framed = addFrame(colored, traits);
  return framed;
}

/** Get the appropriate body art template */
function getBodyArt(traits: TraitSet): string[] {
  const bodyArt = BODY_ART[traits.body];
  if (!bodyArt) return BODY_ART.egg.egg;

  return bodyArt[traits.size] ?? bodyArt.small ?? BODY_ART.egg.egg;
}

/** Replace color placeholders with ANSI codes */
function applyColors(lines: string[], traits: TraitSet): string[] {
  const { primary, secondary, eye, aura } = traits.colors;

  return lines.map((line) =>
    line
      .replace(/\{P\}/g, primary)
      .replace(/\{S\}/g, secondary)
      .replace(/\{E\}/g, eye)
      .replace(/\{A\}/g, aura)
      .replace(/\{R\}/g, RESET)
  );
}

/** Add a decorative frame with creature info */
function addFrame(lines: string[], traits: TraitSet): string {
  const DIM = '\x1b[2m';
  const CYAN = '\x1b[36m';
  const WHITE = '\x1b[37m';

  // Calculate display width (ignoring ANSI codes)
  const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');
  const maxWidth = Math.max(...lines.map((l) => stripAnsi(l).length));
  const frameWidth = Math.max(maxWidth + 4, 30);

  const pad = (s: string, width: number) => {
    const visible = stripAnsi(s).length;
    const padding = Math.max(0, width - visible);
    return s + ' '.repeat(padding);
  };

  const topBar = `${DIM}${'─'.repeat(frameWidth)}${RESET}`;
  const bottomBar = topBar;

  // Title line
  const levelStr = traits.level === 0
    ? `${DIM}unhatched${RESET}`
    : `${BOLD}${traits.colors.primary}Lv.${traits.level}${RESET}`;

  const title = `  ${CYAN}${BOLD}${traits.name}${RESET} ${levelStr}`;

  const output: string[] = [];
  output.push('');
  output.push(topBar);
  output.push(title);
  output.push('');

  // Center the creature art
  for (const line of lines) {
    const visibleLen = stripAnsi(line).length;
    const leftPad = Math.max(0, Math.floor((frameWidth - visibleLen) / 2));
    output.push(' '.repeat(leftPad) + line);
  }

  output.push('');

  // Stats bar
  if (traits.level > 0) {
    const bar = generateXpBar(traits.level, 20);
    output.push(`  ${DIM}Level${RESET} ${bar} ${DIM}${traits.level}${RESET}`);
  }

  output.push(bottomBar);
  output.push('');

  return output.join('\n');
}

/** Generate an XP progress bar */
function generateXpBar(level: number, width: number): string {
  // Fractional progress within current level (simulated)
  const progress = (level * 7 + 3) % 10 / 10; // Deterministic pseudo-progress
  const filled = Math.round(progress * width);
  const empty = width - filled;

  const FILL_COLOR = '\x1b[38;5;40m';
  const EMPTY_COLOR = '\x1b[38;5;237m';

  return `${FILL_COLOR}${'█'.repeat(filled)}${EMPTY_COLOR}${'░'.repeat(empty)}${RESET}`;
}

/**
 * Render a compact one-line creature status (for --all listing).
 */
export function renderCreatureCompact(traits: TraitSet): string {
  const DIM = '\x1b[2m';
  const CYAN = '\x1b[36m';

  if (traits.level === 0) {
    return `  🥚 ${CYAN}${traits.name}${RESET} ${DIM}— unhatched${RESET}`;
  }

  const icons: Record<string, string> = {
    blob: '🟢',
    sprite: '✨',
    serpent: '🐍',
    dragon: '🐉',
    phoenix: '🔥',
    egg: '🥚',
  };

  const icon = icons[traits.body] || '❓';
  const bar = generateXpBar(traits.level, 10);

  return `  ${icon} ${CYAN}${BOLD}${traits.name}${RESET} ${DIM}Lv.${traits.level}${RESET} ${bar} ${DIM}${traits.body}${RESET}`;
}
