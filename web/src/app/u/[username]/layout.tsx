import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  return {
    title: `@${username} — AI Monsters`,
    description: `Check out @${username}'s AI Monster collection. Creatures that evolve as you code with Claude.`,
    openGraph: {
      title: `@${username}'s AI Monsters`,
      description: `Check out @${username}'s creature collection — evolved through coding with Claude.`,
      type: "profile",
      siteName: "AI Monsters",
    },
    twitter: {
      card: "summary",
      title: `@${username}'s AI Monsters`,
      description: `Check out @${username}'s creature collection — evolved through coding with Claude.`,
    },
  };
}

export default function ProfileLayout({ children }: Props) {
  return <>{children}</>;
}
