import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type AIAction = 'chat' | 'jobs' | 'roadmap' | 'interview-start' | 'interview-answer' | 'tasks' | 'analysis' | 'resume' | 'companies';

export async function enforceAIQuota(supabase: SupabaseClient, action: AIAction) {
  const { data: retryAfter, error } = await supabase.rpc('consume_ai_quota', { action_name: action });
  if (error || typeof retryAfter !== 'number') {
    return NextResponse.json({ success: false, error: { code: 'quota_unavailable', message: 'This service is temporarily unavailable. Please try again later.' } }, { status: 503 });
  }
  if (retryAfter > 0) {
    return NextResponse.json({ success: false, error: { code: 'rate_limited', message: 'Usage limit reached. Please try again later.' } }, {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    });
  }
  return null;
}
