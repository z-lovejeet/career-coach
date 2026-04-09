import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callGemini } from '@/lib/agents/gemini';

const RESUME_ANALYZER_PROMPT = `You are an expert Resume Analyzer AI. Your job is to extract structured data from resume text.

RULES:
- Extract ALL technical and soft skills mentioned
- For each skill, estimate a proficiency level (1-10) based on how it's presented:
  - Mentioned once / basic = 3-4
  - Used in projects / some experience = 5-6
  - Strong experience / certifications = 7-8
  - Expert / lead role / teaching = 9-10
- Extract ALL projects with their name, tech stack, and description
- Identify the education level, field of study, and experience level
- Identify preferred role based on resume content (most likely job target)
- Be thorough — don't miss any skills or projects

IMPORTANT: Return ONLY valid JSON matching the schema below. No markdown.`;

const RESUME_OUTPUT_SCHEMA = `{
  "skills": ["skill1", "skill2", ...],
  "skill_ratings": { "skill1": 7, "skill2": 5, ... },
  "projects": [
    {
      "name": "Project Name",
      "tech": ["React", "Node.js"],
      "description": "Brief description of what was built",
      "url": ""
    }
  ],
  "education_level": "B.Tech" | "M.Tech" | "BCA" | "MCA" | "B.Sc" | "M.Sc" | "PhD" | "Diploma" | "",
  "field_of_study": "Computer Science" | "IT" | "Electronics" | "Mechanical" | etc,
  "experience_level": "fresher" | "intern" | "1-3 years" | "3-5 years" | "5+ years",
  "preferred_role": "Software Engineer" | "Frontend Developer" | "Backend Developer" | "Full Stack Developer" | "Data Scientist" | etc,
  "full_name": "Name extracted from resume or empty string",
  "summary": "Brief 1-2 sentence summary of the candidate"
}`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'unauthorized', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'no_file', message: 'No resume file provided' } },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: { code: 'invalid_type', message: 'Only PDF files are accepted' } },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: { code: 'upload_failed', message: uploadError.message } },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(uploadData.path);

    // 2. Extract text from PDF
    let resumeText = '';
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = await import('pdf-parse') as any;
      const pdfParse = mod.default || mod;
      const pdfData = await pdfParse(buffer);
      resumeText = pdfData.text || '';
    } catch (parseErr) {
      console.warn('PDF text extraction failed:', parseErr);
      return NextResponse.json(
        { success: false, error: { code: 'parse_failed', message: 'Could not extract text from PDF. Please ensure it is a text-based PDF, not a scanned image.' } },
        { status: 422 }
      );
    }

    if (!resumeText.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'empty_pdf', message: 'No text found in PDF. It may be image-based — please use a text-based resume.' } },
        { status: 422 }
      );
    }

    // 3. Analyze resume with Gemini AI
    const userPrompt = `Analyze this resume and extract structured data:

RESUME TEXT:
${resumeText.substring(0, 6000)}

Respond with JSON matching this schema:
${RESUME_OUTPUT_SCHEMA}`;

    const analysis = await callGemini<{
      skills: string[];
      skill_ratings: Record<string, number>;
      projects: Array<{ name: string; tech: string[]; description: string; url: string }>;
      education_level: string;
      field_of_study: string;
      experience_level: string;
      preferred_role: string;
      full_name: string;
      summary: string;
    }>({
      systemPrompt: RESUME_ANALYZER_PROMPT,
      userPrompt,
      jsonMode: true,
      temperature: 0.3,
      maxTokens: 4096,
    });

    // 4. Save resume URL and text to profile
    await supabase
      .from('profiles')
      .update({
        resume_url: urlData.publicUrl,
        resume_text: resumeText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      data: {
        resume_url: urlData.publicUrl,
        resume_text: resumeText,
        analysis,
      },
    });
  } catch (err) {
    console.error('Resume analysis error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Failed to analyze resume. Please try again.' } },
      { status: 500 }
    );
  }
}
