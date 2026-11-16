import { redirect } from "next/navigation";
import { getSession } from "@/server/db/supabase";
import { AppShell } from "@/components/app-shell";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { data: profile } = await session.supabase
    .from("profiles")
    .select("full_name, onboarding_complete, education")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!profile?.onboarding_complete) redirect("/onboarding");

  const name = profile.full_name || session.user.user_metadata?.full_name || "Student";
  const subtitle = [profile.education?.degree, profile.education?.branch].filter(Boolean).join(" · ");
  return <AppShell name={name} subtitle={subtitle}>{children}</AppShell>;
}
