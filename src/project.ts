import { execSync } from 'node:child_process';
import { basename } from 'node:path';

export interface ProjectIdentity {
  /** Unique ID derived from remote URL or directory name */
  id: string;
  /** Human-readable project name (repo name) */
  name: string;
  /** Git remote URL, or null if not a git repo */
  remote: string | null;
  /** Local directory path */
  directory: string;
}

/**
 * Parse a git remote URL into owner/repo format.
 * Handles HTTPS, SSH, and various git host formats.
 */
export function parseGitRemote(url: string): { owner: string; repo: string } | null {
  // Normalize: remove trailing .git
  const cleaned = url.trim().replace(/\.git$/, '');

  // SSH format: git@github.com:owner/repo
  const sshMatch = cleaned.match(/^[\w.-]+@[\w.-]+:([\w.-]+)\/([\w.-]+)$/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  // HTTPS format: https://github.com/owner/repo
  try {
    const parsed = new URL(cleaned);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
  } catch {
    // Not a URL — fall through
  }

  return null;
}

/**
 * Detect the current project identity from git remote or directory name.
 */
export function getProjectIdentity(cwd?: string): ProjectIdentity {
  const dir = cwd ?? process.cwd();

  try {
    const remote = execSync('git remote get-url origin', {
      cwd: dir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    const parsed = parseGitRemote(remote);
    if (parsed) {
      return {
        id: `${parsed.owner}/${parsed.repo}`,
        name: parsed.repo,
        remote,
        directory: dir,
      };
    }

    // Got a remote but couldn't parse it — use it as-is
    return {
      id: remote,
      name: basename(dir),
      remote,
      directory: dir,
    };
  } catch {
    // Not a git repo or no remote — fall back to directory name
    const name = basename(dir);
    return {
      id: `local/${name}`,
      name,
      remote: null,
      directory: dir,
    };
  }
}
