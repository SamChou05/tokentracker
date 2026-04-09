import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const findCreature = internalQuery({
  args: {
    userId: v.id("users"),
    projectId: v.string(),
  },
  handler: async (ctx, { userId, projectId }) => {
    const creature = await ctx.db
      .query("creatures")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", userId).eq("projectId", projectId)
      )
      .first();
    return creature?._id ?? null;
  },
});

export const createCreature = internalMutation({
  args: {
    userId: v.id("users"),
    projectId: v.string(),
    name: v.string(),
    remoteUrl: v.optional(v.string()),
    level: v.number(),
    totalTokensIn: v.number(),
    totalTokensOut: v.number(),
    totalTokens: v.number(),
    totalCostUsd: v.number(),
    totalSessions: v.number(),
    totalToolCalls: v.number(),
    totalLinesAdded: v.number(),
    totalLinesRemoved: v.number(),
    totalFilesChanged: v.number(),
    sessionsSuccess: v.number(),
    sessionsFailure: v.number(),
    codingStyle: v.string(),
    xpProgress: v.number(),
    traitDna: v.optional(v.any()),
    localCreatedAt: v.string(),
    localUpdatedAt: v.string(),
    syncedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("creatures", args);
  },
});

export const updateCreature = internalMutation({
  args: {
    id: v.id("creatures"),
    data: v.object({
      name: v.string(),
      remoteUrl: v.optional(v.string()),
      level: v.number(),
      totalTokensIn: v.number(),
      totalTokensOut: v.number(),
      totalTokens: v.number(),
      totalCostUsd: v.number(),
      totalSessions: v.number(),
      totalToolCalls: v.number(),
      totalLinesAdded: v.number(),
      totalLinesRemoved: v.number(),
      totalFilesChanged: v.number(),
      sessionsSuccess: v.number(),
      sessionsFailure: v.number(),
      codingStyle: v.string(),
      xpProgress: v.number(),
    traitDna: v.optional(v.any()),
      localCreatedAt: v.string(),
      localUpdatedAt: v.string(),
      syncedAt: v.number(),
    }),
  },
  handler: async (ctx, { id, data }) => {
    await ctx.db.patch(id, data);
  },
});
