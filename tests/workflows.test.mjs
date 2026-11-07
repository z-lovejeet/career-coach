import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { compileFunction } from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { NextResponse } = require('next/server');

// Execute the same route handlers as Next.js while replacing their network clients.
function loadSource(path, mocks = {}) {
  const file = new URL(`../src/${path}`, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const compiled = { exports: {} };
  const imports = { 'next/server': { NextResponse }, ...mocks };
  compileFunction(outputText, ['require', 'module', 'exports'], { filename: file.pathname })(
    name => {
      assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
      return imports[name];
    },
    compiled,
    compiled.exports,
  );
  return compiled.exports;
}

function route(path, from, mocks = {}) {
  return loadSource(`app/${path}/route.ts`, {
    '@/lib/supabase/server': {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'candidate' } } }) }, from }),
    },
    '@/lib/supabase/ai-quota': { enforceAIQuota: async () => null },
    ...mocks,
  });
}

function query(data) {
  const result = { data, error: null };
  return {
    select() { return this; },
    eq() { return this; },
    order() { return this; },
    limit() { return this; },
    maybeSingle: async () => result,
    then: resolve => Promise.resolve(result).then(resolve),
  };
}

function post(body) {
  return new Request('http://career.test/', { method: 'POST', body: JSON.stringify(body) });
}

test('chat uses the newest context and persists the exchange in a single write', async () => {
  const stored = Array.from({ length: 28 }, (_, index) => ({ role: 'user', content: `message ${index}` }));
  let saved;
  let failWrite = false;
  const { POST } = route('api/chat', table => {
    if (table !== 'chat_messages') return query(null);
    return {
      ...query(stored),
      order(field, options) {
        if (field === 'created_at') assert.equal(options.ascending, false);
        return this;
      },
      limit: size => Promise.resolve({ data: stored.toReversed().slice(0, size), error: null }),
      insert: async rows => {
        saved = rows;
        return { error: failWrite ? { code: 'mock_write_failure' } : null };
      },
    };
  }, {
    '@/lib/agents/chat': {
      chat: async ({ chat_history }) => {
        assert.deepEqual(chat_history, stored.slice(-20));
        return { response: 'response', suggested_actions: [] };
      },
    },
  });

  const response = await POST(post({ message: 'A new question' }));
  assert.equal(response.status, 200);
  assert.deepEqual(saved.map(row => [row.role, row.content]), [
    ['user', 'A new question'], ['assistant', 'response'],
  ]);
  failWrite = true;
  assert.equal((await POST(post({ message: 'Another question' }))).status, 500);
});

test('interviews reject skipped rounds and prevent a concurrent answer from overwriting another', async () => {
  let interview = {
    id: 'interview', status: 'in_progress', answers: [], evaluations: [],
    questions: ['First', 'Second'].map((question, id) => ({ id, question, expected_topics: [] })),
  };
  const { promise, resolve } = Promise.withResolvers();
  let graded = 0;
  const { POST } = route('api/interview/[id]/answer', () => ({
    ...query(structuredClone(interview)),
    update(changes) {
      return {
        ...query(null),
        is(column, value) {
          assert.equal(column, 'answers->0');
          assert.equal(value, null);
          return this;
        },
        async maybeSingle() {
          if (interview.answers.length) return { data: null, error: null };
          interview = { ...interview, ...changes };
          return { data: interview, error: null };
        },
      };
    },
  }), {
    '@/lib/agents/interview': {
      evaluateAnswer: async () => {
        graded++;
        if (graded === 2) resolve();
        await promise;
        return { score: 8, max_score: 10 };
      },
    },
  });
  const submit = (answer, index) => POST(post({ answer, question_index: index }), {
    params: Promise.resolve({ id: 'interview' }),
  });

  assert.equal((await submit('Skip ahead', 1)).status, 409);
  const concurrent = await Promise.all([submit('First answer', 0), submit('Competing answer', 0)]);
  assert.deepEqual(concurrent.map(response => response.status).sort(), [200, 409]);
  assert.equal(interview.answers.length, 1);
  assert.equal((await submit(interview.answers[0], 0)).status, 200);
  assert.equal(graded, 2);
});

