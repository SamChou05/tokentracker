import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { analyzeLanguages } from './languages.ts';
import { analyzeFrameworks } from './frameworks.ts';
import { analyzeDomain } from './domain.ts';
import { analyzeProject } from './dna.ts';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'aimonsters-analyzer-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

/** Helper to create a mock project structure */
function createMockProject(files: Record<string, string>) {
  for (const [path, content] of Object.entries(files)) {
    const fullPath = join(tmpDir, path);
    mkdirSync(join(fullPath, '..'), { recursive: true });
    writeFileSync(fullPath, content);
  }
}

describe('language analyzer', () => {
  it('detects TypeScript as primary', () => {
    createMockProject({
      'src/index.ts': '', 'src/app.ts': '', 'src/utils.ts': '',
      'src/test.ts': '', 'package.json': '{}',
    });
    const result = analyzeLanguages(tmpDir);
    assert.equal(result.primary, 'typescript');
    assert.equal(result.element, 'electric');
  });

  it('detects Python as primary', () => {
    createMockProject({
      'app.py': '', 'models.py': '', 'views.py': '',
      'utils.py': '', 'tests.py': '',
    });
    const result = analyzeLanguages(tmpDir);
    assert.equal(result.primary, 'python');
    assert.equal(result.element, 'nature');
  });

  it('detects Rust as primary', () => {
    createMockProject({
      'src/main.rs': '', 'src/lib.rs': '', 'src/utils.rs': '',
    });
    const result = analyzeLanguages(tmpDir);
    assert.equal(result.primary, 'rust');
    assert.equal(result.element, 'metal');
  });

  it('detects secondary language', () => {
    createMockProject({
      'src/index.ts': '', 'src/app.ts': '', 'src/utils.ts': '',
      'scripts/build.py': '',
    });
    const result = analyzeLanguages(tmpDir);
    assert.equal(result.primary, 'typescript');
    assert.equal(result.secondary, 'python');
  });

  it('skips node_modules', () => {
    createMockProject({
      'src/index.ts': '',
      'node_modules/pkg/index.js': '',
      'node_modules/pkg/lib.js': '',
    });
    const result = analyzeLanguages(tmpDir);
    assert.equal(result.primary, 'typescript');
    assert.equal(result.totalFiles, 1);
  });
});

describe('framework analyzer', () => {
  it('detects React from package.json', () => {
    createMockProject({
      'package.json': JSON.stringify({
        dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
      }),
    });
    const result = analyzeFrameworks(tmpDir);
    assert.ok(result.frameworks.includes('React'));
    assert.equal(result.formModifier, 'interconnected');
  });

  it('detects Next.js over React (higher weight)', () => {
    createMockProject({
      'package.json': JSON.stringify({
        dependencies: { react: '^18.0.0', next: '^14.0.0' },
      }),
    });
    const result = analyzeFrameworks(tmpDir);
    assert.ok(result.frameworks.includes('Next.js'));
  });

  it('detects Django from requirements.txt', () => {
    createMockProject({
      'requirements.txt': 'django==4.2\ncelery==5.3\n',
    });
    const result = analyzeFrameworks(tmpDir);
    assert.ok(result.frameworks.includes('Django'));
    assert.equal(result.formModifier, 'structured');
  });

  it('detects PyTorch as analytical', () => {
    createMockProject({
      'requirements.txt': 'torch==2.0\nnumpy==1.24\n',
    });
    const result = analyzeFrameworks(tmpDir);
    assert.ok(result.frameworks.includes('PyTorch'));
    assert.equal(result.formModifier, 'analytical');
  });

  it('returns foundational when nothing detected', () => {
    createMockProject({ 'main.c': '' });
    const result = analyzeFrameworks(tmpDir);
    assert.equal(result.formModifier, 'foundational');
    assert.equal(result.frameworks.length, 0);
  });
});

