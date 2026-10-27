# Onboarding: teach the app who you are

Script for a Claude agent to run with the owner after setup. The template ships with placeholder content; this replaces it with the owner's real details. Takes about 10 minutes of the owner's time. Be friendly and brief; ask one group of questions at a time.

Rules: use only what the owner tells you or documents they give you. Never invent employers, dates, titles, skills or numbers. Mark anything unknown `TODO: ask` and ask. Do not leave any placeholder or other person's details in any file; read each file first and replace the sample content completely.

## Step 1. Get the documents

Ask: "Please upload or paste your current resume. If you have it, also paste your LinkedIn About and Experience sections (or a PDF export), and any older resumes or a career summary you like." Read everything before asking questions, so you do not ask what is already answered.

## Step 2. Ask these questions (12 max)

Skip any the documents already answer; confirm instead of re-asking.

1. What name and email should the app use? (Full name, preferred first name, pronouns, sign-in email.)
2. What is your current (or most recent) job title, and which city and state do you live in?
3. Which roles are you targeting, and at what level? (For example "Senior Product Manager, Staff or above".) Any levels to exclude (too junior or too senior)?
4. Where will you work? Home metro, nearby metros you would take hybrid in, whether US-remote is fine, and anywhere you will not relocate to.
5. What is your base-pay floor, and your target? (Floor: never surface below it. Target: surface freely at or above it. Say if you want to include equity or bonus.)
6. Which industries or products excite you most? (3 to 6.)
7. Which industries or kinds of companies do you want to avoid?
8. What are your dealbreakers? (Travel, on-call, company size, stage, mission, anything.)
9. Which companies are your favorites? Give a tier for each: 1 = dream, 2 = great, 3 = good. (A handful is plenty.)
10. How do you want to sound in writing? Pick or describe: plain and direct, warm, formal. Anything you never want to say or phrases you hate?
11. Which accomplishments are you proudest of and are they safe to share with employers? Flag any numbers that are confidential or approximate.
12. For application forms: work authorization / sponsorship, earliest start date or notice period, anything you want pre-filled, and anything the app must always leave for you to answer.

## Step 3. Write the files

