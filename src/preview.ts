import { deriveTraits, eggTraits } from './creature/traits.js';
import { renderCreature, renderCreatureCompact } from './creature/render.js';
import type { CreatureState, CodingStyle } from './store.js';
import { calculateLevel, calculateXpProgress } from './store.js';

function makeCreature(totalTokens: number, name: string, style: CodingStyle = 'balanced'): CreatureState {
  return {
    project_id: `test/${name}`,
    project_name: name,
    remote_url: null,
    total_tokens_in: Math.floor(totalTokens * 0.6),
    total_tokens_out: Math.floor(totalTokens * 0.4),
    total_tokens: totalTokens,
    total_cost_usd: totalTokens * 0.00001,
    total_sessions: Math.max(1, Math.floor(totalTokens / 15000)),
    total_tool_calls: Math.floor(totalTokens / 300),
    total_lines_added: Math.floor(totalTokens / 100),
    total_lines_removed: Math.floor(totalTokens / 300),
    total_files_changed: Math.floor(totalTokens / 2000),
    sessions_success: Math.max(1, Math.floor(totalTokens / 18000)),
    sessions_failure: Math.floor(totalTokens / 60000),
    level: calculateLevel(totalTokens),
    xp_progress: calculateXpProgress(totalTokens),
    coding_style: style,
    created_at: '2026-01-01',
    updated_at: '2026-04-08',
    trait_dna: null,
  };
}

console.log('\n=== AI MONSTERS — Creature Preview (New XP Curve) ===\n');

// Egg
const egg = eggTraits('new-project');
console.log(renderCreature(egg));

// Show progression with realistic token amounts
const stages: { tokens: number; name: string; style?: CodingStyle }[] = [
  { tokens: 15000,       name: 'hello-world' },         // Lv 1
  { tokens: 50000,       name: 'my-first-app' },        // Lv 2
  { tokens: 150000,      name: 'react-dashboard', style: 'builder' },  // Lv 4
  { tokens: 750000,      name: 'api-server', style: 'architect' },     // Lv 6
  { tokens: 3000000,     name: 'ml-pipeline', style: 'debugger' },     // Lv 8
  { tokens: 12000000,    name: 'magnum-opus', style: 'refactorer' },   // Lv 10 — legendary
];

for (const { tokens, name, style } of stages) {
  const creature = makeCreature(tokens, name, style);
  console.log(renderCreature(deriveTraits(creature)));
}

// Collection view
console.log('\n=== Collection View ===\n');
console.log(renderCreatureCompact(eggTraits('new-project')));
for (const { tokens, name, style } of stages) {
  const creature = makeCreature(tokens, name, style);
  console.log(renderCreatureCompact(deriveTraits(creature)));
}
console.log('');

// Level thresholds reference
console.log('=== Level Thresholds ===\n');
const thresholds = [0, 10000, 30000, 75000, 150000, 350000, 750000, 1500000, 3000000, 6000000, 12000000, 25000000, 50000000, 100000000, 200000000, 500000000];
for (let i = 0; i < thresholds.length; i++) {
  const approx = thresholds[i] < 10000 ? 'egg' :
                 thresholds[i] < 50000 ? '~2-3 sessions' :
                 thresholds[i] < 200000 ? '~1-2 weeks' :
                 thresholds[i] < 1000000 ? '~1 month' :
                 thresholds[i] < 5000000 ? '~2-3 months' :
                 thresholds[i] < 20000000 ? '~6 months' : '~1+ year';
  console.log(`  Lv ${String(i).padStart(2)}: ${thresholds[i].toLocaleString().padStart(13)} tokens  (${approx})`);
}
console.log('');
