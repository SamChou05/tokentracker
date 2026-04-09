import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Known frameworks and their visual form modifiers */
export type FormModifier =
  | 'interconnected'  // React, Vue, Svelte (component-based)
  | 'flowing'         // Express, Fastify, Koa (streaming/middleware)
  | 'structured'      // Django, Rails, Laravel (opinionated structure)
  | 'minimal'         // Flask, Sinatra, Hono (lightweight)
  | 'systematic'      // Spring, .NET (enterprise patterns)
  | 'reactive'        // RxJS, MobX, Convex (reactive data)
  | 'spatial'         // Three.js, Unity, SceneKit (3D/spatial)
  | 'analytical'      // TensorFlow, PyTorch, pandas (data/ML)
  | 'native'          // SwiftUI, Jetpack Compose (mobile native)
  | 'foundational';   // No specific framework detected

interface FrameworkMatch {
  name: string;
  formModifier: FormModifier;
  weight: number; // Higher = more important
}

/** Framework detection rules for package.json dependencies */
const NPM_FRAMEWORKS: Record<string, FrameworkMatch> = {
  'react': { name: 'React', formModifier: 'interconnected', weight: 10 },
  'next': { name: 'Next.js', formModifier: 'interconnected', weight: 12 },
  'vue': { name: 'Vue', formModifier: 'interconnected', weight: 10 },
  'nuxt': { name: 'Nuxt', formModifier: 'interconnected', weight: 12 },
  'svelte': { name: 'Svelte', formModifier: 'interconnected', weight: 10 },
  '@sveltejs/kit': { name: 'SvelteKit', formModifier: 'interconnected', weight: 12 },
  'express': { name: 'Express', formModifier: 'flowing', weight: 8 },
  'fastify': { name: 'Fastify', formModifier: 'flowing', weight: 8 },
  'hono': { name: 'Hono', formModifier: 'minimal', weight: 7 },
  'koa': { name: 'Koa', formModifier: 'flowing', weight: 7 },
  'three': { name: 'Three.js', formModifier: 'spatial', weight: 10 },
  '@react-three/fiber': { name: 'React Three Fiber', formModifier: 'spatial', weight: 10 },
  'tensorflow': { name: 'TensorFlow.js', formModifier: 'analytical', weight: 10 },
  '@tensorflow/tfjs': { name: 'TensorFlow.js', formModifier: 'analytical', weight: 10 },
  'rxjs': { name: 'RxJS', formModifier: 'reactive', weight: 6 },
  'convex': { name: 'Convex', formModifier: 'reactive', weight: 8 },
  'mobx': { name: 'MobX', formModifier: 'reactive', weight: 6 },
  'electron': { name: 'Electron', formModifier: 'native', weight: 8 },
  'tauri': { name: 'Tauri', formModifier: 'native', weight: 8 },
  'react-native': { name: 'React Native', formModifier: 'native', weight: 10 },
};

/** Python framework patterns in requirements.txt / pyproject.toml */
const PYTHON_FRAMEWORKS: Record<string, FrameworkMatch> = {
  'django': { name: 'Django', formModifier: 'structured', weight: 10 },
  'flask': { name: 'Flask', formModifier: 'minimal', weight: 8 },
  'fastapi': { name: 'FastAPI', formModifier: 'flowing', weight: 9 },
  'torch': { name: 'PyTorch', formModifier: 'analytical', weight: 10 },
  'pytorch': { name: 'PyTorch', formModifier: 'analytical', weight: 10 },
  'tensorflow': { name: 'TensorFlow', formModifier: 'analytical', weight: 10 },
  'pandas': { name: 'pandas', formModifier: 'analytical', weight: 7 },
  'numpy': { name: 'NumPy', formModifier: 'analytical', weight: 6 },
  'scikit-learn': { name: 'scikit-learn', formModifier: 'analytical', weight: 8 },
  'streamlit': { name: 'Streamlit', formModifier: 'reactive', weight: 7 },
};

export interface FrameworkProfile {
  /** Detected frameworks */
  frameworks: string[];
  /** Primary form modifier */
  formModifier: FormModifier;
  /** All detected form modifiers */
  allModifiers: FormModifier[];
}

/**
 * Detect frameworks from dependency files in the project.
 */
export function analyzeFrameworks(cwd: string): FrameworkProfile {
  const matches: FrameworkMatch[] = [];

  // Check package.json
  const pkgPath = join(cwd, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };

      for (const dep of Object.keys(allDeps)) {
        if (NPM_FRAMEWORKS[dep]) {
          matches.push(NPM_FRAMEWORKS[dep]);
        }
      }
    } catch { /* ignore parse errors */ }
  }

  // Check requirements.txt
  const reqPath = join(cwd, 'requirements.txt');
  if (existsSync(reqPath)) {
    try {
      const content = readFileSync(reqPath, 'utf-8').toLowerCase();
      for (const [key, match] of Object.entries(PYTHON_FRAMEWORKS)) {
        if (content.includes(key)) {
          matches.push(match);
        }
      }
    } catch { /* ignore */ }
  }

  // Check pyproject.toml
  const pyprojectPath = join(cwd, 'pyproject.toml');
  if (existsSync(pyprojectPath)) {
    try {
      const content = readFileSync(pyprojectPath, 'utf-8').toLowerCase();
      for (const [key, match] of Object.entries(PYTHON_FRAMEWORKS)) {
        if (content.includes(key)) {
          matches.push(match);
        }
      }
    } catch { /* ignore */ }
  }

  // Sort by weight, pick highest
  matches.sort((a, b) => b.weight - a.weight);

  const frameworks = [...new Set(matches.map((m) => m.name))];
  const allModifiers = [...new Set(matches.map((m) => m.formModifier))];
  const formModifier = matches[0]?.formModifier ?? 'foundational';

  return { frameworks, formModifier, allModifiers };
}
