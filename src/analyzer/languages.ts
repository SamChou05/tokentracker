import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

/** Element types — derived from primary language */
export type Element =
  | 'electric'   // TypeScript, JavaScript
  | 'nature'     // Python
  | 'metal'      // Rust, C, C++
  | 'wind'       // Go
  | 'fire'       // Swift, Kotlin
  | 'crystal'    // Ruby
  | 'earth'      // Java, C#
  | 'void'       // Assembly, low-level
  | 'arcane'     // Haskell, Lisp, Elixir
  | 'water';     // PHP, Lua, Shell

/** Map file extensions to language names */
const EXT_TO_LANG: Record<string, string> = {
  '.ts': 'typescript', '.tsx': 'typescript',
  '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
  '.py': 'python', '.pyw': 'python',
  '.rs': 'rust',
  '.go': 'go',
  '.swift': 'swift',
  '.kt': 'kotlin', '.kts': 'kotlin',
  '.rb': 'ruby', '.erb': 'ruby',
  '.java': 'java',
  '.cs': 'csharp',
  '.c': 'c', '.h': 'c',
  '.cpp': 'cpp', '.cc': 'cpp', '.cxx': 'cpp', '.hpp': 'cpp',
  '.hs': 'haskell',
  '.ex': 'elixir', '.exs': 'elixir',
  '.erl': 'erlang',
  '.clj': 'clojure',
  '.lisp': 'lisp', '.cl': 'lisp',
  '.php': 'php',
  '.lua': 'lua',
  '.sh': 'shell', '.bash': 'shell', '.zsh': 'shell',
  '.r': 'r', '.R': 'r',
  '.scala': 'scala',
  '.dart': 'dart',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.zig': 'zig',
  '.nim': 'nim',
  '.ml': 'ocaml', '.mli': 'ocaml',
};

/** Map languages to elements */
const LANG_TO_ELEMENT: Record<string, Element> = {
  typescript: 'electric', javascript: 'electric', vue: 'electric', svelte: 'electric',
  python: 'nature', r: 'nature',
  rust: 'metal', c: 'metal', cpp: 'metal', zig: 'metal',
  go: 'wind', nim: 'wind',
  swift: 'fire', kotlin: 'fire', dart: 'fire',
  ruby: 'crystal',
  java: 'earth', csharp: 'earth', scala: 'earth',
  haskell: 'arcane', elixir: 'arcane', erlang: 'arcane', clojure: 'arcane', lisp: 'arcane', ocaml: 'arcane',
  php: 'water', lua: 'water', shell: 'water',
};

/** Directories to skip during scanning */
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.gsd', 'dist', 'build', 'out', '.next',
  '__pycache__', '.mypy_cache', 'target', 'vendor', '.venv', 'venv',
  'coverage', '.cache', '.turbo', '.vercel',
]);

export interface LanguageProfile {
  /** Language name → file count */
  distribution: Record<string, number>;
  /** Primary language (most files) */
  primary: string;
  /** Secondary language (second most) */
  secondary: string | null;
  /** Element type derived from primary language */
  element: Element;
  /** Total source files found */
  totalFiles: number;
}

/**
 * Scan a directory and build a language profile.
 * Walks the file tree (skipping known non-source dirs) and counts file extensions.
 */
export function analyzeLanguages(cwd: string, maxDepth: number = 5): LanguageProfile {
  const counts: Record<string, number> = {};
  let totalFiles = 0;

  function walk(dir: string, depth: number) {
    if (depth > maxDepth) return;

    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.startsWith('.') && entry !== '.') continue;
      if (SKIP_DIRS.has(entry)) continue;

      const fullPath = join(dir, entry);
      let stat;
      try {
        stat = statSync(fullPath);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        walk(fullPath, depth + 1);
      } else if (stat.isFile()) {
        const ext = extname(entry).toLowerCase();
        const lang = EXT_TO_LANG[ext];
        if (lang) {
          counts[lang] = (counts[lang] || 0) + 1;
          totalFiles++;
        }
      }
    }
  }

  walk(cwd, 0);

  // Sort by count descending
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0]?.[0] ?? 'unknown';
  const secondary = sorted[1]?.[0] ?? null;
  const element = LANG_TO_ELEMENT[primary] ?? 'electric';

  return {
    distribution: counts,
    primary,
    secondary,
    element,
    totalFiles,
  };
}
