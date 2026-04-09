import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Extend the default users table with profile fields
  users: defineTable({
    // Auth fields (managed by Convex Auth)
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom profile fields
    username: v.optional(v.string()),  // GitHub username
    githubId: v.optional(v.string()),  // GitHub user ID
    avatarUrl: v.optional(v.string()), // GitHub avatar
    bio: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("by_username", ["username"])
    .index("by_githubId", ["githubId"]),

  // Synced creatures from local CLI
  creatures: defineTable({
    userId: v.id("users"),
    projectId: v.string(),       // e.g., "samchou/aimonsters"
    name: v.string(),             // project name
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
    codingStyle: v.string(),      // "balanced" | "builder" | "debugger" | "refactorer" | "architect"
    xpProgress: v.number(),       // 0.0 - 1.0
    traitDna: v.optional(v.any()),  // TraitDNA object from project analyzer
    localCreatedAt: v.string(),   // from local DB
    localUpdatedAt: v.string(),   // from local DB
    syncedAt: v.number(),         // when this was last synced (ms since epoch)
  })
    .index("by_user", ["userId"])
    .index("by_user_project", ["userId", "projectId"]),

  // Synced session history
  codingSessions: defineTable({
    creatureId: v.id("creatures"),
    userId: v.id("users"),
    tokensIn: v.number(),
    tokensOut: v.number(),
    costUsd: v.number(),
    toolCalls: v.number(),
    outcome: v.string(),
    summary: v.optional(v.string()),
    linesAdded: v.number(),
    linesRemoved: v.number(),
    filesChanged: v.number(),
    localCreatedAt: v.string(),
    syncedAt: v.number(),
  })
    .index("by_creature", ["creatureId"])
    .index("by_user", ["userId"]),

  // Sync tokens for CLI → Convex authentication
  syncTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),
});
