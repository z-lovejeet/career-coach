import Link from "next/link";
import { ArrowUpRight, BookOpen, MessageCircle, Route } from "lucide-react";
import { Brand } from "./brand";

const groups = [
  {
    title: "Prepare",
    links: [
      ["Your roadmap", "/roadmap"],
      ["Daily practice", "/tasks"],
      ["Mock interviews", "/interview"],
    ],
  },
  {
    title: "Your workspace",
    links: [
      ["Overview", "/dashboard"],
      ["Profile & resume", "/profile"],
      ["Progress", "/progress"],
    ],
  },
  {
    title: "Explore",
    links: [
      ["AI mentor", "/chat"],
      ["Opportunities", "/companies"],
      ["Get started", "/auth?mode=register"],
    ],
  },
];

export function SiteFooter({ workspace = false }: { workspace?: boolean }) {
  return (
    <footer
      className={`studio-frame liquid-footer ${workspace ? "liquid-footer-workspace" : ""}`}
      data-liquid-surface
    >
      <div className="footer-top">
        <div className="footer-invitation">
          <Brand href={workspace ? "/dashboard" : "/"} />
          <h2>
            Make room for
            <br />
            your next move.
          </h2>
          <p>
            A thoughtful space to build your skills,
            <br className="hidden sm:block" /> find your direction, and prepare
            well.
          </p>
          <Link
            href={workspace ? "/tasks" : "/auth?mode=register"}
            className="studio-button"
          >
            {workspace ? "Continue your practice" : "Find your starting point"}
            <ArrowUpRight size={16} aria-hidden />
          </Link>
        </div>
        <nav className="footer-directory glass-inset" aria-label="Footer">
          {groups.map((group) => (
            <div key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="footer-meta">
        <span>© {new Date().getFullYear()} CareerAI</span>
        <span className="footer-note">
          <BookOpen size={13} aria-hidden /> A little practice, every day.
        </span>
        <div className="footer-quicklinks">
          <Link href="/roadmap" aria-label="Your roadmap">
            <Route size={15} />
          </Link>
          <Link href="/chat" aria-label="Your mentor">
            <MessageCircle size={15} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
