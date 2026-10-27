// Daily job discovery scan, run by Vercel Cron (see vercel.json).
// Reads every company board: the favorites in knowledge/job-agent/companies.json (ranked, with a score bump)
// and every board in open-boards.json (found by scripts/discover-boards.mjs). Stores new
// postings in Supabase public.job_leads (hard-filtered ones as 'filtered'),
// scores pending leads with Claude, and moves at most DAILY_CAP of the best
// into 'review' for the /career Leads tab. Configure CRON_SECRET,
// JOB_AGENT_SECRET and ANTHROPIC_API_KEY in Vercel (or AI_GATEWAY_API_KEY for
// the Vercel AI Gateway). Free mode: with neither key, scoring is skipped here
// and done by the scheduled Claude task (docs/claude/score-leads.md).
const Anthropic = require('@anthropic-ai/sdk');
const { zodOutputFormat } = require('@anthropic-ai/sdk/helpers/zod');
const { z } = require('zod');
const agent = require('./_lib/job-agent');

const CONFIG = require('../public/shared/config.js');
const SUPABASE_URL = CONFIG.supabaseUrl;
const SUPABASE_KEY = CONFIG.supabaseKey;
// Opus 5.5 scores. A JOB_AGENT_COMPARE run on 12 earlier leads found Sonnet 5.5 scored the strongest ones 7–11 points
// lower, enough to keep good leads under the bar, while Opus with the same prompt matched its earlier scores.
// JOB_AGENT_MODEL overrides it, JOB_AGENT_COMPARE=<n> re-scores n earlier leads and reports the difference.
const MODEL = process.env.JOB_AGENT_MODEL || 'claude-opus-5-5';
const DAILY_CAP = Number(process.env.JOB_AGENT_DAILY_CAP) || 15;
const MIN_SCORE = Number(process.env.JOB_AGENT_MIN_SCORE) || 80;
const SCORE_LIMIT = Number(process.env.JOB_AGENT_SCORE_LIMIT) || 30;
const SCORE_CONCURRENCY = 8;
const BOARD_CONCURRENCY = 12;
const RECHECK_UNRESOLVED_MS = 7 * 86400000;

