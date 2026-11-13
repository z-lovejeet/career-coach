import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type AIAction = 'chat' | 'jobs' | 'roadmap' | 'interview-start' | 'interview-answer' | 'tasks' | 'analysis' | 'resume' | 'companies';

export async function enforceAIQuota(supabase: SupabaseClient, action: AIAction) {
  try {
    const { data: retryAfter, error } = await supabase.rpc('consume_ai_quota', { action_name: action });
    if (error) {
      console.warn(`[ai-quota] consume_ai_quota RPC warning for ${action}:`, error.message);
      // Soft-fail: allow AI calls through if quota storage encounters an unexpected glitch
      return null;
    }
    if (typeof retryAfter === 'number' && retryAfter > 0) {
      return NextResponse.json({ success: false, error: { code: 'rate_limited', message: 'Usage limit reached. Please try again later.' } }, {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      });
    }
  } catch (err) {
    console.warn(`[ai-quota] Unexpected error enforcing quota for ${action}:`, err);
    return null;
  }
  return null;
}
