import type { CreatureState, SessionData } from './store.js';
import { getSyncConfig } from './commands/login.js';

/**
 * Fire-and-forget sync of creature data to Convex.
 * Called after every feed_session. Non-blocking — errors are logged but never thrown.
 */
export function syncInBackground(creature: CreatureState, session?: SessionData): void {
  const config = getSyncConfig();
  if (!config) {
    // Not logged in — skip silently
    return;
  }

  // Fire and forget — don't await
  doSync(config.syncUrl, config.syncToken, creature).catch((err) => {
    console.error(`[tokenpets] ⚠ Sync failed (non-blocking): ${err.message}`);
  });
}

async function doSync(
  syncUrl: string,
  syncToken: string,
  creature: CreatureState,
): Promise<void> {
  const payload = {
    token: syncToken,
    creature: {
      projectId: creature.project_id,
      name: creature.project_name,
      remoteUrl: creature.remote_url,
      level: creature.level,
      totalTokensIn: creature.total_tokens_in,
      totalTokensOut: creature.total_tokens_out,
      totalTokens: creature.total_tokens,
      totalCostUsd: creature.total_cost_usd,
      totalSessions: creature.total_sessions,
      totalToolCalls: creature.total_tool_calls,
      totalLinesAdded: creature.total_lines_added,
      totalLinesRemoved: creature.total_lines_removed,
      totalFilesChanged: creature.total_files_changed,
      sessionsSuccess: creature.sessions_success,
      sessionsFailure: creature.sessions_failure,
      codingStyle: creature.coding_style,
      xpProgress: creature.xp_progress,
      traitDna: creature.trait_dna,
      localCreatedAt: creature.created_at,
      localUpdatedAt: creature.updated_at,
    },
  };

  const resp = await fetch(`${syncUrl}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000), // 5s timeout — don't hang
  });

  if (resp.ok) {
    console.error(`[tokenpets] ☁️  Synced to web`);
  } else {
    const text = await resp.text().catch(() => '');
    console.error(`[tokenpets] ⚠ Sync returned ${resp.status}: ${text}`);
  }
}
