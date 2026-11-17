import type { Metadata } from "next";
import { toPublicItem } from "@/content/items";
import { phrasalVerbBank } from "@/content/phrasal-verbs";
import { SITE } from "@/site";
import { PracticeSession } from "./practice-session";

export const metadata: Metadata = {
  title: `Practicar phrasal verbs · ${SITE.name}`,
};

export default function PracticePage() {
  // Only public fields cross to the client: answers stay on the server.
  const items = phrasalVerbBank.map(toPublicItem);

  return (
    <main className="mx-auto max-w-prose space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Practicar phrasal verbs</h1>
      <PracticeSession items={items} />
    </main>
  );
}
