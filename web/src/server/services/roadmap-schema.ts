import "server-only";
import { z } from "zod";

/** Validates a roadmap graph edited in the browser before it is saved. */
const link = z.object({ label: z.string().max(80), url: z.string().url().max(400), provider: z.string().max(40) });

export const nodeSchema = z.object({
  id: z.string().min(1).max(60),
  kind: z.enum(["course", "skill", "project", "milestone", "career"]),
  title: z.string().trim().min(1).max(160),
  description: z.string().max(1200).catch(""),
  phaseId: z.string().max(20),
  weeks: z.number().min(0).max(26),
  status: z.enum(["todo", "doing", "done"]),
  skillIds: z.array(z.string().max(40)).max(20).optional(),
  links: z.array(link).max(6).optional(),
  deliverable: z.string().max(400).optional(),
  why: z.string().max(500).optional(),
  custom: z.boolean().optional(),
});

export const graphSchema = z.object({
  summary: z.string().max(1500),
  totalWeeks: z.number().min(0).max(120),
  hoursPerWeek: z.number().min(1).max(80),
  phases: z.array(z.object({
    id: z.string().max(20), title: z.string().trim().min(1).max(120), goal: z.string().max(400),
    startWeek: z.number().min(1), weeks: z.number().min(1).max(60), milestone: z.string().max(400),
  })).min(1).max(10),
  nodes: z.array(nodeSchema).min(1).max(80),
  edges: z.array(z.object({ from: z.string().max(60), to: z.string().max(60) })).max(300),
  gaps: z.array(z.object({ id: z.string(), name: z.string(), required: z.number(), current: z.number(), importance: z.number(), gap: z.number() })).max(20),
  checks: z.array(z.object({ label: z.string(), passed: z.boolean(), detail: z.string() })).max(12),
});
