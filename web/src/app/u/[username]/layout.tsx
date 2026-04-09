import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  return {
    title: `@${username} — TokenPets`,
    description: `Check out @${username}'s TokenPets collection. Creatures that evolve as you code with Claude.`,
    openGraph: {
      title: `@${username}'s TokenPets`,
      description: `Check out @${username}'s creature collection — evolved through coding with Claude.`,
      type: "profile",
      siteName: "TokenPets",
    },
    twitter: {
      card: "summary",
      title: `@${username}'s TokenPets`,
      description: `Check out @${username}'s creature collection — evolved through coding with Claude.`,
    },
  };
}

export default function ProfileLayout({ children }: Props) {
  return <>{children}</>;
}