| File | What goes in it |
|---|---|
| `knowledge/profile.json` | From Q1, Q2: `name`, `first_name`, `pronouns` (subject/object/possessive), `current_title`, `city`, `state`, `home_base` ("City, State"), `hybrid_areas`. Keep `resume_library`, and in `sources` keep the style guide and resume library entries, then list every other knowledge file you create (career source of truth, application facts, claims, editorial rules), each with `label` and `path` relative to the repo root. Every path must exist. |
| `public/shared/config.js` | Confirm `ownerName`, `siteName`, `appName` (the name shown in the app; keep the default or let the owner rename it), `ownerEmails` (lowercase), `timezone` match. |
| `knowledge/resume/resume-library.md` | The master resume. Format is parsed by code: `# Full Name`, then a contact line, then a bold headline line (`**Title · Specialty**`), `## Summary`, `## Core expertise` (items separated by ` · `), `## Experience`, then per employer `### Company — City · what the company does`, per role `**Job Title** · Mon YYYY – Mon YYYY`, then bullets `- \`topic-tag\` text`; end with `## Education`. Write MORE bullets than fit on a page (roughly 6 to 12 per recent role, 2 to 4 for older ones), including alternative wordings of the same achievement under the same tag. Each bullet is about 30 words, starts with a strong verb, and states outcome then scope. |
| `knowledge/resume/style-guide.md` | The house rules for resumes and letters (length, bullet counts per role, tone, banned phrases from Q10). Edit the existing guide: replace the names and role-specific bullet budgets with the owner's own; keep the principle "choose from the library, don't add". |
| `knowledge/resume/application-facts.md` | From Q1, Q4, Q5, Q12: only confirmed facts (location rules, pay target stated as the owner's call to share, education). List what is NOT provided so the app flags it as "Needs you". |
| `knowledge/resume/tailor-rules.md` | The owner's tailoring preferences from Q10 and Q11 (what to emphasize, what to leave out, salary answer). Follow the format comment at the top of the file: `## resume.emphasis`, `## resume.leave-out`, `## resume.vocabulary`, `## resume.rules`, `## answers.salary`; an empty section is fine. General voice rules go in `style-guide.md`. |
| `knowledge/career/career-source-of-truth.md` | A full narrative of the career, by role: what they owned, decisions made, results and the evidence for each, with dates. This is the fact base the writing draws from. Add it to `profile.json` sources if not already listed. |
| `knowledge/claims.yaml` | One entry per metric or strong claim: `id`, `program`, `value`, `evidence` (public_disclosure, prior_public_profile, causal, observational, operational, qualitative, self_reported), `visibility` (public, interview_generalized, internal_only), `source`, `approved_wording`, `caveat`, `forbidden_attachment`. From Q11. Replace all sample entries. |
| `knowledge/rules/editorial.md` | Wording rules and confidentiality limits: what never to say publicly, naming rules, how to separate the owner's contribution from the team's. From Q10, Q11. |
| `knowledge/job-agent/rubric.md` | The search brief the scoring model reads: who the candidate is, mission, target roles and levels, location rules, pay anchors, interest areas (Q6), exclusions (Q7), dealbreakers (Q8), company tiers (Q9), what a great match looks like. Replace the sample brief entirely, keeping numbered sections. |
| `knowledge/job-agent/scoring-instructions.md` | The step-by-step scoring instructions appended to the rubric. Rewrite the city, eligibility rules, level wording and pay anchors (the dollar bands in the compensation category) to the owner's own from Q3 to Q5. Keep the structure and the report-field names the code and `node scripts/leads.mjs brief` expect. |
| `knowledge/job-agent/search.json` | Hard filters, no model cost. `title.target_level` and `title.too_senior_or_junior` regexes from Q3; `title.stretch_level` (one level below target, or `null` to turn off); `location.home` regex of the home metro's city names and state code (Q4); `max_age_days`; `pay.floor`, `pay.target` (Q5); `pay.senior_min` and `prompts.stretch_level_line` for the stretch level, or null; `tier_bump`. If the owner is not a product manager, also change `title.pm_phrase` and `not_pm_phrase` to their field's job-title words. |
| `knowledge/job-agent/companies.json` | Favorites from Q9: `{"name": "Company", "tier": 1, "boards": []}` (boards are found automatically; add `"allowSenior": true` only if a plain Senior title is acceptable there). Replace the sample list. |
| `knowledge/job-agent/company-seeds.txt` | Optional: extra company names to scan. After editing run `node scripts/discover-boards.mjs` and commit `open-boards.json`. |

Do not edit `api/`, `public/career/`, `supabase/` or `middleware.js` during onboarding.

## Step 4. Acceptance checks

Run all; fix and re-run until each passes.

1. `node --test` passes.
2. `node -e "const p=require('./knowledge/profile.json');for(const s of p.sources)require('fs').accessSync(s.path);console.log('sources ok')"` prints `sources ok`.
3. `node -e "const t=require('./api/_lib/tailor');console.log(t.BASE.name, t.BASE.roles.length, 'roles', t.BASE.roles.reduce((n,r)=>n+r.bullets.length,0), 'bullets');console.log(t.SYSTEM.slice(0,300))"` shows the owner's name, at least 2 roles, 15 or more bullets, and a prompt that mentions the owner and no one else.
4. `node scripts/leads.mjs brief` prints the owner's rubric and scoring steps and a JSON schema, with no errors.
5. `node -e "require('./api/_lib/job-agent')"` loads without error (search.json regexes valid).
6. `git grep -n -i "<previous sample name>"` finds nothing, where the sample name is whatever placeholder name the template shipped with. Also grep for sample company names and cities you replaced.
7. No secrets: `git grep -n -i "sb_secret\|service_role\|api[_-]key *[:=]"` shows nothing sensitive.

## Step 5. Commit and verify

1. Commit ("Onboarding: owner profile, resume library and search settings") and push. Vercel redeploys.
2. Wait for READY, then open `/career` while signed in; check that a new lead appears after the next discovery run (`/api/job-scan?step=discover&key=<CRON_SECRET>`) and that obviously off-target titles show as `filtered`.
3. Tell the owner what you wrote, which items are `TODO: ask`, and that they can re-run this onboarding any time their goals change (edit `search.json` and `rubric.md` first; those control what shows up).