test('a 12-month roadmap covers 52 contiguous weeks and only succeeds when saved', async () => {
  let saved;
  let failWrite = false;
  const { POST } = route('api/roadmap', table => ({
    ...query(null),
    insert: async value => {
      assert.equal(table, 'roadmaps');
      saved = value.content;
      return { error: failWrite ? { code: 'mock_write_failure' } : null };
    },
  }), {
    '@/lib/agents/ai': {
      callAI: async ({ userPrompt }) => {
        assert.match(userPrompt, /Build exactly 12 phases/);
        return {
          overview: { feasibility: 'realistic', feasibilityNote: 'Test plan', targetReadiness: 80, estimatedFinalReadiness: 75 },
          phases: [4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5, 4].map((length, month) => ({
            title: `Month ${month + 1}`, focusArea: 'dsa', objective: 'Study a topic', milestone: 'Solve a timed set',
            weeks: Array.from({ length }, (_, index) => ({
              focus: `Week ${index + 1}`, exercise: 'Solve practice problems', deliverable: 'Write a solution',
            })),
          })),
          keySkillsToAcquire: [],
          interviewPrep: { dsaProblemsTarget: 25, mockInterviewsTarget: 2, systemDesignTopics: [], companySpecificTips: [] },
          warnings: [],
        };
      },
    },
  });
  const request = () => post({ dreamCompany: 'Example', targetRole: 'Engineer', timelineMonths: 12, focusAreas: ['dsa'] });
  const response = await POST(request());
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.data, saved);
  assert.deepEqual(saved.phases.flatMap(phase => phase.weeks.map(week => week.weekNumber)),
    Array.from({ length: 52 }, (_, index) => index + 1));
  failWrite = true;
  assert.equal((await POST(request())).status, 500);
});

test('failed live job searches return a real search link and never invent listings', async t => {
  const previous = process.env.APIFY_API_TOKEN;
  process.env.APIFY_API_TOKEN = 'fake-local-token';
  t.after(() => {
    if (previous === undefined) delete process.env.APIFY_API_TOKEN;
    else process.env.APIFY_API_TOKEN = previous;
  });

  let scrapeAttempts = 0;
  let available = false;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    scrapeAttempts++;
    assert.equal(url.origin, 'https://api.apify.com');
    assert.equal(url.pathname, '/v2/actors/cheap_scraper~linkedin-job-scraper/run-sync-get-dataset-items');
    assert.equal(url.searchParams.get('limit'), '15');
    assert.equal(init.headers.Authorization, 'Bearer fake-local-token');
    assert.equal(init.redirect, 'error');
    assert.deepEqual(JSON.parse(init.body).keyword, ['Frontend Engineer']);
    return available
      ? Response.json([{ jobId: '123', jobTitle: 'Engineer', jobUrl: 'https://www.linkedin.com/jobs/view/123' }])
      : new Response(null, { status: 503 });
  });
  const { POST } = route('api/jobs', () => query({ preferred_role: 'Frontend Engineer' }));

  const response = await POST(post({}));
  const { data } = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.source, 'search');
  assert.deepEqual(data.jobs, []);
  assert.equal(new URL(data.searchUrl).hostname, 'www.linkedin.com');
  assert.equal(new URL(data.searchUrl).searchParams.get('keywords'), 'Frontend Engineer');
  assert.equal((await POST(post({ searchUrl: 'https://linkedin.com.example.test/jobs/' }))).status, 400);
  assert.equal(scrapeAttempts, 1);
  available = true;
  const live = await (await POST(post({}))).json();
  assert.equal(live.data.source, 'linkedin');
  assert.equal(live.data.jobs[0].applyUrl, 'https://www.linkedin.com/jobs/view/123');
});

