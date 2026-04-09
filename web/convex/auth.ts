import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub({
      profile(githubProfile) {
        return {
          id: githubProfile.id.toString(),
          name: githubProfile.name ?? githubProfile.login,
          email: githubProfile.email,
          image: githubProfile.avatar_url,
          username: githubProfile.login,
          githubId: githubProfile.id.toString(),
          avatarUrl: githubProfile.avatar_url,
        };
      },
    }),
  ],
});
