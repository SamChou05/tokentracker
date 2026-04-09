"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";

export default function CliTokenPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4">
      <Unauthenticated>
        <SignInPrompt />
      </Unauthenticated>
      <Authenticated>
        <TokenGenerator />
      </Authenticated>
    </main>
  );
}

function SignInPrompt() {
  const { signIn } = useAuthActions();
  return (
    <div className="text-center space-y-4">
      <h1 className="text-2xl font-bold">CLI Login</h1>
      <p className="text-gray-400">Sign in to generate a sync token for the CLI.</p>
      <button
        onClick={() => void signIn("github")}
        className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors cursor-pointer"
      >
        Sign in with GitHub
      </button>
    </div>
  );
}

function TokenGenerator() {
  const existingToken = useQuery(api.syncTokens.get);
  const generateToken = useMutation(api.syncTokens.generate);
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const displayToken = token ?? existingToken;

  const handleGenerate = async () => {
    const newToken = await generateToken();
    setToken(newToken);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (displayToken) {
      await navigator.clipboard.writeText(displayToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-lg w-full text-center space-y-6">
      <h1 className="text-2xl font-bold">CLI Sync Token</h1>
      <p className="text-gray-400">
        Use this token to link your local TokenPets CLI to your web profile.
      </p>

      {displayToken ? (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm break-all text-emerald-400">
            {displayToken}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm transition-colors cursor-pointer"
            >
              {copied ? "✓ Copied!" : "Copy token"}
            </button>
            <button
              onClick={handleGenerate}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors cursor-pointer"
            >
              Regenerate
            </button>
          </div>
          <div className="text-sm text-gray-500 space-y-2 text-left bg-gray-900 rounded-lg p-4">
            <p className="font-medium text-gray-300">In your terminal, run:</p>
            <code className="block text-emerald-400">
              tokenpets login
            </code>
            <p>Then paste this token when prompted.</p>
          </div>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
        >
          Generate Token
        </button>
      )}
    </div>
  );
}
