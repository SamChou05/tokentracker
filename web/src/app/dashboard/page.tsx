"use client";

import { useQuery } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { CreatureArt } from "../../components/CreatureArt";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";

export default function Dashboard() {
  return (
    <>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
      <Authenticated>
        <DashboardContent />
      </Authenticated>
    </>
  );
}

function UnauthenticatedRedirect() {
  const router = useRouter();
  router.push("/");
  return <div className="p-8 text-gray-400">Redirecting to sign in...</div>;
}

function DashboardContent() {
  const user = useQuery(api.users.viewer);
  const creatures = useQuery(api.users.userCreatures);

  if (user === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-8">
      {/* Header */}
      <header className="flex items-center gap-4 pb-8 border-b border-white/[0.06]">
        {user?.image && (
          <img
            src={user.image}
            alt={user.name || "Avatar"}
            className="w-12 h-12 rounded-full border border-white/[0.1]"
          />
        )}
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">{user?.name || "TokenPets Trainer"}</h1>
          <p className="text-sm text-zinc-500">
            {(user as any)?.username ? `@${(user as any).username}` : user?.email}
          </p>
        </div>
      </header>

      {/* Creature Collection */}
      <section className="py-8">
        <h2 className="text-lg font-semibold text-zinc-200 mb-6">Your Pets</h2>

        {creatures === undefined ? (
          <div className="text-gray-500">Loading creatures...</div>
        ) : creatures.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creatures.map((creature) => (
              <CreatureCard key={creature._id} creature={creature} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-4 border border-dashed border-white/[0.08] rounded-xl">
      <div className="text-4xl mb-4">🥚</div>
      <h3 className="text-base font-medium text-zinc-200 mb-2">No pets yet</h3>
      <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
        Install the CLI and start coding with Claude to hatch your first creature.
      </p>
      <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 inline-block text-left font-mono text-sm">
        <div className="text-zinc-400">$ <span className="text-zinc-300">npm install -g tokenpets</span></div>
        <div className="text-zinc-400">$ <span className="text-zinc-300">tokenpets init</span></div>
        <div className="text-zinc-400">$ <span className="text-zinc-300">tokenpets login</span></div>
      </div>
    </div>
  );
}

function CreatureCard({ creature }: { creature: any }) {
  const STAGE_NAMES: Record<number, string> = {
    0: "Egg", 1: "Blob", 2: "Blob", 3: "Sprite", 4: "Sprite",
    5: "Serpent", 6: "Serpent", 7: "Dragon", 8: "Dragon",
    9: "Dragon", 10: "Phoenix",
  };

  const STAGE_ICONS: Record<string, string> = {
    Egg: "🥚", Blob: "🟢", Sprite: "✨",
    Serpent: "🐍", Dragon: "🐉", Phoenix: "🔥",
  };

  const stage = STAGE_NAMES[Math.min(creature.level, 10)] || "Phoenix";
  const icon = STAGE_ICONS[stage] || "🐉";
  const progressPct = Math.round(creature.xpProgress * 100);

  return (
    <Link href={`/creature/${creature._id}`} className="block rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] transition-colors cursor-pointer">
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
          <span className="text-xs text-zinc-600 font-mono">{creature.codingStyle}</span>
        </div>
        <div className="w-full bg-white/[0.06] rounded-full h-1">
          <div className="bg-emerald-500 h-1 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-xs text-zinc-500">
          <div>Tokens: {creature.totalTokens.toLocaleString()}</div>
          <div>Sessions: {creature.totalSessions}</div>
        </div>
      </div>
    </Link>
  );
}
