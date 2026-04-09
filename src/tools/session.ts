import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getProjectIdentity } from '../project.js';
import { upsertProject, recordSession, getCreature, getSessionHistory, getLevelThreshold, getMaxLevel, saveTraitDNA } from '../store.js';
import { syncInBackground } from '../sync.js';
import { analyzeProject } from '../analyzer/index.js';

const STYLE_LABELS: Record<string, string> = {
  balanced: '⚖️ Balanced',
  builder: '🏗️ Builder',
  debugger: '🔍 Debugger',
  refactorer: '♻️ Refactorer',
  architect: '📐 Architect',
};

export function registerFeedTool(server: McpServer): void {
  server.tool(
    'feed_session',
    'Record a coding session to feed your AI Monster. Call this after completing work to log token usage and outcomes.',
    {
      tokens_in: z.number().describe('Input tokens consumed in the session'),
      tokens_out: z.number().describe('Output tokens generated in the session'),
      cost_usd: z.number().optional().describe('Estimated cost in USD'),
      tool_calls: z.number().optional().describe('Number of tool calls made'),
      outcome: z.enum(['success', 'failure', 'partial']).optional().describe('Session outcome'),
      summary: z.string().optional().describe('Brief summary of what was accomplished'),
      lines_added: z.number().optional().describe('Lines added in git diff'),
      lines_removed: z.number().optional().describe('Lines removed in git diff'),
      files_changed: z.number().optional().describe('Files changed in git diff'),
    },
    async (params) => {
      const project = getProjectIdentity();
      upsertProject(project);

      const { creature, previousLevel, leveledUp } = recordSession(project.id, {
        tokens_in: params.tokens_in,
        tokens_out: params.tokens_out,
        cost_usd: params.cost_usd ?? 0,
        tool_calls: params.tool_calls ?? 0,
        outcome: params.outcome ?? 'success',
        summary: params.summary ?? null,
        lines_added: params.lines_added,
        lines_removed: params.lines_removed,
        files_changed: params.files_changed,
      });

      const fedTokens = params.tokens_in + params.tokens_out;
      console.error(`[aimonsters] 🍖 Fed ${fedTokens} tokens to ${project.name} (Level ${creature.level}, ${creature.total_sessions} sessions)`);

      // Analyze project DNA on first feed or every 10 sessions
      if (!creature.trait_dna || creature.total_sessions % 10 === 1) {
        try {
          const dna = analyzeProject(project.directory);
          saveTraitDNA(project.id, dna);
          creature.trait_dna = dna;
          console.error(`[aimonsters] 🧬 DNA analyzed: ${dna.element}/${dna.archetype} (${dna.dnaHash})`);
        } catch (err: any) {
          console.error(`[aimonsters] ⚠ DNA analysis failed: ${err.message}`);
        }
      }

      // Auto-sync to web (fire-and-forget)
      syncInBackground(creature);

      let text = `🍖 Fed ${fedTokens.toLocaleString()} tokens to your ${project.name} monster!\n`;

      if (leveledUp) {
        text += `\n🎉 LEVEL UP! ${previousLevel} → ${creature.level}!\n`;
        text += `Your monster evolves...\n`;
      }

      // XP progress bar
      const nextLevel = creature.level + 1;
      const nextThreshold = getLevelThreshold(nextLevel);
      const progressPct = Math.round(creature.xp_progress * 100);

      text += `\nLevel: ${creature.level}`;
      if (creature.level < getMaxLevel()) {
        text += ` (${progressPct}% → Lv.${nextLevel} at ${nextThreshold.toLocaleString()} tokens)`;
      } else {
        text += ` (MAX)`;
      }
      text += `\nTotal tokens: ${creature.total_tokens.toLocaleString()}`;
      text += `\nSessions: ${creature.total_sessions}`;
      text += `\nStyle: ${STYLE_LABELS[creature.coding_style] || creature.coding_style}`;

      return {
        content: [{ type: 'text' as const, text }],
      };
    },
  );
}

export function registerStatusTool(server: McpServer): void {
  server.tool(
    'monster_status',
    'Check the status of your AI Monster for the current project.',
    {},
    async () => {
      const project = getProjectIdentity();
      upsertProject(project);

      const creature = getCreature(project.id);
      console.error(`[aimonsters] 📊 Status check for ${project.name}`);

      if (!creature) {
        return {
          content: [{
            type: 'text' as const,
            text: `🥚 Your ${project.name} monster hasn't hatched yet!\n` +
              `Feed it by calling feed_session after doing some work.\n` +
              `Hatch threshold: 10,000 tokens\n` +
              `Project: ${project.id}`,
          }],
        };
      }

      const nextLevel = creature.level + 1;
      const nextThreshold = getLevelThreshold(nextLevel);
      const progressPct = Math.round(creature.xp_progress * 100);

      let text = `🐉 ${project.name} Monster — Level ${creature.level}\n`;
      if (creature.level < getMaxLevel()) {
        text += `Progress: ${progressPct}% → Lv.${nextLevel} (need ${nextThreshold.toLocaleString()} tokens)\n`;
      } else {
        text += `⭐ MYTHICAL STATUS\n`;
      }
      text += `Style: ${STYLE_LABELS[creature.coding_style] || creature.coding_style}\n`;
      text += `\nTokens: ${creature.total_tokens.toLocaleString()} (${creature.total_tokens_in.toLocaleString()} in / ${creature.total_tokens_out.toLocaleString()} out)\n`;
      text += `Cost invested: $${creature.total_cost_usd.toFixed(2)}\n`;
      text += `Sessions: ${creature.total_sessions} (${creature.sessions_success} success, ${creature.sessions_failure} failed)\n`;

      if (creature.total_lines_added + creature.total_lines_removed > 0) {
        text += `Code changes: +${creature.total_lines_added.toLocaleString()} / -${creature.total_lines_removed.toLocaleString()} lines, ${creature.total_files_changed} files\n`;
      }

      text += `Last fed: ${creature.updated_at}\n`;
      text += `Project: ${creature.project_id}`;

      // Recent sessions
      const history = getSessionHistory(project.id, 5);
      if (history.length > 0) {
        text += '\n\nRecent sessions:';
        for (const s of history) {
          const tokens = s.tokens_in + s.tokens_out;
          const icon = s.outcome === 'success' ? '✅' : s.outcome === 'failure' ? '❌' : '⚠️';
          text += `\n  ${s.created_at} — ${tokens.toLocaleString()} tokens ${icon}`;
          if (s.summary) text += ` "${s.summary}"`;
        }
      }

      return {
        content: [{ type: 'text' as const, text }],
      };
    },
  );
}
