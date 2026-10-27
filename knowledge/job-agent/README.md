# Job discovery agent

A daily scan finds openings that match the owner's brief, scores them, and puts at most fifteen a day (`JOB_AGENT_DAILY_CAP`) in the **Leads** tab of `/career` for accept or reject.

| File | Role |
|---|---|
| `rubric.md` | The scoring brief sent to Claude: who the candidate is, target levels, pay, geography, industries, scoring model. A template until the owner fills it in (ONBOARDING.md) |
| `search.json` | The owner's search settings: title and location regexes, max age, pay bars, favorite bump, the stretch-level prompt line. Edit this, not the code, to retarget the search. Its `_readme` explains every field |
| `scoring-instructions.md` | The step-by-step scoring instructions appended to `rubric.md` in the system prompt. Written in neutral form; it refers to the brief's sections, so it needs no edits |
| `companies.json` | Optional favorites: companies scanned first, with a rubric tier (1 = most wanted) and known job-board IDs. Empty by default |
| `open-boards.json` | Every other company whose Greenhouse, Lever or Ashby board `scripts/discover-boards.mjs` found from `company-seeds.txt` |
| `company-seeds.txt` | Company names to look up. Add a name, run the script, commit |
| `api/job-scan.js` | Vercel Cron handler, three times a day at 11:00, 17:00 and 23:00 UTC (see `vercel.json`). Hobby allows each cron job only once a day, so these are three jobs with a different `?slot=` each |
| `api/_lib/job-agent.js` | Board readers, hard filters, scoring call, surfacing gate (reads `search.json`, `rubric.md` and `scoring-instructions.md`) |
| `scripts/leads.mjs` | Offline helper for Claude-plan scoring: prints the brief and prompts, turns evaluations into SQL |
| `supabase/schema.sql` | Creates `job_leads`, `job_sources`, `job_agent_runs`, and the `job_agent_rpc` function the scan writes through |

## Pipeline

1. **Discover.** Read every board, not a fixed list. `companies.json` holds optional **favorites** (tiered, with a score bump) and `open-boards.json` holds every other company whose board was found. Unknown boards for favorites are guessed from the name; results are kept in `job_sources` (companies with no readable board are retried weekly). Open boards keep a row only for postings that pass the cheap filters.
2. **Hard filter** (no model cost). The title must match a role in `search.json` at a target level, the location must be the home area (`location.home`) or US-remote, and the posting must be newer than `max_age_days` when the board gives a date. Everything else is stored as `filtered` with the reason. An optional stretch level (off by default) is allowed only at a higher pay bar.
3. **Score.** Up to 30 pending leads per run (`JOB_AGENT_SCORE_LIMIT`; favorites first) go to Claude with `rubric.md` as instructions and the owner's 25 most recent accept/reject decisions as calibration. The model returns per-category scores, match type, recommendation, dealbreakers, pay extracted from the posting, and the report fields.
4. **Surface.** A scored lead goes to review only when the score meets the bar (80, or `JOB_AGENT_MIN_SCORE` when set), there are no dealbreakers, location is not ineligible, the recommendation is not "Do not recommend", and the pay range reaches `pay.target` (a range between `pay.floor` and `pay.target`, or no pay listed, needs 90+). With the template's pay values of 0, only the 90+ rule for unlisted pay applies. The best go first, at most three per day, from leads first seen within 14 days.

## Registry, feedback and cadence

`job_leads` is the registry, keyed by board + requisition ID (`lead_key`). It records company, title, URL, location, pay, first seen, posting date, last seen, closed date, score, status and the owner's decision. Statuses: `filtered`, `pending`, `scored`, `review`, `accepted`, `rejected`, `error`. A posting is never re-surfaced once seen.

Each reject records a reason (pay, industry or product, level or scope, location, company, already tracking, other). Recent decisions go into every scoring prompt.

Leads appear in the `/career` Leads tab as they qualify, capped at fifteen a day. Each run is logged in `job_agent_runs`; the Leads tab shows the latest. The first run stores the whole current set of postings as the baseline, so only new ones are scored after that.

## Coverage limits

- Only boards on Greenhouse, Lever and Ashby are read. LinkedIn, Indeed, Wellfound and Levels.fyi are not covered.
- Companies on their own career sites show `not_found` in `job_sources` until a reader is added.
- The scorer judges company health from what the model knows; it does not browse for recent news.

## Free mode: score with a Claude plan

The scoring step does not need an API key. A scheduled Claude Code cloud session on a Claude subscription can read the pending leads, write the evaluations itself and save them through the Supabase connector. The Vercel cron keeps doing discovery and surfacing. The runbook is [docs/claude/score-leads.md](../../docs/claude/score-leads.md); `scripts/leads.mjs` does the offline parts (brief, prompts, SQL generation) and the scores are computed by the same code as the API path.

## Operating

- Run a step by hand: `GET /api/job-scan?step=discover|score|surface&key=<CRON_SECRET>`.
- Vercel env: `CRON_SECRET`, `JOB_AGENT_SECRET` (its SHA-256 lives in `private.job_agent_config`), `ANTHROPIC_API_KEY` (only for scoring through the API). Optional `JOB_AGENT_MODEL` overrides the model; optional `JOB_AGENT_MIN_SCORE` lowers or raises the review bar (pay exceptions still need 90).

## Favorites and the stretch level

- **Favorite bump.** Companies in `companies.json` get points added after scoring: tier 1 +5, tier 2 +3, tier 3 +1 (`tier_bump` in `search.json`). It is a nudge, not a gate: any company can surface. The bump is stored in `evaluation.bump` and shown on the lead.
- **Stretch level.** Off by default (`title.stretch_level` is null). When set to a regex (for example plain "Senior"), matching titles are allowed only when the posting lists base pay of at least `pay.senior_min`, the score is `pay.senior_extra_score` above the normal bar, and the company is tier 1 or 2 or scores 8+ for company quality.
