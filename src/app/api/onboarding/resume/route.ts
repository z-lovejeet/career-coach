import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { readResumeWithGemini } from '@/lib/agents/resume';
import { createClient } from '@/lib/supabase/server';
import { enforceAIQuota } from '@/lib/supabase/ai-quota';
import { getResumePath, isPdf, MAX_RESUME_BYTES, openResumeStream, readBoundedStream, RESUME_BUCKET, RESUME_ENDPOINT } from '@/lib/supabase/resume';

const MAX_MULTIPART_BYTES = MAX_RESUME_BYTES + 64 * 1024;
const extractionPrompt = `Extract only information supported by the attached resume. Return a JSON object with these fields:
{
  "full_name": "",
  "skills": ["technical or soft skill"],
  "skill_ratings": { "skillName": 5 },
  "projects": [{ "name": "", "tech": [], "description": "", "url": "" }],
  "education_level": "High School|Diploma|B.Tech / B.E.|B.Sc|BCA|M.Tech / M.E.|M.Sc|MCA|MBA|PhD|Other",
  "field_of_study": "",
  "experience_level": "fresher|intern|0-1|1-3|3+",
  "preferred_role": "",
  "summary": ""
}
Rate skills from 1 to 10 based on evidence. Leave unsupported fields empty.`;

function failure(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

async function currentResume() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { response: failure(401, 'unauthorized', 'Sign in to manage your resume.') };
  const { data: profile, error } = await supabase.from('profiles').select('resume_url').eq('id', user.id).maybeSingle();
  if (error) return { response: failure(503, 'profile_unavailable', 'Your profile is temporarily unavailable.') };
  if (!profile) return { response: failure(404, 'no_profile', 'Your candidate profile could not be found.') };
  const reference: string | null = profile.resume_url;
  return { supabase, user, reference };
}

const asText = (value: unknown, max = 300) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const asStrings = (value: unknown, max = 50) => Array.isArray(value) ? value.slice(0, max).map((item) => asText(item, 80)).filter(Boolean) : [];

