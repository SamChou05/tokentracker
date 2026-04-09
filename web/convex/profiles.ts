import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a user's public profile by username.
 * No auth required — this is a public query.
 */
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    if (!user) return null;

    const creatures = await ctx.db
      .query("creatures")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Sort by level descending (highest level first)
    creatures.sort((a, b) => b.level - a.level);

    // Calculate aggregate stats
    const totalTokens = creatures.reduce((sum, c) => sum + c.totalTokens, 0);
    const totalSessions = creatures.reduce((sum, c) => sum + c.totalSessions, 0);
    const highestLevel = creatures.length > 0 ? creatures[0].level : 0;

    return {
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        image: user.image,
        bio: user.bio,
      },
      creatures,
      stats: {
        creatureCount: creatures.length,
        totalTokens,
        totalSessions,
        highestLevel,
      },
    };
  },
});
