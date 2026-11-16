import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/studio/brand";

export default function NotFound() {
  return (
    <main id="main-content" className="studio-frame flex min-h-[85svh] items-center justify-center py-10">
      <section className="glass-panel w-full max-w-xl space-y-5 p-8 sm:p-12">
        <Brand />
        <p className="eyebrow">Error 404</p>
        <h1 className="workspace-heading">Page unavailable</h1>
        <p className="text-sm text-muted-foreground">The address may have changed. You can return home to find your workspace.</p>
        <Link href="/" className="studio-button"><ArrowLeft size={16} aria-hidden /> Go home</Link>
      </section>
    </main>
  );
}