function parseExtraction(text: string) {
  if (!text) return null;
  const value: unknown = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/gi, ''));
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const ratings = raw.skill_ratings && typeof raw.skill_ratings === 'object' && !Array.isArray(raw.skill_ratings)
    ? Object.entries(raw.skill_ratings).slice(0, 50).filter(([name, rating]) => name.length <= 80 && typeof rating === 'number' && Number.isFinite(rating))
    : [];
  const projects = Array.isArray(raw.projects) ? raw.projects.slice(0, 12).flatMap((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const project = entry as Record<string, unknown>;
    const name = asText(project.name, 120);
    const url = asText(project.url, 400);
    if (!name) return [];
    return [{ name, tech: asStrings(project.tech ?? project.tech_stack, 12), description: asText(project.description), url: /^https?:\/\//i.test(url) ? url : '' }];
  }) : [];

  return {
    full_name: asText(raw.full_name, 120),
    skills: asStrings(raw.skills),
    skill_ratings: Object.fromEntries(ratings.map(([name, rating]) => [name, Math.max(1, Math.min(10, Math.round(rating as number)))])),
    projects,
    education_level: asText(raw.education_level, 80),
    field_of_study: asText(raw.field_of_study, 80),
    experience_level: asText(raw.experience_level, 20),
    preferred_role: asText(raw.preferred_role, 120),
    summary: asText(raw.summary, 1200),
  };
}

export async function GET() {
  try {
    const context = await currentResume();
    if (context.response) return context.response;
    const { supabase, user, reference } = context;
    const pdf = await openResumeStream(supabase, reference, user.id, 30000);
    if (!pdf) return failure(404, 'resume_not_found', 'An attached PDF could not be found.');

    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return failure(503, 'download_failed', 'Your resume is temporarily unavailable.');
  }
}

export async function POST(request: Request) {
  try {
    const context = await currentResume();
    if (context.response) return context.response;
    const { supabase, user, reference } = context;
    const contentType = request.headers.get('content-type');
    if (!contentType?.toLowerCase().startsWith('multipart/form-data;')) {
      return failure(400, 'invalid_upload', 'Select a PDF file to upload.');
    }
    const tooLarge = () => failure(413, 'file_too_large', 'Upload a PDF of 4 MB or smaller.');
    if (Number(request.headers.get('content-length')) > MAX_MULTIPART_BYTES) return tooLarge();
    const multipart = await readBoundedStream(request.body, MAX_MULTIPART_BYTES);
    if (!multipart) return tooLarge();

    const formData = await new Response(new Uint8Array(multipart), { headers: { 'Content-Type': contentType } }).formData().catch(() => null);
    const file = formData?.get('resume');
    if (!(file instanceof File)) return failure(400, 'no_file', 'Select a PDF file to upload.');
    if (file.size > MAX_RESUME_BYTES) return tooLarge();
    const pdf = Buffer.from(await file.arrayBuffer());
    if (!isPdf(pdf)) return failure(400, 'invalid_type', 'Only PDF files are accepted.');

    const quota = await enforceAIQuota(supabase, 'resume');
    if (quota) return quota;

    const bucket = supabase.storage.from(RESUME_BUCKET);
    const path = `${user.id}/${randomUUID()}.pdf`;
    const { error: uploadError } = await bucket.upload(path, pdf, { contentType: 'application/pdf', cacheControl: '0' });
    if (uploadError) return failure(503, 'upload_failed', 'The PDF could not be saved. Please try again.');

    const update = supabase.from('profiles').update({ resume_url: path, updated_at: new Date().toISOString() }).eq('id', user.id);
    const { data: saved, error: saveError } = await (reference === null ? update.is('resume_url', null) : update.eq('resume_url', reference)).select('id').maybeSingle();
    if (saveError) {
      // A network failure can hide a committed write. Check before deleting the uploaded object.
      const { data: profile, error } = await supabase.from('profiles').select('resume_url').eq('id', user.id).maybeSingle();
      if (error || profile?.resume_url !== path) {
        if (!error) await bucket.remove([path]);
        return failure(503, 'attachment_failed', 'The PDF could not be attached. Please try again.');
      }
    } else if (!saved) {
      await bucket.remove([path]);
      return failure(409, 'resume_changed', 'Your resume changed during the upload. Refresh and try again.');
    }

    const oldPath = getResumePath(reference, user.id);
    if (oldPath) {
      try {
        const { error } = await bucket.remove([oldPath]);
        if (error) throw error;
      } catch {
        console.warn('[Resume] Replaced file cleanup failed.');
      }
    }

    let analysis = null;
    try {
      analysis = parseExtraction(await readResumeWithGemini(pdf, extractionPrompt, true));
    } catch {
      console.warn('[Resume] Could not parse the extraction result.');
    }

    return NextResponse.json({ success: true, data: { resume_url: RESUME_ENDPOINT, analysis } });
  } catch {
    return failure(503, 'upload_failed', 'The PDF could not be saved. Please try again.');
  }
}

export async function DELETE() {
  try {
    const context = await currentResume();
    if (context.response) return context.response;
    const { supabase, user, reference } = context;
    if (reference) {
      const path = getResumePath(reference, user.id);
      if (path) {
        const { error } = await supabase.storage.from(RESUME_BUCKET).remove([path]);
        if (error) return failure(503, 'delete_failed', 'The PDF could not be removed. Please try again.');
      }
      const { data: profile, error } = await supabase.from('profiles')
        .update({ resume_url: null, updated_at: new Date().toISOString() })
        .eq('id', user.id).eq('resume_url', reference).select('id').maybeSingle();
      if (error) return failure(503, 'detach_failed', 'The PDF could not be detached. Please try again.');
      if (!profile) {
        const { data: current, error: readError } = await supabase.from('profiles')
          .select('resume_url').eq('id', user.id).maybeSingle();
        if (readError || current?.resume_url) {
          return failure(409, 'resume_changed', 'Your resume changed during removal. Refresh and try again.');
        }
      }
    }
    return NextResponse.json({ success: true, data: { resume_url: null } });
  } catch {
    return failure(503, 'delete_failed', 'The PDF could not be removed. Please try again.');
  }
}
