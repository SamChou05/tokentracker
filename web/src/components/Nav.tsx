"use client";

import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Nav() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
      <Link href="/" className="text-sm font-semibold tracking-tight hover:text-zinc-300 transition-colors">
        AI Monsters
      </Link>
      <div className="flex items-center gap-4">
        <Authenticated>
          <AuthedNav />
        </Authenticated>
        <Unauthenticated>
          <UnauthNav />
        </Unauthenticated>
      </div>
    </nav>
  );
}

function AuthedNav() {
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.viewer);

  return (
    <>
      <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
        Dashboard
      </Link>
      <Link href="/cli-token" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
        CLI Token
      </Link>
      {(user as any)?.username && (
        <Link
          href={`/u/${(user as any).username}`}
          className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          Profile
        </Link>
      )}
      <button
        onClick={() => void signOut()}
        className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
      >
        Sign out
      </button>
      {user?.image && (
        <img src={user.image} alt="" className="w-7 h-7 rounded-full border border-white/[0.1]" />
      )}
    </>
  );
}

function UnauthNav() {
  const { signIn } = useAuthActions();
  return (
    <button
      onClick={() => void signIn("github")}
      className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
    >
      Sign in
    </button>
  );
}
