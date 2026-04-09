"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <Unauthenticated>
        <LandingContent />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedRedirect />
      </Authenticated>
    </main>
  );
}

function LandingContent() {
  const { signIn } = useAuthActions();

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24">
        <div className="max-w-2xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] text-xs text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Works with Claude Code
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-zinc-100">
            Your code evolves<br />digital creatures
          </h1>

          <p className="text-lg text-zinc-500 max-w-lg mx-auto">
            Every Claude session feeds a unique monster shaped by your project,
            language, and coding style. Install once, code as normal.
          </p>

          <div className="pt-4">
            <button
              onClick={() => void signIn("github")}
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors cursor-pointer"
            >
              <GitHubIcon />
              Continue with GitHub
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/[0.06] px-4 py-20">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06] rounded-xl overflow-hidden">
          <Feature
            title="Evolve"
            description="Your coding style shapes procedural creatures. Each project gets a unique monster."
          />
          <Feature
            title="Track"
            description="Tokens, sessions, and patterns tracked automatically via MCP. Zero manual work."
          />
          <Feature
            title="Collect"
            description="Rare languages and unusual patterns produce legendary creatures. Build your collection."
          />
        </div>
      </section>

      {/* Install */}
      <section className="border-t border-white/[0.06] px-4 py-20">
        <div className="max-w-lg mx-auto space-y-6 text-center">
          <h2 className="text-xl font-semibold text-zinc-200">Get started</h2>
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-5 font-mono text-sm text-left space-y-1.5">
            <Line prompt>npm install -g aimonsters</Line>
            <Line prompt>aimonsters init</Line>
            <Line prompt comment="your monster feeds automatically">claude</Line>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-zinc-600">
        AI Monsters
      </footer>
    </div>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-[#09090b] p-6 space-y-2">
      <h3 className="text-sm font-medium text-zinc-200">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}

function Line({ children, prompt, comment }: { children: string; prompt?: boolean; comment?: string }) {
  return (
    <div className="flex items-center gap-2">
      {prompt && <span className="text-zinc-600 select-none">$</span>}
      <span className="text-zinc-300">{children}</span>
      {comment && <span className="text-zinc-600 ml-1"># {comment}</span>}
    </div>
  );
}

function AuthenticatedRedirect() {
  const router = useRouter();
  useEffect(() => { router.push("/dashboard"); }, [router]);
  return <div className="flex-1 flex items-center justify-center text-zinc-500">Redirecting...</div>;
}

function GitHubIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}
