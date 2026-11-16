import "server-only";
import data from "./catalogue.json";
import titles from "./titles.json";

/** Compact O*NET 31.0 career facts (built by ml/src/features.py). */
export interface Career {
  title: string;
  family: string;
  description: string;
  jobZone: number;
  riasec: Record<string, number>;
  requirements: { id: string; name: string; importance: number; level: number | null }[];
  tasks: string[];
  technologies: string[];
  related: string[];
}

export const catalogue = data as unknown as Record<string, Career>;
const entries = Object.entries(catalogue);
const altTitles = titles as unknown as Record<string, string[]>;

export function career(code: string): Career | undefined {
  return catalogue[code];
}

export const JOB_ZONES: Record<number, string> = {
  1: "Little or no preparation",
  2: "Some preparation (high school)",
  3: "Medium preparation (diploma / vocational)",
  4: "Considerable preparation (bachelor's degree)",
  5: "Extensive preparation (graduate degree)",
};

/**
 * Career search over official titles, O*NET alternate job titles (e.g. "Machine Learning Engineer"
 * → Computer and Information Research Scientists), descriptions and technologies.
 */
export function searchCareers(query: string, limit = 8) {
  const q = query.toLowerCase().trim();
  const terms = q.split(/[^a-z0-9+#.]+/).filter((t) => t.length > 1);
  if (!terms.length) return [];
  return entries
    .map(([code, c]) => {
      const title = c.title.toLowerCase();
      const alts = (altTitles[code] ?? []).map((t) => t.toLowerCase());
      let score = 0;
      if (title === q) score += 100;
      else if (alts.includes(q)) score += 80;
      if (title.includes(q)) score += 40;
      else if (alts.some((a) => a.includes(q))) score += 30;
      for (const t of terms) {
        if (title.includes(t)) score += 5;
        if (alts.some((a) => a.includes(t))) score += 2;
        if (c.description.toLowerCase().includes(t)) score += 1;
      }
      return { code, title: c.title, family: c.family, score, matchedTitle: alts.find((a) => a === q || a.includes(q)) };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Compact text description for prompts. */
export function careerBrief(code: string): string {
  const c = catalogue[code];
  if (!c) return "";
  return [
    `${c.title} (O*NET ${code}, ${c.family}, job zone ${c.jobZone})`,
    c.description,
    `Key requirements: ${c.requirements.map((r) => r.name).join(", ")}`,
    c.technologies.length ? `Technologies: ${c.technologies.slice(0, 8).join(", ")}` : "",
    c.tasks.length ? `Typical tasks: ${c.tasks.slice(0, 3).join(" ")}` : "",
  ].filter(Boolean).join("\n");
}
