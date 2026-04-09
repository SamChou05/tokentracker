import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Creature archetype — derived from project domain */
export type Archetype =
  | 'athletic'      // Fitness, health, sports
  | 'winged'        // Social, communication, networking
  | 'playful'       // Games, entertainment, creative
  | 'sentinel'      // API, infrastructure, backend
  | 'cerebral'      // ML, AI, data science
  | 'crystalline'   // Finance, crypto, blockchain
  | 'harmonic'      // Music, audio, media
  | 'organic'       // Bio, science, research
  | 'phantom'       // Security, privacy, crypto
  | 'primal'        // CLI, tools, devtools
  | 'radiant'       // Design, UI, frontend-focused
  | 'adaptive';     // General purpose / undetected

/** Domain keyword patterns → archetype mapping */
const DOMAIN_PATTERNS: { keywords: string[]; archetype: Archetype }[] = [
  { keywords: ['fitness', 'health', 'workout', 'exercise', 'gym', 'training', 'sport', 'athletic', 'calories', 'heartrate', 'healthkit'], archetype: 'athletic' },
  { keywords: ['social', 'chat', 'messaging', 'feed', 'timeline', 'friends', 'followers', 'community', 'network', 'forum', 'comments'], archetype: 'winged' },
  { keywords: ['game', 'gaming', 'player', 'score', 'level', 'quest', 'rpg', 'sprite', 'unity', 'godot', 'phaser'], archetype: 'playful' },
  { keywords: ['api', 'server', 'backend', 'microservice', 'endpoint', 'rest', 'graphql', 'grpc', 'middleware', 'proxy'], archetype: 'sentinel' },
  { keywords: ['machine learning', 'ml', 'ai', 'neural', 'model', 'training', 'inference', 'nlp', 'computer vision', 'deep learning', 'transformer', 'llm', 'gpt'], archetype: 'cerebral' },
  { keywords: ['finance', 'trading', 'payment', 'bank', 'crypto', 'blockchain', 'defi', 'wallet', 'token', 'nft', 'ledger', 'exchange'], archetype: 'crystalline' },
  { keywords: ['music', 'audio', 'sound', 'midi', 'synthesizer', 'spotify', 'playlist', 'podcast', 'streaming', 'video', 'media'], archetype: 'harmonic' },
  { keywords: ['bio', 'genome', 'protein', 'molecule', 'chemistry', 'research', 'scientific', 'lab', 'experiment', 'simulation'], archetype: 'organic' },
  { keywords: ['security', 'auth', 'encryption', 'password', 'oauth', 'jwt', 'firewall', 'vulnerability', 'pentest'], archetype: 'phantom' },
  { keywords: ['cli', 'terminal', 'command', 'tool', 'utility', 'devtool', 'linter', 'formatter', 'bundler', 'compiler'], archetype: 'primal' },
  { keywords: ['design', 'ui', 'ux', 'component', 'theme', 'animation', 'layout', 'responsive', 'tailwind', 'css', 'styled'], archetype: 'radiant' },
];

export interface DomainProfile {
  /** Detected archetype */
  archetype: Archetype;
  /** Keywords that matched */
  matchedKeywords: string[];
  /** Raw text that was analyzed */
  sourceText: string;
  /** Match confidence (0-1) */
  confidence: number;
}

/**
 * Analyze project domain from README, package.json description, etc.
 */
export function analyzeDomain(cwd: string): DomainProfile {
  const textSources: string[] = [];

  // Read README (first 2000 chars)
  for (const readme of ['README.md', 'README.txt', 'README', 'readme.md']) {
    const readmePath = join(cwd, readme);
    if (existsSync(readmePath)) {
      try {
        const content = readFileSync(readmePath, 'utf-8').slice(0, 2000);
        textSources.push(content);
      } catch { /* ignore */ }
      break;
    }
  }

  // Read package.json description
  const pkgPath = join(cwd, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.description) textSources.push(pkg.description);
      if (pkg.name) textSources.push(pkg.name);
      if (pkg.keywords) textSources.push(pkg.keywords.join(' '));
    } catch { /* ignore */ }
  }

  // Read Cargo.toml description
  const cargoPath = join(cwd, 'Cargo.toml');
  if (existsSync(cargoPath)) {
    try {
      const content = readFileSync(cargoPath, 'utf-8');
      const descMatch = content.match(/description\s*=\s*"([^"]+)"/);
      if (descMatch) textSources.push(descMatch[1]);
    } catch { /* ignore */ }
  }

  const combinedText = textSources.join(' ').toLowerCase();

  if (!combinedText.trim()) {
    return { archetype: 'adaptive', matchedKeywords: [], sourceText: '', confidence: 0 };
  }

  // Score each archetype
  let bestArchetype: Archetype = 'adaptive';
  let bestScore = 0;
  let bestKeywords: string[] = [];

  for (const pattern of DOMAIN_PATTERNS) {
    const matched = pattern.keywords.filter((kw) => combinedText.includes(kw));
    const score = matched.length;

    if (score > bestScore) {
      bestScore = score;
      bestArchetype = pattern.archetype;
      bestKeywords = matched;
    }
  }

  // Confidence based on number of keyword matches
  const confidence = Math.min(1.0, bestScore / 3);

  return {
    archetype: bestArchetype,
    matchedKeywords: bestKeywords,
    sourceText: combinedText.slice(0, 200),
    confidence,
  };
}
