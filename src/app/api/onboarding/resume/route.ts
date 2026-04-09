import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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

    return NextResponse.json({
      success: true,
      data: {
        resume_url: urlData.publicUrl,
        resume_text: '',
      },
    });
  } catch (err) {
    console.error('Resume upload error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