async function rpc(op, payload = {}) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/job_agent_rpc', {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ p_secret: process.env.JOB_AGENT_SECRET, p_op: op, p_payload: payload }),
  });
  if (!res.ok) throw new Error(`job_agent_rpc ${op}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function pool(items, size, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }));
  return results;
}

async function discover(stats) {
  const sources = new Map((await rpc('sources')).map(s => [s.company, s]));
  const now = Date.now();
  const savedSources = [];
  const fetchedCompanies = [];
  const fresh = [];

  await pool(agent.ALL_COMPANIES, BOARD_CONCURRENCY, async company => {
    const known = sources.get(company.name);
    if (known?.status === 'not_found' && now - new Date(known.last_checked_at).getTime() < RECHECK_UNRESOLVED_MS) return;
    try {
      const { board, postings } = await agent.readCompany(company, known?.status === 'ok' ? known.board : null);
      savedSources.push({ company: company.name, board, status: board ? 'ok' : 'not_found', jobs_seen: postings.length, last_error: null });
      if (!board) return;
      fetchedCompanies.push(company.name);
      stats.postings_total = (stats.postings_total || 0) + postings.length;
      // Favorites keep a row for every posting. Open boards only keep the ones that pass the cheap filters,
      // so a few hundred boards do not fill the table with rows nobody will ever read.
      for (const p of postings) if (!company.open || !agent.filterReason(p, company, now)) fresh.push({ company, board, posting: p });
    } catch (err) {
      savedSources.push({ company: company.name, board: known?.board || null, status: 'error', jobs_seen: null, last_error: String(err.message).slice(0, 300) });
    }
  });
  stats.boards_ok = fetchedCompanies.length;
  stats.boards_missing = savedSources.filter(s => s.status === 'not_found').length;
  stats.boards_error = savedSources.filter(s => s.status === 'error').length;
  stats.boards_open = fetchedCompanies.filter(n => agent.OPEN_COMPANIES.some(c => c.name === n)).length;
  stats.postings_seen = fresh.length;
  if (savedSources.length) await rpc('save_sources', { sources: savedSources });

  const keyed = fresh.map(f => ({ ...f, key: f.board + ':' + f.posting.ext_id }));
  const known = new Set();
  for (let i = 0; i < keyed.length; i += 500) {
    for (const k of await rpc('known', { keys: keyed.slice(i, i + 500).map(f => f.key) })) known.add(k);
  }
  if (fetchedCompanies.length) await rpc('close_missing', { companies: fetchedCompanies });

  const newOnes = keyed.filter(f => !known.has(f.key));
  const rows = await pool(newOnes, BOARD_CONCURRENCY, async ({ company, board, posting, key }) => {
    let reason = agent.filterReason(posting, company, now);
    if (!reason && posting._detail) {
      posting = await agent.fetchDetails(posting);
      reason = agent.filterReason(posting, company, now);
    }
    return {
      lead_key: key,
      company: company.name,
      title: posting.title,
      location: posting.location || null,
      url: posting.url,
      source: board.split(':')[0],
      tier: company.tier,
      posted_at: posting.posted_at,
      comp_text: posting.comp_text || null,
      base_min: posting.base_min ? Math.round(posting.base_min) : null,
      base_max: posting.base_max ? Math.round(posting.base_max) : null,
      description: reason ? null : (posting.description || '').slice(0, agent.DESCRIPTION_LIMIT),
      status: reason ? 'filtered' : 'pending',
      filter_reason: reason,
    };
  });
  stats.new_postings = rows.length;
  stats.new_pending = rows.filter(r => r.status === 'pending').length;
  for (let i = 0; i < rows.length; i += 200) await rpc('insert', { leads: rows.slice(i, i + 200) });
}

async function score(stats, req) {
  let client, model = MODEL;
  if (process.env.ANTHROPIC_API_KEY) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  } else if (process.env.AI_GATEWAY_API_KEY) {
    client = new Anthropic({ apiKey: process.env.AI_GATEWAY_API_KEY, baseURL: 'https://ai-gateway.vercel.sh' });
    model = 'anthropic/' + MODEL;
  } else {
    stats.score_skipped = 'No API key set: scoring runs in the scheduled Claude task (docs/claude/score-leads.md)';
    return;
  }
  const today = new Date().toLocaleDateString('en-CA', { timeZone: CONFIG.timezone });
  const [pending, feedback] = await Promise.all([rpc('pending', { limit: SCORE_LIMIT }), rpc('feedback', { limit: 25 })]);
  stats.scored = 0;
  stats.score_errors = [];
  const spend = stats.usage = { calls: 0, input: 0, cache_read: 0, cache_write: 0, output: 0, usd: 0, model };
  const tally = u => {
    if (!u) return;
    spend.calls++; spend.input += u.input_tokens || 0; spend.cache_read += u.cache_read_input_tokens || 0;
    spend.cache_write += u.cache_creation_input_tokens || 0; spend.output += u.output_tokens || 0;
    spend.usd = Math.round((spend.usd + (agent.usageCost(model, u) || 0)) * 10000) / 10000;
  };
  // Auth and billing failures (401/403) are not the posting's fault: stop the
  // run and leave the leads pending instead of spending their retry attempts.
  let blocked = null;
  await pool(pending, SCORE_CONCURRENCY, async lead => {
    if (blocked) return;
    try {
      const { evaluation, score, usage } = await agent.scoreLead(client, z, zodOutputFormat, model, lead, today, feedback);
      tally(usage);
      await rpc('save_score', {
        id: lead.id, status: 'scored', score, evaluation,
        base_min: evaluation.compensation.base_min, base_max: evaluation.compensation.base_max,
      });
      stats.scored++;
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
        blocked = blocked || err;
        return;
      }
      stats.score_errors.push(`${lead.company} — ${lead.title}: ${String(err.message).slice(0, 160)}`);
      await rpc('save_score', { id: lead.id, status: 'error', evaluation: { error: String(err.message).slice(0, 500) } });
    }
  });
  if (blocked) throw new Error('Model API refused the request: ' + String(blocked.message).slice(0, 300));
  const n = Number(process.env.JOB_AGENT_COMPARE) || 0;
  if (n > 0) await compare(client, model, today, feedback, stats, tally, n);
}

// Re-score n leads that an earlier model scored, with the current model and prompt, and report the differences.
// Nothing is saved: this only measures whether a model or prompt change moved the scores.
async function compare(client, model, today, feedback, stats, tally, n) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/job_agent_scored_sample', {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ p_secret: process.env.JOB_AGENT_SECRET, p_limit: n }),
  });
  if (!res.ok) { stats.compare = { error: `sample HTTP ${res.status}` }; return; }
  const sample = await res.json();
  const rows = await pool(sample, SCORE_CONCURRENCY, async lead => {
    try {
      const { evaluation, score, usage } = await agent.scoreLead(client, z, zodOutputFormat, model, lead, today, feedback);
      tally(usage);
      return { company: lead.company, title: lead.title.slice(0, 60), was: lead.score, now: score, was_rec: lead.recommendation, now_rec: evaluation.recommendation, was_match: lead.match_type, now_match: evaluation.match_type };
    } catch (err) { return { company: lead.company, error: String(err.message).slice(0, 120) }; }
  });
  const ok = rows.filter(r => r.now != null);
  stats.compare = {
    leads: ok.length,
    mean_abs_diff: ok.length ? Math.round(ok.reduce((a, r) => a + Math.abs(r.now - r.was), 0) / ok.length * 10) / 10 : null,
    mean_diff: ok.length ? Math.round(ok.reduce((a, r) => a + (r.now - r.was), 0) / ok.length * 10) / 10 : null,
    same_recommendation: ok.filter(r => r.now_rec === r.was_rec).length,
    same_side_of_70: ok.filter(r => (r.now >= 70) === (r.was >= 70)).length,
    rows,
  };
}

async function surface(stats) {
  const poolRows = await rpc('eligible_pool', { max_age_days: 14 });
  const eligible = poolRows.filter(l => !agent.surfaceBlocker(l, MIN_SCORE)).map(l => l.id);
  const surfaced = eligible.length ? await rpc('surface', { eligible_ids: eligible, daily_cap: DAILY_CAP, tz: CONFIG.timezone }) : [];
  stats.eligible = eligible.length;
  stats.surfaced = surfaced.length;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const secret = process.env.CRON_SECRET;
  const supplied = (req.headers.authorization || '').replace(/^Bearer /, '') || req.query?.key;
  if (!secret || supplied !== secret) return res.status(401).json({ error: 'Unauthorized' });
  if (!process.env.JOB_AGENT_SECRET) return res.status(503).json({ error: 'JOB_AGENT_SECRET is not set' });

  const startedAt = new Date().toISOString();
  const stats = {};
  const step = req.query?.step || 'all';
  try {
    if (step === 'all' || step === 'discover') await discover(stats);
    if (step === 'all' || step === 'score') await score(stats, req);
    if (step === 'all' || step === 'surface') await surface(stats);
  } catch (err) {
    stats.fatal = String(err.message).slice(0, 500);
  }
  await rpc('log_run', { started_at: startedAt, stats: { step, ...stats } }).catch(() => {});
  return res.status(stats.fatal ? 500 : 200).json(stats);
};
