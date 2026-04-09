import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * HTTP action to receive creature sync data from the CLI.
 * POST /api/sync
 * Body: { token, creature, sessions? }
 */
export const syncCreature = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { token, creature, sessions } = body;

  if (!token || !creature) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: token, creature" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate sync token
  const userId = await ctx.runQuery(api.syncTokens.validate, { token });
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Invalid sync token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Upsert creature
  const now = Date.now();

  // Check if creature already exists for this user + project
  const existing = await ctx.runQuery(internal.syncInternal.findCreature, {
    userId,
    projectId: creature.projectId,
  });

  let creatureId: string;

  if (existing) {
    // Update existing creature
    await ctx.runMutation(internal.syncInternal.updateCreature, {
      id: existing,
      data: {
        name: creature.name,
        remoteUrl: creature.remoteUrl ?? undefined,
        level: creature.level,
        totalTokensIn: creature.totalTokensIn,
        totalTokensOut: creature.totalTokensOut,
        totalTokens: creature.totalTokens,
        totalCostUsd: creature.totalCostUsd,
        totalSessions: creature.totalSessions,
        totalToolCalls: creature.totalToolCalls,
        totalLinesAdded: creature.totalLinesAdded ?? 0,
        totalLinesRemoved: creature.totalLinesRemoved ?? 0,
        totalFilesChanged: creature.totalFilesChanged ?? 0,
        sessionsSuccess: creature.sessionsSuccess ?? 0,
        sessionsFailure: creature.sessionsFailure ?? 0,
        codingStyle: creature.codingStyle ?? "balanced",
        xpProgress: creature.xpProgress ?? 0,
        traitDna: creature.traitDna ?? undefined,
        localCreatedAt: creature.localCreatedAt,
        localUpdatedAt: creature.localUpdatedAt,
        syncedAt: now,
      },
    });
    creatureId = existing;
  } else {
    // Create new creature
    creatureId = await ctx.runMutation(internal.syncInternal.createCreature, {
      userId,
      projectId: creature.projectId,
      name: creature.name,
      remoteUrl: creature.remoteUrl ?? undefined,
      level: creature.level,
      totalTokensIn: creature.totalTokensIn,
      totalTokensOut: creature.totalTokensOut,
      totalTokens: creature.totalTokens,
      totalCostUsd: creature.totalCostUsd,
      totalSessions: creature.totalSessions,
      totalToolCalls: creature.totalToolCalls,
      totalLinesAdded: creature.totalLinesAdded ?? 0,
      totalLinesRemoved: creature.totalLinesRemoved ?? 0,
      totalFilesChanged: creature.totalFilesChanged ?? 0,
      sessionsSuccess: creature.sessionsSuccess ?? 0,
      sessionsFailure: creature.sessionsFailure ?? 0,
      codingStyle: creature.codingStyle ?? "balanced",
      xpProgress: creature.xpProgress ?? 0,
        traitDna: creature.traitDna ?? undefined,
      localCreatedAt: creature.localCreatedAt,
      localUpdatedAt: creature.localUpdatedAt,
      syncedAt: now,
    });
  }

  return new Response(
    JSON.stringify({ ok: true, creatureId }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
