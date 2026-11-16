import "server-only";
import { z } from "zod";

const text = (max: number) => z.string().trim().max(max).catch("");
const list = (max: number, itemMax = 80) => z.array(z.string().trim().max(itemMax)).max(max).catch([]).transform((a) => a.filter(Boolean));

export const educationSchema = z.object({
  level: text(60), degree: text(80), branch: text(120), institution: text(160),
  currentYear: text(40), graduationYear: text(10), cgpa: text(16),
}).partial().catch({});

export const academicsSchema = z.object({
  strongSubjects: list(25), weakSubjects: list(25), coursework: list(40),
}).partial().catch({});

export const skillSchema = z.object({
  name: z.string().trim().min(1).max(60),
  level: z.coerce.number().int().min(1).max(5).catch(3),
  category: z.enum(["technical", "tool", "soft", "language"]).catch("technical"),
});

export const projectSchema = z.object({
  title: z.string().trim().min(1).max(120), description: text(600), tech: list(15, 40),
  link: z.string().trim().max(300).catch("").transform((v) => (/^https?:\/\//i.test(v) ? v : "")),
});

export const experienceSchema = z.object({
  role: z.string().trim().min(1).max(120), organization: text(120), type: text(30), duration: text(60), description: text(600),
});

export const certificationSchema = z.object({ name: z.string().trim().min(1).max(160), issuer: text(120), year: text(10) });

export const interestsSchema = z.object({
  riasec: z.record(z.string(), z.number().min(0).max(1)).catch({}),
  answers: z.record(z.string(), z.number().int().min(1).max(5)).catch({}),
  areas: list(20, 60),
}).partial().catch({});

export const goalsSchema = z.object({
  targetRoles: list(8, 80), dreamCompanies: list(10, 80), industries: list(10, 60), locations: list(8, 60),
  path: z.enum(["job", "higher_studies", "entrepreneurship", "unsure"]).catch("job"),
  hoursPerWeek: z.coerce.number().min(2).max(60).catch(10),
  timelineMonths: z.coerce.number().int().min(1).max(24).catch(6),
  notes: text(600),
}).partial().catch({});

/** Fields a student may update. Contact details have no column, so they can't be stored. */
export const profileUpdateSchema = z.object({
  full_name: z.string().trim().max(120),
  headline: z.string().trim().max(160),
  education: educationSchema,
  academics: academicsSchema,
  skills: z.array(skillSchema).max(60),
  projects: z.array(projectSchema).max(15),
  experience: z.array(experienceSchema).max(15),
  certifications: z.array(certificationSchema).max(20),
  achievements: z.array(z.string().trim().max(240)).max(20),
  interests: interestsSchema,
  goals: goalsSchema,
}).partial();

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

/** Remove e-mail addresses, phone numbers and street-style addresses from free text. */
export function scrubContact(value: string): string {
  return value
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[removed]")
    .replace(/(\+?\d[\d\s().-]{8,}\d)/g, (m) => (m.replace(/\D/g, "").length >= 9 ? "[removed]" : m))
    .replace(/\b(linkedin\.com\/in\/|wa\.me\/)\S+/gi, "[removed]");
}
