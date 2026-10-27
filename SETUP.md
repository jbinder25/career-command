# Setup

Goal: your own private copy of the career app, running on **your** Vercel and Supabase accounts, at no cost, with AI work done by your Claude plan (no API key).

Two parts: **what you do** (about 10 minutes of clicking) and **what your Claude agent does** (it follows Part B literally). Easiest path: do Part A, then paste the prompt in README.md into a Claude Code session and let it run Part B.

Placeholders used below: `<EMAIL>` is the email you will sign in with (lowercase). `<REPO>` is your repository name. `<PROJECT>` is the Vercel project name (it becomes `https://<PROJECT>.vercel.app`).

---

## Part A. What you do (about 10 minutes)

1. **Create your private repository.** On the template repository page, click **Use this template**, then **Create a new repository**. Owner: you. Visibility: **Private**. Name it anything (for example `career-console`). If there is no "Use this template" button, ask the person who shared it to turn on Settings, General, Template repository, or to send you a copy.
2. **Connect your tools to Claude.** In Claude (claude.ai), open Settings, Connectors, and connect **GitHub**, **Vercel** and **Supabase**. Sign in to each with your own account. When GitHub asks which repositories to allow, include `<REPO>`.
3. **Let Vercel see the repository.** In Vercel, open Account Settings, Git, and make sure the Vercel GitHub app is installed with access to `<REPO>` (install it, or add the repository to its list).
4. **Check Supabase has room.** The free plan allows 2 active projects. If you already have 2, pause or delete one at supabase.com/dashboard, or your agent cannot create the project.
5. **Start the agent.** In Claude Code on the web (claude.ai/code), start a session on `<REPO>` with the GitHub, Vercel and Supabase connectors on. Paste the prompt from README.md. Tell it your sign-in email (`<EMAIL>`).
6. **Do the one dashboard step the agent cannot do** (it will pause and ask). In Supabase, open your project, Authentication, URL Configuration:
   - **Site URL**: `https://<PROJECT>.vercel.app`
   - **Redirect URLs**: add `https://<PROJECT>.vercel.app/career` and `https://<PROJECT>.vercel.app/login`
   - Click **Save**. Confirm the Email provider is enabled (Authentication, Sign In / Providers; it is on by default).
7. **Sign in.** Open `https://<PROJECT>.vercel.app/career`, enter `<EMAIL>`, click the link in the email. You land on the Career page.
8. **Answer the agent's onboarding questions** (about 10 minutes, see ONBOARDING.md). This teaches the app who you are.
9. **Create the daily scoring task.** In Claude Code on the web, open Scheduled tasks and create one on `<REPO>`: repeat daily, Supabase connector attached, prompt as in Part B step 17. Your agent may be able to create it for you; if not, it gives you the exact text. Menu names change over time; look for "scheduled" in Claude Code on the web.

That is everything you do. Nothing runs on your computer.

---

## Part B. What your Claude agent does

Rules while doing this: never print or commit secrets; ask the owner before anything that costs money; if a step fails, stop and report the exact error instead of guessing.

### B1. Supabase (database and sign-in)

1. **Pick or create the project.** Call `list_organizations`, then `list_projects`. If the owner already has a project named for this app, confirm with them before reusing it. Otherwise count active projects: the free plan allows 2. If creating one would exceed the free limit or the connector reports a monthly cost above $0, stop and ask the owner. Otherwise call `create_project` with name `career-console`, the owner's organization, a region near them, and a strong database password you generate (do not print it; the owner never needs it). Poll `get_project` until its status is `ACTIVE_HEALTHY`.
2. **Generate two secrets** in your shell, and keep them only in memory and in Vercel env vars:
   ```
   openssl rand -hex 32   # CRON_SECRET
   openssl rand -hex 32   # JOB_AGENT_SECRET
   ```
3. **Create the schema.** Read `supabase/schema.sql` and run its entire contents with `apply_migration` (name `career_schema`). Do not run anything from `supabase/migrations/`; that folder is history.
4. **Insert the config row, before the first sign-in.** Run with `execute_sql`, substituting the real values:
   ```sql
   insert into private.job_agent_config (secret_sha256, owner_email)
   values (encode(extensions.digest('<JOB_AGENT_SECRET>', 'sha256'), 'hex'), '<EMAIL>');
   ```
   `<EMAIL>` must be lowercase and exactly the address the owner will sign in with. Sign-ups are blocked for everyone else.
5. **Verify the database.** `execute_sql`: `select owner_email from private.job_agent_config;` returns one row. Then `list_tables` (schema `public`) shows `jobs, contacts, activities, documents, document_versions, job_documents, interview_rounds, job_leads, job_sources, job_agent_runs`, all with RLS enabled. Run `get_advisors` (type `security`) and report anything about missing RLS.
6. **Collect connection values.** `get_project_url` gives `https://<ref>.supabase.co`. `get_publishable_keys` gives a key starting `sb_publishable_` (use that, not a secret or service-role key).

### B2. The repository

