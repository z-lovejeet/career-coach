import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/server/db/supabase";
import type { Profile } from "@/lib/types";
import { Wizard } from "./wizard";

export const metadata: Metadata = { title: "Set up your profile" };

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const { data } = await session.supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
  const profile = (data ?? { id: session.user.id }) as Profile;
  if (profile.onboarding_complete) redirect("/dashboard");
  return <Wizard initial={{ ...profile, full_name: profile.full_name || session.user.user_metadata?.full_name || "" }} />;
}
