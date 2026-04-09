import { writeFileSync } from 'node:fs';
import { generateCreatureSVG } from './creature/procedural/generator.js';
import type { TraitDNA } from './analyzer/dna.js';
import { join } from 'node:path';

// Mock Trait DNAs for different project types
const creatures: { name: string; dna: TraitDNA; level: number }[] = [
  {
    name: 'Fitness App (Swift)',
    level: 5,
    dna: {
      element: 'fire', archetype: 'athletic', formModifier: 'native',
      hue: 15, saturation: 75, brightness: 60, formSeed: 12345,
      complexity: 0.6, energy: 0.8, symmetry: 0.5, density: 0.4,
      primaryLanguage: 'swift', secondaryLanguage: null,
      frameworks: ['SwiftUI'], domainKeywords: ['fitness', 'workout'],
      domainConfidence: 0.8, dnaHash: 'a1b2c3d4',
    },
  },
  {
    name: 'Social Network (React)',
    level: 7,
    dna: {
      element: 'electric', archetype: 'winged', formModifier: 'interconnected',
      hue: 195, saturation: 70, brightness: 55, formSeed: 67890,
      complexity: 0.8, energy: 0.7, symmetry: 0.4, density: 0.6,
      primaryLanguage: 'typescript', secondaryLanguage: 'javascript',
      frameworks: ['React', 'Next.js'], domainKeywords: ['social', 'chat'],
      domainConfidence: 0.9, dnaHash: 'e5f6a7b8',
    },
  },
  {
    name: 'ML Pipeline (Python)',
    level: 9,
    dna: {
      element: 'nature', archetype: 'cerebral', formModifier: 'analytical',
      hue: 120, saturation: 65, brightness: 50, formSeed: 11111,
      complexity: 0.9, energy: 0.5, symmetry: 0.7, density: 0.7,
      primaryLanguage: 'python', secondaryLanguage: null,
      frameworks: ['PyTorch', 'NumPy'], domainKeywords: ['ml', 'neural', 'model'],
      domainConfidence: 1.0, dnaHash: 'c9d0e1f2',
    },
  },
  {
    name: 'API Server (Go)',
    level: 6,
    dna: {
      element: 'wind', archetype: 'sentinel', formModifier: 'flowing',
      hue: 165, saturation: 60, brightness: 45, formSeed: 22222,
      complexity: 0.5, energy: 0.6, symmetry: 0.8, density: 0.3,
      primaryLanguage: 'go', secondaryLanguage: null,
      frameworks: [], domainKeywords: ['api', 'server', 'endpoint'],
      domainConfidence: 0.7, dnaHash: '33445566',
    },
  },
  {
    name: 'Crypto Wallet (Rust)',
    level: 8,
    dna: {
      element: 'metal', archetype: 'crystalline', formModifier: 'systematic',
      hue: 220, saturation: 55, brightness: 50, formSeed: 33333,
      complexity: 0.7, energy: 0.4, symmetry: 0.6, density: 0.5,
      primaryLanguage: 'rust', secondaryLanguage: null,
      frameworks: [], domainKeywords: ['crypto', 'wallet', 'blockchain'],
      domainConfidence: 0.9, dnaHash: '77889900',
    },
  },
  {
    name: 'Indie Game (TypeScript)',
    level: 4,
    dna: {
      element: 'electric', archetype: 'playful', formModifier: 'spatial',
      hue: 280, saturation: 80, brightness: 65, formSeed: 44444,
      complexity: 0.5, energy: 0.9, symmetry: 0.3, density: 0.4,
      primaryLanguage: 'typescript', secondaryLanguage: null,
      frameworks: ['Three.js'], domainKeywords: ['game', 'player'],
      domainConfidence: 0.8, dnaHash: 'aabbccdd',
    },
  },
  {
    name: 'Security Tool (Rust)',
    level: 3,
    dna: {
      element: 'metal', archetype: 'phantom', formModifier: 'minimal',
      hue: 270, saturation: 40, brightness: 35, formSeed: 55555,
      complexity: 0.4, energy: 0.3, symmetry: 0.5, density: 0.3,
      primaryLanguage: 'rust', secondaryLanguage: null,
      frameworks: [], domainKeywords: ['security', 'encryption'],
      domainConfidence: 0.7, dnaHash: 'eeff0011',
    },
  },
  {
    name: 'This Project',
    level: 3,
    dna: {
      element: 'electric', archetype: 'cerebral', formModifier: 'foundational',
      hue: 214, saturation: 64, brightness: 66, formSeed: 1739567813,
      complexity: 0.24, energy: 0.4, symmetry: 0.5, density: 0.33,
      primaryLanguage: 'typescript', secondaryLanguage: 'javascript',
      frameworks: [], domainKeywords: ['ai'],
      domainConfidence: 0.33, dnaHash: 'bf1d9f42',
    },
  },
];

// Generate HTML with all creatures
const cards = creatures.map(({ name, dna, level }) => {
  const svg = generateCreatureSVG(dna, { width: 400, height: 400, level });
  return `
    <div style="text-align:center;">
      <div style="border:1px solid #333; border-radius:12px; overflow:hidden; display:inline-block;">
        ${svg}
      </div>
      <div style="margin-top:8px; font-weight:bold;">${name}</div>
      <div style="color:#888; font-size:12px;">
        ${dna.element}/${dna.archetype} · Lv.${level} · #${dna.dnaHash}
      </div>
    </div>
  `;
}).join('\n');

const html = `<!DOCTYPE html>
<html>
<head>
  <title>AI Monsters — Creature Preview</title>
  <style>
    body { background: #0a0a0a; color: #eee; font-family: system-ui; padding: 40px; }
    h1 { text-align: center; color: #4fd1c5; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 30px; max-width: 1800px; margin: 0 auto; }
  </style>
</head>
<body>
  <h1>🐉 AI Monsters — Procedural Creature Gallery</h1>
  <div class="grid">
    ${cards}
  </div>
</body>
</html>`;

const outPath = join(process.cwd(), 'creature-preview.html');
writeFileSync(outPath, html);
console.log(`Preview written to ${outPath}`);
console.log('Open in browser to see the creatures!');
