import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/** Get a single creature by ID (public — no auth required) */
export const getById = query({
  args: { id: v.id("creatures") },
  handler: async (ctx, { id }) => {
    const creature = await ctx.db.get(id);
    if (!creature) return null;

    const user = await ctx.db.get(creature.userId);

    return {
      ...creature,
      user: user ? {
        name: user.name,
        username: (user as any).username,
        image: user.image,
      } : null,
    };
  },
});

/** Get all creatures belonging to the authenticated user */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("creatures")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/** Group multiple creatures into one (merge repos into a project creature).
 *  Keeps the first creature as the "primary" and sums stats from others.
 *  The merged creatures are deleted.
 */
export const mergeCreatures = mutation({
  args: {
    primaryId: v.id("creatures"),
    mergeIds: v.array(v.id("creatures")),
    newName: v.optional(v.string()),
  },
  handler: async (ctx, { primaryId, mergeIds, newName }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const primary = await ctx.db.get(primaryId);
    if (!primary || primary.userId !== userId) throw new Error("Creature not found");

    // Accumulate stats from merged creatures
    let totalTokensIn = primary.totalTokensIn;
    let totalTokensOut = primary.totalTokensOut;
    let totalCostUsd = primary.totalCostUsd;
    let totalSessions = primary.totalSessions;
    let totalToolCalls = primary.totalToolCalls;
    let totalLinesAdded = primary.totalLinesAdded;
    let totalLinesRemoved = primary.totalLinesRemoved;
    let totalFilesChanged = primary.totalFilesChanged;
    let sessionsSuccess = primary.sessionsSuccess;
    let sessionsFailure = primary.sessionsFailure;

    const mergedProjectIds: string[] = [primary.projectId];

    for (const mergeId of mergeIds) {
      if (mergeId === primaryId) continue;
      const c = await ctx.db.get(mergeId);
      if (!c || c.userId !== userId) continue;

      totalTokensIn += c.totalTokensIn;
      totalTokensOut += c.totalTokensOut;
      totalCostUsd += c.totalCostUsd;
      totalSessions += c.totalSessions;
      totalToolCalls += c.totalToolCalls;
      totalLinesAdded += c.totalLinesAdded;
      totalLinesRemoved += c.totalLinesRemoved;
      totalFilesChanged += c.totalFilesChanged;
      sessionsSuccess += c.sessionsSuccess;
      sessionsFailure += c.sessionsFailure;
      mergedProjectIds.push(c.projectId);

      await ctx.db.delete(mergeId);
    }

    const totalTokens = totalTokensIn + totalTokensOut;

    await ctx.db.patch(primaryId, {
      name: newName ?? primary.name,
      totalTokensIn, totalTokensOut, totalTokens,
      totalCostUsd, totalSessions, totalToolCalls,
      totalLinesAdded, totalLinesRemoved, totalFilesChanged,
      sessionsSuccess, sessionsFailure,
      syncedAt: Date.now(),
    });

    return { merged: mergeIds.length, totalTokens };
  },
});
