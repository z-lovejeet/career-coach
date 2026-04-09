import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const RESUME_EXTRACTION_PROMPT = `You are an expert resume parser. Extract the following information from this resume PDF.

Return ONLY valid JSON matching this exact schema — no extra text, no markdown:
{
  "full_name": "string or empty",
  "skills": ["string array of all technical and soft skills mentioned"],
  "skill_ratings": { "skillName": 1-10 },
  "projects": [
    { "name": "string", "tech": ["tech stack"], "description": "1 sentence", "url": "" }
  ],
  "education_level": "B.Tech|M.Tech|BCA|MCA|BSc|MSc|PhD|Other",
  "field_of_study": "string like Computer Science",
  "experience_level": "fresher|junior|mid|senior",
  "preferred_role": "best matching role like Full Stack Developer",
  "summary": "2-3 sentence professional summary of the candidate"
}

RULES:
- Rate each skill 1-10 based on evidence in resume (projects, experience, certifications)
- If a skill is just listed with no evidence, rate it 3-4
- If demonstrated in projects/work, rate it 5-7
- If extensive experience or certifications, rate 8-10
- Extract ALL skills — programming languages, frameworks, tools, soft skills
- For projects, extract name, tech stack, and a brief description
- Be accurate. Only extract what's actually in the resume.`;

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

    // Read file buffer for both upload and AI analysis
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
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: { code: 'upload_failed', message: uploadError.message } },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(uploadData.path);

    // Update profile with resume URL
    await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        resume_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      });

    // 2. Analyze PDF with Gemini (direct — not through callGemini since we need multimodal)
    let analysis = null;
    try {
      const base64Pdf = buffer.toString('base64');

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: base64Pdf,
                },
              },
              {
                text: RESUME_EXTRACTION_PROMPT,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: 4096,
        },
      });

      const text = result.text || '';
      
      try {
        analysis = JSON.parse(text);
      } catch {
        // Try extracting JSON from markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[1]);
        }
      }

      // Normalize the analysis to prevent UI crashes
      if (analysis) {
        analysis.skills = Array.isArray(analysis.skills) ? analysis.skills : [];
        analysis.skill_ratings = analysis.skill_ratings && typeof analysis.skill_ratings === 'object' ? analysis.skill_ratings : {};
        analysis.projects = Array.isArray(analysis.projects) ? analysis.projects.map((p: Record<string, unknown>) => ({
          name: p.name || 'Untitled Project',
          tech: Array.isArray(p.tech) ? p.tech : (Array.isArray(p.tech_stack) ? p.tech_stack : []),
          description: p.description || '',
          url: p.url || '',
        })) : [];
        analysis.full_name = analysis.full_name || '';
        analysis.education_level = analysis.education_level || '';
        analysis.field_of_study = analysis.field_of_study || '';
        analysis.experience_level = analysis.experience_level || 'fresher';
        analysis.preferred_role = analysis.preferred_role || '';
        analysis.summary = analysis.summary || '';
      }

      console.log(`Resume AI analysis complete: ${analysis?.skills?.length || 0} skills, ${analysis?.projects?.length || 0} projects extracted`);
    } catch (aiErr) {
      console.error('Resume AI analysis failed:', aiErr);
      // Analysis is optional — upload still succeeded
    }

    return NextResponse.json({
      success: true,
      data: {
        resume_url: urlData.publicUrl,
        analysis,
      },
    });
  } catch (err) {
    console.error('Resume upload error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Failed to process resume. Please try again.' } },
      { status: 500 }
    );
  }
}
