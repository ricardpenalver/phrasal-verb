import Link from "next/link";
import { SITE } from "@/site";

export default function Home() {
  return (
    <main className="mx-auto max-w-prose space-y-4 p-6">
      <h1 className="text-2xl font-semibold">{SITE.name}</h1>
      <p>{SITE.description} En construcción.</p>
      <p>
        <Link href="/practice" className="font-medium underline underline-offset-4">
          Practicar phrasal verbs
        </Link>
      </p>
    </main>
  );
}
