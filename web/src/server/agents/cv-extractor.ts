import "server-only";
import { z } from "zod";
import { completeJSON } from "@/server/ai/groq";
import { TTL } from "@/server/ai/cache";
import {
  academicsSchema, certificationSchema, educationSchema, experienceSchema, projectSchema, scrubContact, skillSchema,
} from "@/server/services/profile-schema";

/**
 * CV Extractor agent.
 *  - Text CVs: the browser extracts text with pdf.js and we send only the text.
 *  - Scanned CVs: the browser renders pages to images; qwen3.8-27b (vision) does OCR + extraction.
 * Contact details are scrubbed before the model sees the text and again from the output.
 */

const cvSchema = z.object({
  full_name: z.string().catch(""),
  headline: z.string().catch(""),
  education: educationSchema,
  academics: academicsSchema,
  skills: z.array(skillSchema.catch(null as never)).catch([]).transform((a) => a.filter(Boolean)),
  projects: z.array(projectSchema.catch(null as never)).catch([]).transform((a) => a.filter(Boolean)),
  experience: z.array(experienceSchema.catch(null as never)).catch([]).transform((a) => a.filter(Boolean)),
  certifications: z.array(certificationSchema.catch(null as never)).catch([]).transform((a) => a.filter(Boolean)),
  achievements: z.array(z.string()).catch([]),
  interests: z.array(z.string()).catch([]),
  targetRoles: z.array(z.string()).catch([]),
});

export type CvExtract = z.infer<typeof cvSchema>;

const SYSTEM = `You extract career information from a student's CV into JSON.
Rules:
- Use only facts present in the CV. Leave a field empty ("" or []) when it is not stated.
- NEVER output phone numbers, e-mail addresses, home addresses, dates of birth or social profile links.
- skills: every technical skill, tool, programming language and soft skill. level 1-5 from evidence
  (1 = mentioned once, 3 = used in a project/course, 5 = professional depth). category: technical | tool | soft | language.
- academics.coursework: subjects/courses studied. strongSubjects only if grades or awards show it.
- education: the highest / current qualification. currentYear like "3rd year" if inferable from dates.
- headline: one short line describing the student, e.g. "B.Tech CSE (AI & ML) student building ML projects".
- projects.link: only project/demo/repository URLs.
Return exactly this JSON shape:
{"full_name":"","headline":"","education":{"level":"","degree":"","branch":"","institution":"","currentYear":"","graduationYear":"","cgpa":""},
"academics":{"strongSubjects":[],"weakSubjects":[],"coursework":[]},
"skills":[{"name":"","level":3,"category":"technical"}],
"projects":[{"title":"","description":"","tech":[],"link":""}],
"experience":[{"role":"","organization":"","type":"internship","duration":"","description":""}],
"certifications":[{"name":"","issuer":"","year":""}],
"achievements":[],"interests":[],"targetRoles":[]}`;

export async function extractFromText(raw: string) {
  const cv = scrubContact(raw).replace(/\s+\n/g, "\n").slice(0, 14_000);
  const { data, meta } = await completeJSON({
    tier: "reasoning",
    system: SYSTEM,
    prompt: `CV text:\n"""\n${cv}\n"""`,
    schema: cvSchema,
    maxTokens: 2600,
    temperature: 0.1,
    cache: { namespace: "cv", key: [cv], ttl: TTL.week },
  });
  return { data: clean(data), meta };
}

export async function extractFromImages(images: string[]) {
  const { data, meta } = await completeJSON({
    tier: "vision",
    system: SYSTEM,
    prompt: "These images are the pages of a CV. Read all text carefully (OCR) and extract the JSON.",
    images: images.slice(0, 3),
    schema: cvSchema,
    maxTokens: 2600,
    temperature: 0.1,
  });
  return { data: clean(data), meta };
}

function clean(data: CvExtract): CvExtract {
  const s = (v: string) => scrubContact(v);
  return {
    ...data,
    full_name: data.full_name.slice(0, 120),
    headline: s(data.headline).slice(0, 160),
    projects: data.projects.map((p) => ({ ...p, description: s(p.description) })),
    experience: data.experience.map((e) => ({ ...e, description: s(e.description) })),
    achievements: data.achievements.map(s).filter((a) => a && !a.includes("[removed]")).slice(0, 20),
  };
}