test('resume download rejects arbitrary and cross-account URLs before accessing Storage', async t => {
  const previous = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://storage.example.test';
  t.after(() => {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
  });

  const { downloadResume, getResumePath } = loadSource('lib/supabase/resume.ts');
  const client = { storage: { from: () => assert.fail('Untrusted references must not reach Storage') } };
  assert.equal(await downloadResume(client, 'http://127.0.0.1/private', 'owner'), null);
  assert.equal(await downloadResume(client, 'https://storage.example.test/storage/v1/object/sign/resumes/other/resume.pdf', 'owner'), null);
  assert.equal(await downloadResume(client, 'owner/../secret.pdf', 'owner'), null);
  assert.equal(getResumePath('https://storage.example.test/storage/v1/object/sign/resumes/owner/my%20resume.pdf?token=expired', 'owner'), 'owner/my resume.pdf');
});

test('OAuth callback only allows local workspace destinations', async () => {
  const { GET } = route('auth/callback', () => query({ onboarding_complete: true }), {
    '@/lib/supabase/server': {
      createClient: async () => ({
        auth: { exchangeCodeForSession: async () => ({ data: { user: { id: 'candidate' } } }) },
        from: () => query({ onboarding_complete: true }),
      }),
    },
    '@/lib/supabase/legacy-guest': { isLegacyGuestEmail: () => false },
  });

  for (const next of ['.example.test/', '//example.test', '@example.test', '/roadmap']) {
    const url = new URL('http://career.test/auth/callback?code=local-mock-code');
    url.searchParams.set('next', next);
    const response = await GET(new Request(url));
    assert.equal(response.headers.get('location'), next === '/roadmap' ? 'http://career.test/roadmap' : 'http://career.test/dashboard');
  }
});

test('shared progress counts all task pages and awards interview and analysis XP', async () => {
  const { loadProgress } = loadSource('lib/supabase/progress.ts');
  const now = Date.parse('2026-11-06T18:00:00Z');
  const task = { category: 'dsa', completed: true, created_at: '2026-11-05T16:00:00Z', completed_at: null };
  const tasks = Array.from({ length: 505 }, () => task);
  const progress = await loadProgress({
    from: table => ({
      ...query(null),
      range: (start, end) => Promise.resolve({
        data: table === 'tasks' ? tasks.slice(start, end + 1) : [{ status: 'completed' }].slice(start, end + 1),
        error: null,
      }),
      then: resolve => Promise.resolve({ count: 1, error: null }).then(resolve),
    }),
  }, 'candidate', now);
  assert.equal(progress.stats.totalTasks, 505);
  assert.equal(progress.stats.completedInterviews, 1);
  assert.deepEqual(progress.streak, { current: 1, longest: 1 });
  assert.deepEqual(progress.xp.breakdown, { tasks: 5050, interviews: 25, analyses: 15, streakBonus: 0 });
});

test('registration requires provider confirmation and keeps duplicate accounts private', async t => {
  const settings = { NEXT_PUBLIC_SUPABASE_URL: 'https://auth.example.test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-key' };
  for (const [name, value] of Object.entries(settings)) {
    const previous = process.env[name];
    process.env[name] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[name];
      else process.env[name] = previous;
    });
  }

  let autoConfirm = true;
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url, 'https://auth.example.test/auth/v1/settings');
    return Response.json({ mailer_autoconfirm: autoConfirm });
  });
  let duplicate = false;
  let signupCalls = 0;
  const { POST } = route('api/auth/register', () => assert.fail('Registration must not write profiles directly'), {
    '@/lib/supabase/server': { createClient: async () => ({ auth: {
      signUp: async credentials => {
        signupCalls++;
        assert.equal(credentials.options.emailRedirectTo, 'http://career.test/auth/callback');
        assert.equal(credentials.options.captchaToken, 'test-captcha');
        return { data: { session: null }, error: duplicate ? { code: 'user_already_exists' } : null };
      },
    } }) },
    '@/lib/supabase/legacy-guest': loadSource('lib/supabase/legacy-guest.ts'),
  });
  const request = () => post({ email: 'candidate@example.test', password: 'a-test-password', captchaToken: 'test-captcha' });
  assert.equal((await POST(request())).status, 503);
  assert.equal(signupCalls, 0);

  autoConfirm = false;
  const created = await POST(request());
  const confirmation = await created.json();
  assert.equal(created.status, 200);
  assert.equal(confirmation.requiresEmailConfirmation, true);
  assert.equal(confirmation.redirect, undefined);

  duplicate = true;
  assert.deepEqual(await (await POST(request())).json(), confirmation);
});

