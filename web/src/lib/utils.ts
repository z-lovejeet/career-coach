import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function pluralize(count: number, word: string, plural = `${word}s`) {
  return `${count} ${count === 1 ? word : plural}`;
}

export function initials(name?: string | null) {
  return (name ?? "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "·";
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
export function timeAgo(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [[60, "second"], [60, "minute"], [24, "hour"], [7, "day"], [4.35, "week"], [12, "month"]];
  let value = diff;
  for (const [size, unit] of steps) {
    if (Math.abs(value) < size) return relative.format(Math.round(value), unit);
    value /= size;
  }
  return relative.format(Math.round(value), "year");
}

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Search links for courses — never invented URLs. */
export function courseSearchLinks(query: string) {
  const q = encodeURIComponent(query);
  return [
    { provider: "NPTEL", label: "Search NPTEL", url: `https://nptel.ac.in/courses?searchText=${q}` },
    { provider: "Coursera", label: "Search Coursera", url: `https://www.coursera.org/search?query=${q}` },
    { provider: "YouTube", label: "Search YouTube", url: `https://www.youtube.com/results?search_query=${q}+full+course` },
  ];
}
