"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CreatureArt } from "../../../components/CreatureArt";

const STAGE_NAMES: Record<number, string> = {
  0: "Egg", 1: "Blob", 2: "Blob", 3: "Sprite", 4: "Sprite",
  5: "Serpent", 6: "Serpent", 7: "Dragon", 8: "Dragon",
  9: "Dragon", 10: "Phoenix",
};

const STYLE_LABELS: Record<string, string> = {
  balanced: "Balanced", builder: "Builder", debugger: "Debugger",
  refactorer: "Refactorer", architect: "Architect",
};

const ELEMENT_ICONS: Record<string, string> = {
  electric: "⚡", nature: "🌿", metal: "⚙️", wind: "💨", fire: "🔥",
  crystal: "💎", earth: "🪨", void: "🌑", arcane: "✨", water: "🌊",
};

const ARCHETYPE_ICONS: Record<string, string> = {
  athletic: "💪", winged: "🪽", playful: "🎮", sentinel: "🛡️", cerebral: "🧠",
  crystalline: "💠", harmonic: "🎵", organic: "🧬", phantom: "👻", primal: "⚔️",
  radiant: "🌟", adaptive: "🔮",
};

export default function CreatureDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const creature = useQuery(api.creatures.getById, { id: id as any });

  if (creature === undefined) {
    return <div className="flex-1 flex items-center justify-center text-zinc-500">Loading...</div>;
  }

  if (creature === null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="text-4xl mb-4">👻</div>
        <h1 className="text-xl font-semibold mb-2">Creature not found</h1>
        <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-200 mt-4">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const stage = STAGE_NAMES[Math.min(creature.level, 10)] || "Phoenix";
  const progressPct = Math.round((creature.xpProgress ?? 0) * 100);
  const dna = creature.traitDna as any;

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
      {/* Back link */}
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        ← Back
      </Link>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Creature Art */}
        <div className="rounded-xl overflow-hidden border border-white/[0.08]">
          <CreatureArt
            dna={dna ?? null}
            level={creature.level}
            width={500}
            height={500}
          />
        </div>

        {/* Right: Details */}
        <div className="space-y-6">
          {/* Name & Level */}
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">{creature.name}</h1>
            <p className="text-zinc-500 mt-1">{stage} · Level {creature.level}</p>
          </div>

          {/* XP Bar */}
          <div>
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Level {creature.level}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* DNA Info */}
          {dna && (
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
              <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Trait DNA</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-zinc-500">Element:</span> {ELEMENT_ICONS[dna.element] || ""} {dna.element}</div>
                <div><span className="text-zinc-500">Type:</span> {ARCHETYPE_ICONS[dna.archetype] || ""} {dna.archetype}</div>
                <div><span className="text-zinc-500">Language:</span> {dna.primaryLanguage}</div>
                <div><span className="text-zinc-500">Form:</span> {dna.formModifier}</div>
                {dna.frameworks?.length > 0 && (
                  <div className="col-span-2"><span className="text-zinc-500">Frameworks:</span> {dna.frameworks.join(", ")}</div>
                )}
                <div className="col-span-2 text-xs text-zinc-600 font-mono">DNA #{dna.dnaHash}</div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Stats</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <Stat label="Total Tokens" value={creature.totalTokens.toLocaleString()} />
              <Stat label="Sessions" value={creature.totalSessions.toString()} />
              <Stat label="Tokens In" value={creature.totalTokensIn.toLocaleString()} />
              <Stat label="Tokens Out" value={creature.totalTokensOut.toLocaleString()} />
              <Stat label="Cost" value={`$${creature.totalCostUsd.toFixed(2)}`} />
              <Stat label="Tool Calls" value={creature.totalToolCalls.toLocaleString()} />
              <Stat label="Lines Added" value={`+${creature.totalLinesAdded.toLocaleString()}`} />
              <Stat label="Lines Removed" value={`-${creature.totalLinesRemoved.toLocaleString()}`} />
              <Stat label="Style" value={STYLE_LABELS[creature.codingStyle] || creature.codingStyle} />
              <Stat label="Success Rate" value={
                creature.totalSessions > 0
                  ? `${Math.round(creature.sessionsSuccess / creature.totalSessions * 100)}%`
                  : "—"
              } />
            </div>
          </div>

          {/* Repo Info */}
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Repository</h3>
            <div className="text-sm">
              <div><span className="text-zinc-500">Project ID:</span> {creature.projectId}</div>
              {creature.remoteUrl && (
                <div className="mt-1"><span className="text-zinc-500">Remote:</span> {creature.remoteUrl}</div>
              )}
            </div>
          </div>

          {/* Owner */}
          {creature.user && (
            <div className="flex items-center gap-3">
              {creature.user.image && (
                <img src={creature.user.image} alt="" className="w-8 h-8 rounded-full border border-white/[0.1]" />
              )}
              <div className="text-sm">
                <div className="text-zinc-300">{creature.user.name}</div>
                {creature.user.username && (
                  <Link href={`/u/${creature.user.username}`} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    @{creature.user.username}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-zinc-500">{label}:</span>{" "}
      <span className="text-zinc-300">{value}</span>
    </div>
  );
}