test('resume replacement and removal update the profile and delete the previous file', async () => {
  let reference = 'candidate/old.pdf';
  const objects = new Map([[reference, '%PDF-1.7 old']]);
  const storage = { from(bucket) {
    assert.equal(bucket, 'resumes');
    return {
      upload: async (path, pdf) => { objects.set(path, pdf.toString()); return { error: null }; },
      remove: async paths => { paths.forEach(path => objects.delete(path)); return { error: null }; },
      download: path => ({ asStream: async () => ({ data: new Blob([objects.get(path)]).stream() }) }),
    };
  } };
  const from = () => ({
    select() { return this; },
    eq(column, value) { if (column === 'resume_url') this.expected = value; return this; },
    update(fields) { this.fields = fields; return this; },
    async maybeSingle() {
      if (this.fields) {
        assert.equal(this.expected, reference);
        reference = this.fields.resume_url;
      }
      return { data: { resume_url: reference }, error: null };
    },
  });
  const { GET, POST, DELETE } = route('api/onboarding/resume', from, {
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'candidate' } } }) }, from, storage }) },
    '@/lib/supabase/resume': loadSource('lib/supabase/resume.ts'),
    '@/lib/agents/resume': { readResumeWithGemini: async () => '' },
    'node:crypto': { randomUUID: () => 'replacement' },
  });
  const upload = content => {
    const form = new FormData();
    form.append('resume', new File([content], 'resume.pdf', { type: 'application/pdf' }));
    return POST(new Request('http://career.test/api/onboarding/resume', { method: 'POST', body: form }));
  };
  assert.equal((await upload('fake PDF')).status, 400);
  const uploaded = await upload('%PDF-1.7 new');
  assert.equal(uploaded.status, 200);
  assert.equal((await uploaded.json()).data.resume_url, '/api/onboarding/resume');
  assert.deepEqual([...objects.keys()], ['candidate/replacement.pdf']);
  const downloaded = await GET();
  assert.equal(await downloaded.text(), '%PDF-1.7 new');
  assert.equal(downloaded.headers.get('cache-control'), 'private, no-store');
  assert.equal((await DELETE()).status, 200);
  assert.equal((await DELETE()).status, 200);
  assert.equal(reference, null);
  assert.equal(objects.size, 0);
});

test('guest sign-in issues separate identities and recovers a retired shared session', async () => {
  const legacy = loadSource('lib/supabase/legacy-guest.ts');
  let currentUser = null;
  let newUsers = 0;
  let retiredSessionCleared = false;
  const { POST } = route('api/auth/guest', () => query({ onboarding_complete: true }), {
    '@/lib/supabase/server': { createClient: async () => ({
      auth: {
        getUser: async () => ({ data: { user: currentUser } }),
        signOut: async options => { assert.deepEqual(options, { scope: 'local' }); retiredSessionCleared = true; },
        signInAnonymously: async () => ({ data: { user: { id: `guest-${++newUsers}` }, session: {} } }),
      },
      from: () => query({ onboarding_complete: true }),
    }) },
    '@/lib/supabase/legacy-guest': legacy,
    'node:crypto': { createHash: () => assert.fail('Sample already exists') },
  });
  const first = await (await POST(post({}))).json();
  const second = await (await POST(post({}))).json();
  assert.notEqual(first.user.id, second.user.id);
  currentUser = { email: legacy.LEGACY_GUEST_EMAIL };
  assert.equal((await POST(post({}))).status, 200);
  assert.equal(retiredSessionCleared, true);
  currentUser = { email: 'candidate@example.test' };
  assert.equal((await POST(post({}))).status, 409);
  assert.equal(newUsers, 3);
});
