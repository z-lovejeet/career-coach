import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/server/db/supabase";
import { RoadmapWorkspace } from "@/components/roadmap/workspace";
import type { Roadmap } from "@/lib/types";

export const metadata: Metadata = { title: "Roadmap" };

export default async function RoadmapPage({ params }: PageProps<"/roadmap/[id]">) {
  const { id } = await params;
  const { supabase, user } = (await getSession())!;
  const [{ data }, { data: revisions }] = await Promise.all([
    supabase.from("roadmaps").select("*").eq("id", id).eq("profile_id", user.id).maybeSingle(),
    supabase.from("roadmap_revisions").select("version, note, created_at").eq("roadmap_id", id).order("version", { ascending: false }).limit(20),
  ]);
  if (!data) notFound();
  return <RoadmapWorkspace initial={data as Roadmap} revisions={revisions ?? []} />;
}
