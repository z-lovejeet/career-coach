import type { SupabaseClient } from '@supabase/supabase-js';

export const RESUME_ENDPOINT = '/api/onboarding/resume';
export const RESUME_BUCKET = 'resumes';
export const MAX_RESUME_BYTES = 4 * 1024 * 1024;

export function getResumePath(reference: unknown, ownerId: string): string | null {
  if (typeof reference !== 'string' || !reference) return null;
  let path = reference;

  // Existing records may contain links issued by the same private Storage bucket.
  if (/^https?:\/\//i.test(reference)) {
    try {
      const storage = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
      const url = new URL(reference);
      if (url.origin !== storage.origin || url.username || url.password) return null;
      const base = `${storage.pathname.replace(/\/+$/, '')}/storage/v1/object/`;
      const prefix = [`${base}sign/${RESUME_BUCKET}/`, `${base}public/${RESUME_BUCKET}/`]
        .find((candidate) => url.pathname.startsWith(candidate));
      if (!prefix) return null;
      path = decodeURIComponent(url.pathname.slice(prefix.length));
    } catch {
      return null;
    }
  }

  const [folder, filename, ...remaining] = path.split('/');
  if (folder !== ownerId || !filename || remaining.length || /[\\\x00-\x1f\x7f]/.test(filename)) return null;
  if (filename === '.' || filename === '..') return null;
  return path;
}

export function isPdf(bytes: Buffer) {
  return bytes.length >= 5 && bytes.subarray(0, 5).toString('ascii') === '%PDF-';
}

export async function readBoundedStream(stream: ReadableStream<Uint8Array> | null, maxBytes: number) {
  if (!stream) return null;
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return Buffer.concat(chunks, size);
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}

export async function openResumeStream(supabase: SupabaseClient, reference: unknown, ownerId: string, timeoutMs = 12000) {
  const path = getResumePath(reference, ownerId);
  if (!path) return null;
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const { data, error } = await supabase.storage.from(RESUME_BUCKET)
    .download(encodedPath, {}, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) }).asStream();
  return error ? null : data;
}

export async function downloadResume(supabase: SupabaseClient, reference: unknown, ownerId: string) {
  const stream = await openResumeStream(supabase, reference, ownerId);
  const pdf = await readBoundedStream(stream, MAX_RESUME_BYTES);
  return pdf && isPdf(pdf) ? pdf : null;
}
