import type { Metadata } from "next";
import { getSession } from "@/server/db/supabase";
import { modelInfo } from "@/server/ml/matcher";
import { ProfileView } from "@/components/profile/profile-view";
import type { CareerMatch, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { supabase, user } = (await getSession())!;
  const [{ data: profile }, { data: matches }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("career_matches").select("matches, created_at, model_version").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return (
    <ProfileView
      profile={profile as Profile}
      matches={(matches?.matches ?? []) as CareerMatch[]}
      model={{ version: modelInfo.version, onet: modelInfo.onetVersion, metrics: modelInfo.metrics }}
    />
  );
}
