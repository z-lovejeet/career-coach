import type { Metadata } from "next";
import { getSession } from "@/server/db/supabase";
import { career } from "@/server/onet/catalogue";
import { PageHeader } from "@/components/ui/primitives";
import { InterviewSetup } from "@/components/interview/setup";

export const metadata: Metadata = { title: "Interviews" };

export default async function InterviewsPage() {
  const { supabase, user } = (await getSession())!;
  const [{ data: profile }, { data: roadmap }, { data: companies }, { data: history }] = await Promise.all([
    supabase.from("profiles").select("goals").eq("id", user.id).single(),
    supabase.from("roadmaps").select("target").eq("profile_id", user.id).eq("status", "active").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("company_suggestions").select("data").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("interviews").select("id, config, score, status, created_at").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);
  const role = profile?.goals?.targetRoles?.[0] ?? (roadmap?.target?.code ? career(roadmap.target.code)?.title : undefined) ?? "Software Engineer";
  const companyNames = [...new Set([...(profile?.goals?.dreamCompanies ?? []), ...((companies?.data ?? []) as { name: string }[]).map((c) => c.name)])].slice(0, 10);

  return (
    <>
      <PageHeader eyebrow="Interviews" title="Mock interviews that feel real" description="Choose the company, role and difficulty. The interviewer adapts to every answer — probing when you're vague, moving on when you're solid — and the panel scores you at the end." />
      <InterviewSetup defaults={{ role, companies: companyNames }} history={history ?? []} />
    </>
  );
}
