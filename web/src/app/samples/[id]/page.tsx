import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/server/db/supabase";
import { Brand } from "@/components/brand";
import { buttonClass } from "@/components/ui/primitives";
import { RoadmapWorkspace } from "@/components/roadmap/workspace";
import type { Roadmap } from "@/lib/types";

export const metadata: Metadata = { title: "Sample roadmap" };
export const dynamic = "force-dynamic";

export default async function SamplePage({ params }: PageProps<"/samples/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("roadmaps").select("*").eq("id", id).eq("is_sample", true).maybeSingle();
  if (!data) notFound();
  const persona = data.sample_persona as { name: string; background: string; matches?: { title: string; match: number }[] } | null;
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-6">
        <Brand />
        <Link href="/login?mode=signup" className={buttonClass("primary", "sm")}>Make my own</Link>
      </header>
      <main className="mx-auto max-w-[1240px] px-6 pb-20">
        <Link href="/samples" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" /> All samples</Link>
        {persona && (
          <div className="mb-8 rounded-[14px] border border-line bg-surface-2 p-5">
            <p className="eyebrow">Input — student profile</p>
            <p className="mt-2 text-[15px] font-medium text-ink">{persona.name}</p>
            <p className="mt-1 text-sm text-muted">{persona.background}</p>
            {persona.matches && <p className="mt-3 text-xs text-muted">Career model top matches: {persona.matches.map((m) => `${m.title} (${m.match}%)`).join(" · ")}</p>}
          </div>
        )}
        <RoadmapWorkspace initial={data as Roadmap} revisions={[]} readOnly />
      </main>
    </div>
  );
}
