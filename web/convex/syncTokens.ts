import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Generate a sync token for the authenticated user.
 * Called from the web UI after the user signs in.
 */
export const generate = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Delete any existing tokens for this user (one active token per user)
    const existing = await ctx.db
      .query("syncTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const token of existing) {
      await ctx.db.delete(token._id);
    }

    // Generate a random token
    const token = generateRandomToken();

    await ctx.db.insert("syncTokens", {
      userId,
      token,
      createdAt: Date.now(),
    });

    return token;
  },
});

/**
 * Get the current user's sync token (if one exists).
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const tokenDoc = await ctx.db
      .query("syncTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return tokenDoc?.token ?? null;
  },
});

/**
 * Validate a sync token and return the associated userId.
 * Used internally by the sync HTTP action.
 */
export const validate = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const tokenDoc = await ctx.db
      .query("syncTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!tokenDoc) return null;
    return tokenDoc.userId;
  },
});

function generateRandomToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "ams_"; // prefix for easy identification
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
