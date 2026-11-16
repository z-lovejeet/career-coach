import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLegacyGuestEmail } from "@/lib/supabase/legacy-guest";
import { WorkspaceShell } from "@/components/studio/workspace-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || isLegacyGuestEmail(user.email)) redirect("/auth");

  const metadataName = user.user_metadata?.full_name;
  const name = user.is_anonymous
    ? "Guest"
    : (typeof metadataName === "string" ? metadataName.trim() : "") || user.email?.split("@")[0] || "Your account";

  return <WorkspaceShell key={user.id} name={name} guest={Boolean(user.is_anonymous)}>{children}</WorkspaceShell>;
}