7. **Edit `public/shared/config.js`**:
   ```js
   ({
     siteName: 'Career Command Center',
     appName: 'Career Command Center',
     ownerName: '<Full name>',
     ownerEmails: ['<EMAIL>'],            // lowercase
     supabaseUrl: 'https://<ref>.supabase.co',
     supabaseKey: 'sb_publishable_...',   // the publishable key
     timezone: 'America/New_York',        // owner's IANA timezone
   })
   ```
   Keep the surrounding file exactly as is; change only the values. Confirm with `grep -rn "supabase.co" public middleware.js api` that no other file holds the URL.
8. **Run the tests**: `npm ci && node --test`. All must pass. Fix config problems (for example an uppercase email) before continuing.
9. **Commit and push** to the default branch of `<REPO>` (git, or the GitHub connector's `push_files` / `create_or_update_file`). Do not commit any secret.

### B3. Vercel (hosting)

10. **Create the project from the repository.** Find the team with `list_teams`. Call `create_git_project` (or `create_project` with the Git repository linked) for `<REPO>`: framework preset **Other**, no build command, no output directory override (`vercel.json` sets everything), root directory `./`. Name it `<PROJECT>`; if the name is taken, pick another and use it everywhere below. If the call says the Vercel GitHub app lacks access, ask the owner to do Part A step 3, then retry.
11. **Set environment variables** with `create_project_env`, for the Production environment (also Preview if offered): `CRON_SECRET` and `JOB_AGENT_SECRET`, using the values from step 2, type `encrypted`/`sensitive`. **Do not set `ANTHROPIC_API_KEY` or `AI_GATEWAY_API_KEY`**: leaving them unset is what keeps the app free.
12. **Deploy.** The push in step 9 starts a build; if none started, call `create_deployment` from the repo's main branch. Poll `get_deployment` until the state is `READY`; on `ERROR`, read the build logs and fix. Get the production URL (`get_project` domains, or the deployment alias). It should be `https://<PROJECT>.vercel.app`.

### B4. Hand-off to the owner

13. **Pause and ask the owner to do Part A step 6**, giving them the exact Site URL and the two Redirect URLs for the real production URL. Wait until they say it is done.
14. **Verify the site** (`curl -sI` if the sandbox can reach it; otherwise ask the owner to open the pages, or use `get_runtime_logs` for errors):
    - `GET /login` returns 200.
    - `GET /career` signed out returns a redirect (307) to `/login`.
    - `GET /api/job-scan` with no key returns 401.
15. **Owner signs in** at `/career`. Confirm they reached the Career page.
16. **Run discovery once.** `GET https://<PROJECT>.vercel.app/api/job-scan?step=discover&key=<CRON_SECRET>` (may take a few minutes; it reads hundreds of job boards). Expect JSON with `boards_ok`, `postings_seen`, `new_postings`, `new_pending`. Then `execute_sql`: `select status, count(*) from public.job_leads group by 1;` shows `filtered` and `pending` rows. If `fatal` appears in the JSON, read it and see Troubleshooting.
    The filters are still the template defaults until onboarding; that is fine for this test.
17. **Run ONBOARDING.md with the owner**, commit and push, and wait for the redeploy.
18. **Create the daily scoring task.** If you have a scheduled-task tool (for example `create_trigger`), create a daily task on `<REPO>` with the Supabase connector attached, at a time after the Vercel crons (they run at 11:00, 17:00 and 23:00 UTC; for example 12:30 UTC), with this prompt. Otherwise give the owner this text for Part A step 9:
    > Follow docs/claude/score-leads.md in this repository exactly. Use the Supabase connector's execute_sql for all database access, keep working files in a temp directory, and never print secrets or commit anything. Score the pending job leads honestly following the brief, save and surface them as the file describes, log the run, and finish with a two-line summary of how many leads were scored and surfaced.
19. **Run the scoring task once now** (or follow `docs/claude/score-leads.md` yourself in this session). Confirm: `select status, count(*) from public.job_leads group by 1;` shows `scored` and `review` rows, and the owner sees cards in the **Leads** tab on `/career`.

### Verification checklist

- [ ] `/login` loads
- [ ] Owner can sign in with the emailed link and lands on `/career`
- [ ] A job can be added on `/career` and still shows after a refresh
- [ ] `/api/job-scan?step=discover&key=...` returns stats
- [ ] After a scoring run, leads appear in the Leads tab
- [ ] `node --test` passes; no secrets in the repository (`git grep -n "sb_secret\|service_role\|CRON_SECRET="` finds nothing sensitive)

---

## Optional: leads from your inbox

The daily scan only reads company job boards. If you also get job alerts by email (LinkedIn, Glassdoor, Indeed, Built In, Wellfound) or recruiters write to you, a second Claude task can read those emails and add the jobs too. It is optional and off until you set it up. It runs on your Claude plan.

What it does each day (`docs/claude/email-leads.md`):
- Reads the last two days of job emails, **read only** (it never sends, labels, archives or deletes email).
- Skips jobs already on your board or in your tracker, and the same job arriving in several emails.
- Matches each job to the company's own job board for the full description, or searches the company's careers page; when neither works it scores from what the email says, and says so.
- Applies the same filters as the daily scan, then scores the new leads like the scoring task does (so it also scores anything else pending).
- Recruiter messages: scored when the job can be found; otherwise added to your tracker in the **Recruiter outreach** stage with "Reply to recruiter" as the next step.

To turn it on:
1. **Connect Gmail to Claude** (Settings, Connectors, Gmail).
2. **Create the task.** In Claude Code on the web, Scheduled tasks: a daily task on `<REPO>` with the **Gmail** and **Supabase** connectors, at a time after your alerts usually arrive (for example early morning), with the prompt at the end of `docs/claude/email-leads.md`. Or, in a session on `<REPO>`, run `/email-leads` and ask Claude to set it up. Because this task also scores, it can replace the daily scoring task (keep one of the two).
3. **Databases set up before this feature** need two new operations in `private.job_agent_op` (`dupes` and `add_outreach`, plus `private.norm_key`). Ask Claude: "Compare `private.job_agent_op` in my database with `supabase/schema.sql` and apply only what is missing." New installs already have them.
4. **Run it once by hand** and check the Leads tab and the tracker.

Limits: LinkedIn and some career sites cannot be loaded from Claude's cloud sessions with the default network settings, so some jobs are scored from the email details only. Adding those sites under the environment's allowed domains (Network access) improves it.

---

## What it costs

Everything is on free tiers. Supabase Free pauses a project after about 7 days without activity; the daily cron keeps it active. Vercel Hobby is for personal, non-commercial use, which this is. Scoring and tailoring use your Claude plan's usage limits (the scoring task handles 15 leads per run by default). Nothing here needs a credit card unless you upgrade a plan.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| The magic link opens `localhost` | Supabase Site URL is still the default. Set Site URL to your Vercel URL (Part A step 6), then request a new link. |
| The link opens but you bounce back to `/login` | The Redirect URLs do not include `<url>/career`. Add it, save, request a new link. |
| "That email does not have access." | The email typed is not in `ownerEmails` in `config.js`, or the config row is missing or has a different email. Check `select owner_email from private.job_agent_config;` and `public/shared/config.js`; fix whichever is wrong (to change the row: `update private.job_agent_config set owner_email = '<EMAIL>';`), push, and retry. |
| "Database error" or "Sign-ups are closed for this site" when sending the link | The config row does not exist yet, or its email differs from the one entered. Insert or fix it (B1 step 4). |
| No email arrives | Check spam. Supabase's built-in email sender has a low hourly limit; wait an hour or two, and try only once per request. |
| Signed in, but `/career` shows no data or "permission denied" | You signed in with a different email than the config row's. Sign out (`/login?logout=1`) and use `<EMAIL>`. |
| Every `/api/...` call returns 401 `Sign in required` | The session cookie was rejected. Sign out and in again; confirm `supabaseUrl` and `supabaseKey` in `config.js` belong to the same project. |
| `/api/job-scan` returns 401 `Unauthorized` | Wrong or missing `key`. It must equal the `CRON_SECRET` env var. After changing env vars, redeploy. |
| `/api/job-scan` returns 503 `JOB_AGENT_SECRET is not set` | Add the env var in Vercel and redeploy. |
| `job_agent_rpc: unauthorized` in the JSON `fatal` field | `JOB_AGENT_SECRET` in Vercel does not match the hash in the config row. Update the row: `update private.job_agent_config set secret_sha256 = encode(extensions.digest('<JOB_AGENT_SECRET>','sha256'),'hex');` |
| The daily cron never seems to run | Vercel project, Settings, Cron Jobs should list three jobs (needs `vercel.json` on the production deployment and `CRON_SECRET` set). Check the latest `job_agent_runs` row: `select started_at, stats from public.job_agent_runs order by started_at desc limit 3;`. Run once by hand with the `?step=` URL. |
| Leads stay `pending` | Expected in free mode until the scheduled Claude task runs. Run it once by hand, and check the task is enabled and has the Supabase connector. |
| The email task stops with "Gmail connector is not available" | Add the Gmail connector to the scheduled task (edit it in Scheduled tasks), then run it once by hand. |
| `job_agent_op: unknown op dupes` | Your database predates the email feature. See "Optional: leads from your inbox", step 3. |
| Supabase project paused or requests time out | Dashboard, project, **Restore project** (or the connector's `restore_project`). Then run `/api/job-scan?step=discover&key=...` once; the daily cron keeps it awake afterwards. |
| Vercel shows its own sign-in screen before the site | Deployment Protection is covering that URL. Use the project's main `https://<PROJECT>.vercel.app` address, or in Vercel Settings, Deployment Protection, turn off Vercel Authentication for Production (the app has its own login). |
| Build fails | Read the build log (`get_deployment` / deployment events). Usual causes: Node version mismatch (set Node 20 or newer in Vercel settings) or an edit that broke `config.js`; run `node --test` locally. |
| "Tailoring here needs an API key" on `/career` | Expected in free mode. Use the panel's copy button and paste the text into a Claude Code session on your repository (`docs/claude/tailor-with-claude.md`). |