describe('domain analyzer', () => {
  it('detects fitness domain from README', () => {
    createMockProject({
      'README.md': '# FitTrack\nA fitness tracking app for workout routines and exercise logging.',
    });
    const result = analyzeDomain(tmpDir);
    assert.equal(result.archetype, 'athletic');
    assert.ok(result.matchedKeywords.length > 0);
  });

  it('detects social domain', () => {
    createMockProject({
      'README.md': '# ChatApp\nA social messaging platform with friends and timeline features.',
    });
    const result = analyzeDomain(tmpDir);
    assert.equal(result.archetype, 'winged');
  });

  it('detects ML domain', () => {
    createMockProject({
      'README.md': '# DeepVision\nA deep learning model for computer vision and neural network inference.',
    });
    const result = analyzeDomain(tmpDir);
    assert.equal(result.archetype, 'cerebral');
  });

  it('detects API/backend domain from package.json', () => {
    createMockProject({
      'package.json': JSON.stringify({
        name: 'user-api-server',
        description: 'REST API backend with middleware and endpoints',
      }),
    });
    const result = analyzeDomain(tmpDir);
    assert.equal(result.archetype, 'sentinel');
  });

  it('returns adaptive for empty project', () => {
    createMockProject({ 'main.c': '' });
    const result = analyzeDomain(tmpDir);
    assert.equal(result.archetype, 'adaptive');
    assert.equal(result.confidence, 0);
  });
});

describe('trait DNA (integration)', () => {
  it('produces different DNA for different projects', () => {
    // Project 1: React fitness app
    createMockProject({
      'src/App.tsx': '', 'src/index.tsx': '', 'src/components/Workout.tsx': '',
      'package.json': JSON.stringify({
        name: 'fitapp',
        description: 'A fitness tracking application',
        dependencies: { react: '^18.0.0', next: '^14.0.0' },
      }),
      'README.md': '# FitApp\nTrack your workouts and exercise routines.',
    });
    const dna1 = analyzeProject(tmpDir);

    // Clean up and create project 2
    rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = mkdtempSync(join(tmpdir(), 'aimonsters-analyzer-'));

    // Project 2: Rust CLI tool
    createMockProject({
      'src/main.rs': '', 'src/lib.rs': '', 'src/cli.rs': '',
      'Cargo.toml': '[package]\nname = "devtool"\ndescription = "A command line utility tool"',
      'README.md': '# DevTool\nA CLI tool for developers.',
    });
    const dna2 = analyzeProject(tmpDir);

    // They should have different elements
    assert.notEqual(dna1.element, dna2.element);
    // Different archetypes
    assert.notEqual(dna1.archetype, dna2.archetype);
    // Different hues
    assert.notEqual(dna1.hue, dna2.hue);
    // Different DNA hashes
    assert.notEqual(dna1.dnaHash, dna2.dnaHash);
  });

  it('is deterministic — same project produces same DNA', () => {
    createMockProject({
      'src/index.ts': '', 'src/app.ts': '',
      'package.json': JSON.stringify({
        name: 'myapp',
        dependencies: { react: '^18.0.0' },
      }),
    });
    const dna1 = analyzeProject(tmpDir);
    const dna2 = analyzeProject(tmpDir);
    assert.deepEqual(dna1, dna2);
  });

  it('has all required fields', () => {
    createMockProject({
      'src/index.ts': '',
      'package.json': JSON.stringify({ name: 'test' }),
    });
    const dna = analyzeProject(tmpDir);
    assert.ok(dna.element);
    assert.ok(dna.archetype);
    assert.ok(dna.formModifier);
    assert.ok(typeof dna.hue === 'number');
    assert.ok(typeof dna.saturation === 'number');
    assert.ok(typeof dna.complexity === 'number');
    assert.ok(typeof dna.energy === 'number');
    assert.ok(typeof dna.symmetry === 'number');
    assert.ok(typeof dna.formSeed === 'number');
    assert.ok(dna.dnaHash);
  });
});
