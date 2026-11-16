import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/server/db/supabase";
import { InterviewRoom } from "@/components/interview/room";

export const metadata: Metadata = { title: "Interview" };

export default async function InterviewPage({ params }: PageProps<"/interview/[id]">) {
  const { id } = await params;
  const { supabase, user } = (await getSession())!;
  const { data } = await supabase.from("interviews").select("*").eq("id", id).eq("profile_id", user.id).maybeSingle();
  if (!data) notFound();
  if (data.status !== "completed") data.state = { ...data.state, notes: undefined };
  return <InterviewRoom initial={data} />;
}
