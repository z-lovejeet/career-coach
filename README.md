# CareerAI

CareerAI is a workspace for technical interview preparation. Candidates can assess their skills, make a study plan, practice interview questions, and track progress toward an engineering role.

| Area | What you can do |
| --- | --- |
| Overview | Review your readiness, practice activity, and next steps |
| Profile | Edit your experience and skills, attach or remove a private PDF resume, and run an assessment |
| Roadmap | Build a study plan covering one to twelve months |
| Practice | Generate weekly tasks, filter by topic, and track completion |
| Interviews | Start or resume a mock interview and review feedback for each answer |
| Mentor | Ask preparation questions with recent conversation context |
| Opportunities | Compare profile fit and find sourced LinkedIn postings or open a LinkedIn search |
| Progress | Review activity, experience, streaks, and milestones |

The interface uses a responsive top navigation, a cool blue-lavender glass palette, soft depth, and spring motion. Touch, reduced-motion, and reduced-transparency preferences have dedicated fallbacks. The guest entry point creates an isolated anonymous workspace with sample data.

## Local setup

1. Use Node.js 22.18 or newer. Run `npm ci`.
2. Copy `.env.local.example` to `.env.local`. Add the public Supabase URL and key and the Groq and Gemini keys. Apify is optional. Without it, Opportunities opens a real LinkedIn search for the selected criteria.
3. For a fresh Supabase project, run [supabase-schema.sql](supabase-schema.sql) in the SQL Editor. For an existing project, apply the files in [supabase/migrations](supabase/migrations) in filename order. The AI quotas and weekly task operations depend on these database functions.
4. In Supabase Auth, enable **Confirm Email** and **Anonymous Sign-ins**. Set the site URL and allow each environment’s `/auth/callback` URL. Configure Google OAuth if you offer Google sign-in and custom SMTP for production confirmation emails. Keep email confirmation links on the PKCE confirmation flow so they return an authorization code to the callback.
5. For CAPTCHA, enable Cloudflare Turnstile in Supabase Auth with its secret and set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to the matching public site key.
6. Run `npm run dev` and open [localhost:3000](http://localhost:3000).

### Upgrading a deployed installation

Apply the migrations before releasing the new app. Ban the retired shared guest account and revoke its sessions in Supabase. Archive or remove the old guest data according to your retention policy. Move or delete any resume objects whose signed URLs appeared in prior logs to invalidate those URLs. Coordinate object moves with the corresponding profile references so existing users retain access. The application now uses the public Supabase key with row-level security.

If your old registration flow automatically confirmed addresses, review those accounts and their linked identities as part of the deployment. The updated registration flow requires email confirmation before creating a session.

## Checks

```bash
npm run lint
npm test
npm run build
npm audit
```

The route regression tests use local fixtures and mock provider calls. The CI workflow runs the checks on pull requests and changes to main.

The supplied visual references and background-generation prompt are documented in [the reference design notes](docs/reference-design.md).
