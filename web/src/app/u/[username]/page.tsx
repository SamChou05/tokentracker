"use client";

import { useQuery } from "convex/react";
import { CreatureArt } from "../../../components/CreatureArt";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";

const STAGE_NAMES: Record<number, string> = {
  0: "Egg", 1: "Blob", 2: "Blob", 3: "Sprite", 4: "Sprite",
  5: "Serpent", 6: "Serpent", 7: "Dragon", 8: "Dragon",
  9: "Dragon", 10: "Phoenix",
};

const STAGE_ICONS: Record<string, string> = {
  Egg: "🥚", Blob: "🟢", Sprite: "✨",
  Serpent: "🐍", Dragon: "🐉", Phoenix: "🔥",
};

const STYLE_LABELS: Record<string, string> = {
  balanced: "⚖️ Balanced", builder: "🏗️ Builder", debugger: "🔍 Debugger",
  refactorer: "♻️ Refactorer", architect: "📐 Architect",
};

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const profile = useQuery(api.profiles.getByUsername, { username });

  if (profile === undefined) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </main>
    );
  }

  if (profile === null) {
    return <NotFound username={username} />;
  }

  const { user, creatures, stats } = profile;

  return (
    <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-8">
      {/* Header */}
      <header className="flex items-center gap-6 pb-8 border-b border-gray-800">
        {user.image && (
          <img
            src={user.image}
            alt={user.name || username}
            className="w-20 h-20 rounded-full border-2 border-gray-700"
          />
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{user.name || username}</h1>
          <p className="text-gray-500">@{user.username}</p>
          {user.bio && <p className="text-gray-400 mt-1">{user.bio}</p>}
        </div>
      </header>

      {/* Stats bar */}
      <section className="grid grid-cols-4 gap-4 py-6 border-b border-gray-800">
        <StatCard label="Pets" value={stats.creatureCount.toString()} />
        <StatCard label="Highest Level" value={stats.highestLevel.toString()} />
        <StatCard label="Total Tokens" value={formatNumber(stats.totalTokens)} />
        <StatCard label="Sessions" value={stats.totalSessions.toString()} />
      </section>

      {/* Creatures */}
      <section className="py-8">
        <h2 className="text-xl font-semibold mb-6">Creature Collection</h2>

        {creatures.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">🥚</div>
            <p>No creatures yet — they&apos;re still hatching!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creatures.map((creature: any) => (
              <CreatureCard key={creature._id} creature={creature} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="pt-4 border-t border-gray-800 text-center">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          🐉 TokenPets — evolve your coding companion
        </Link>
      </footer>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function CreatureCard({ creature }: { creature: any }) {
  const stage = STAGE_NAMES[Math.min(creature.level, 10)] || "Phoenix";
  const icon = STAGE_ICONS[stage] || "🐉";
  const progressPct = Math.round((creature.xpProgress ?? 0) * 100);

  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] transition-colors">
      <CreatureArt
        dna={creature.traitDna ?? null}
        level={creature.level}
        width={400}
        height={300}
        className="w-full"
      />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              <h3 className="font-medium text-zinc-100">{creature.name}</h3>
            </div>
            <p className="text-xs text-zinc-500 mt-1">{stage} · Lv.{creature.level}</p>
          </div>
          <span className="text-xs text-zinc-600 font-mono">
            {STYLE_LABELS[creature.codingStyle] || creature.codingStyle}
          </span>
        </div>
        <div className="w-full bg-white/[0.06] rounded-full h-1">
          <div className="bg-emerald-500 h-1 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-xs text-zinc-500">
          <div>Tokens: {creature.totalTokens.toLocaleString()}</div>
          <div>Sessions: {creature.totalSessions}</div>
        </div>
      </div>
    </div>
  );
}

function NotFound({ username }: { username: string }) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="text-6xl">👻</div>
        <h1 className="text-2xl font-bold">User not found</h1>
        <p className="text-gray-400">
          No pet trainer named <span className="font-mono text-gray-300">@{username}</span> exists yet.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors"
        >
          Go to TokenPets
        </Link>
      </div>
    </main>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
