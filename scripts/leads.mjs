#!/usr/bin/env node
// Helper for scoring job leads inside a Claude Code session (no database access: the session moves JSON
// between Supabase and this script). See docs/claude/score-leads.md and docs/claude/email-leads.md.
//   node scripts/leads.mjs brief
//   node scripts/leads.mjs prompts <pending.json> [feedback.json]
//   node scripts/leads.mjs finalize <pending.json> <evaluations.json>
//   node scripts/leads.mjs surface <pool.json>
//   node scripts/leads.mjs email-dupes <items.json>
//   node scripts/leads.mjs email-match <items.json> <dupes.json>    (reads public job boards)
//   node scripts/leads.mjs email-save <match.json> [found.json]
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const agent = require('../api/_lib/job-agent.js');
const { z } = require('zod');

export const MODEL_LABEL = 'claude-plan';

export function timezone() {
  try { return require('../public/shared/config.js').timezone || 'America/New_York'; } catch { return 'America/New_York'; }
}

export const todayIn = (tz = timezone(), now = new Date()) => now.toLocaleDateString('en-CA', { timeZone: tz });

// execute_sql results arrive wrapped ([{"job_agent_op": ...}], strings, {"result": ...}); peel single-key layers.
export function unwrap(value) {
  let v = value;
  for (let i = 0; i < 6; i++) {
    if (typeof v === 'string') { try { v = JSON.parse(v); continue; } catch { return v; } }
    if (Array.isArray(v) && v.length === 1 && v[0] && typeof v[0] === 'object' && !Array.isArray(v[0]) && Object.keys(v[0]).length === 1) { v = Object.values(v[0])[0]; continue; }
    if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 1) { v = Object.values(v)[0]; continue; }
    break;
  }
  return v;
}

const readJson = file => unwrap(JSON.parse(fs.readFileSync(file, 'utf8')));
const asList = (v, what) => { if (!Array.isArray(v)) throw new Error(what + ' must be a JSON array'); return v; };

export function briefText() {
  return [
    agent.scoringSystemPrompt(),
    '',
    '=== OUTPUT SCHEMA (one evaluation per lead, JSON Schema) ===',
    JSON.stringify(z.toJSONSchema(agent.scoringSchema(z)), null, 2),
  ].join('\n');
}

export function promptsText(leads, feedback, today) {
  return leads.map(lead => `=== LEAD ${lead.id} ===\n${agent.postingPrompt(lead, today, feedback)}`).join('\n\n');
}

// A dollar-quote tag that does not occur in the payload, so the payload cannot end the literal early.
export function dollarQuote(text) {
  for (const tag of ['json', 'jobagent', 'payload']) if (!text.includes('$' + tag + '$')) return tag;
  for (;;) {
    const tag = 'q' + crypto.randomBytes(6).toString('hex');
    if (!text.includes('$' + tag + '$')) return tag;
  }
}

export const opSql = (op, payload) => {
  const text = JSON.stringify(payload);
  const tag = dollarQuote(text);
  return `select private.job_agent_op('${op}', $${tag}$${text}$${tag}$::jsonb);`;
};

// -> { sql: [statements], errors: [messages] }
export function finalizeSql(leads, evaluations) {
  const byId = new Map(leads.map(l => [String(l.id), l]));
  const sql = [], errors = [];
  for (const item of evaluations) {
    const lead = byId.get(String(item?.id));
    if (!lead) { errors.push(`LEAD ${item?.id}: unknown id (not in the pending file)`); continue; }
    const parsed = agent.scoringSchema(z).safeParse(item.evaluation);
    if (!parsed.success) {
      errors.push(`LEAD ${lead.id}: invalid evaluation\n` + parsed.error.issues.map(i => `  - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n'));
      continue;
    }
    const { evaluation, score } = agent.finalizeEvaluation(lead, parsed.data, MODEL_LABEL);
    sql.push(opSql('save_score', {
      id: lead.id, status: 'scored', score, evaluation,
      base_min: evaluation.compensation.base_min, base_max: evaluation.compensation.base_max,
    }));
  }
  return { sql, errors };
}

export function surfaceSql(pool, { minScore = 80, cap = 15, tz = timezone() } = {}) {
  const ids = pool.filter(lead => !agent.surfaceBlocker(lead, minScore)).map(lead => lead.id);
  if (!ids.length) return '-- nothing eligible';
  return opSql('surface', { eligible_ids: ids, daily_cap: cap, tz });
}

// ---------- leads from email (docs/claude/email-leads.md) ----------

// One job the session read out of an email. Alerts list postings; recruiter items are a person reaching out.
const emailItem = z.object({
  kind: z.enum(['alert', 'recruiter']),
  source: z.string().min(1),
  email_id: z.string().regex(/^[A-Za-z0-9_-]+$/),
  received_at: z.string().min(1),
  company: z.string().nullish(),
  title: z.string().nullish(),
  location: z.string().nullish(),
  comp_text: z.string().nullish(),
  url: z.string().nullish(),
  recruiter: z.string().nullish(),
  channel: z.string().nullish(),
  message: z.string().nullish(),
});

// A posting the session found on the company's own site for an unmatched item.
const foundPosting = z.object({
  i: z.number().int(),
  url: z.string().url(),
  description: z.string().min(200),
  title: z.string().nullish(),
  location: z.string().nullish(),
  posted_at: z.string().nullish(),
  comp_text: z.string().nullish(),
  base_min: z.number().nullish(),
  base_max: z.number().nullish(),
});

// Same as private.norm_key() in supabase/schema.sql.
export const normKey = s => String(s || '').toLowerCase()
  .replace(/\b(inc|llc|ltd|corp|corporation|co|the)\b/g, '').replace(/[^a-z0-9]/g, '');

const cleanCompany = name => String(name).replace(/,?\s+(inc|llc|ltd|corp|corporation)\.?$/i, '').trim();

const LEVELS = ['senior', 'staff', 'principal', 'lead', 'group', 'director', 'head', 'vp', 'chief', 'manager', 'management'];
const titleWords = t => String(t || '').toLowerCase().replace(/&/g, ' and ').replace(/\bsr\b\.?/g, 'senior')
  .replace(/\bmgr\b/g, 'manager').replace(/\bpm\b/g, 'product manager').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);

// The board posting that is the same job as an email title: same words, or nearly the same words at the same level.
export function matchPosting(postings, title, location) {
  const want = titleWords(title);
  if (!want.length) return null;
  const wantSet = new Set(want), wantLevels = want.filter(w => LEVELS.includes(w)).sort().join(' ');
  const scored = postings.map(p => {
    const have = titleWords(p.title), haveSet = new Set(have);
    if (have.join(' ') === want.join(' ')) return { p, sim: 1 };
    if (have.filter(w => LEVELS.includes(w)).sort().join(' ') !== wantLevels) return null;
    const inter = [...wantSet].filter(w => haveSet.has(w)).length;
    const sim = inter / new Set([...wantSet, ...haveSet]).size;
    return sim >= 0.8 ? { p, sim } : null;
  }).filter(Boolean);
  if (!scored.length) return null;
  const locWords = new Set(titleWords(location));
  const rank = ({ p, sim }) => sim * 10 + (agent.locationVerdict(p.location, p) ? 0 : 2)
    + titleWords(p.location).filter(w => locWords.has(w)).length / 10;
  return scored.sort((a, b) => rank(b) - rank(a))[0].p;
}

export function parseItems(raw) {
  const items = [], errors = [];
  asList(raw, 'items file').forEach((x, i) => {
    const r = emailItem.safeParse(x);
    if (r.success) items.push({ ...r.data, i });
    else errors.push(`item ${i}: ` + r.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; '));
  });
  return { items, errors };
}

export function emailDupesSql(items) {
  const keyed = items.filter(x => x.company && x.title).map(({ i, company, title }) => ({ i, company, title }));
  return keyed.length ? opSql('dupes', { items: keyed }) : '-- nothing to check';
}

const recruiterNote = item => `Recruiter outreach: ${item.recruiter || 'a recruiter'} wrote on ${String(item.received_at).slice(0, 10)}`
  + ` (${item.channel || 'email'}).` + (item.message ? ` Their message: ${item.message}` : '');

// An insert-ready job_leads row, in the same shape as the daily scan's.
export function leadRow(item, { company, lead_key, posting, now = Date.now() }) {
  // Alerts pass the same hard filters as the scan. A recruiter reaching out always gets a real look.
  const reason = item.kind === 'alert' ? agent.filterReason(posting, company, now) : null;
  const description = [item.kind === 'recruiter' ? recruiterNote(item) : null, posting.description].filter(Boolean).join('\n\n');
  return {
    lead_key, company: company.name, title: posting.title, location: posting.location || null, url: posting.url,
    source: item.kind === 'recruiter' ? 'recruiter' : item.source, tier: company.tier ?? null,
    posted_at: posting.posted_at || null, comp_text: posting.comp_text || null,
    base_min: posting.base_min ? Math.round(posting.base_min) : null, base_max: posting.base_max ? Math.round(posting.base_max) : null,
    description: reason ? null : description.slice(0, agent.DESCRIPTION_LIMIT),
    status: reason ? 'filtered' : 'pending', filter_reason: reason,
  };
}

const findCompany = name => agent.ALL_COMPANIES.find(c => normKey(c.name) === normKey(name)) || { name: cleanCompany(name), tier: null };

// -> { leads: [{i, row}], unmatched: [{i, item, note}], skipped: [{i, reason}] }
export async function matchItems(items, dupes, { read = agent.readCompany, details = agent.fetchDetails, now = Date.now() } = {}) {
  const dup = new Map(asList(dupes, 'dupes file').map(d => typeof d === 'object' ? [d.i, d] : [d, { i: d }]));
  const out = { leads: [], unmatched: [], skipped: [] };
  // The same job often arrives in several emails; keep one, preferring a recruiter's (it carries their note).
  const seen = new Map();
  for (const item of items) {
    const key = item.company && item.title ? normKey(item.company) + '|' + normKey(item.title) : 'email:' + item.i;
    const prev = seen.get(key);
    if (!prev) { seen.set(key, item); continue; }
    if (item.kind === 'recruiter' && prev.kind !== 'recruiter') { seen.set(key, item); out.skipped.push({ i: prev.i, reason: `same job as item ${item.i}` }); }
    else out.skipped.push({ i: item.i, reason: `same job as item ${prev.i}` });
  }
  const boards = new Map();
  for (const item of seen.values()) {
    const d = dup.get(item.i);
    if (d) { out.skipped.push({ i: item.i, reason: `already ${d.kind === 'tracker' ? 'in your tracker' : 'a lead'}${d.status ? ' (' + d.status + ')' : ''}` }); continue; }
    if (!item.company || !item.title) { out.unmatched.push({ i: item.i, item, note: 'company or title not named', search: !!item.company }); continue; }
    const company = findCompany(item.company);
    if (!boards.has(company.name)) boards.set(company.name, await read(company, null).catch(() => ({ board: null, postings: [] })));
    const { board, postings } = boards.get(company.name);
    const hit = board && matchPosting(postings, item.title, item.location);
    if (!hit) {
      // Worth a web search only when the company has no board we can read (a board that does not list it has
      // most likely closed it) and, for alerts, the title and location pass the hard filters.
      const filter = item.kind === 'alert' ? agent.titleVerdict(item.title, company) || agent.locationVerdict(item.location, {}) : null;
      const note = board ? `not listed on ${board}, probably closed` : filter ? `filtered: ${filter}` : 'no readable job board';
      out.unmatched.push({ i: item.i, item, note, search: !board && !filter, closed: !!board });
      continue;
    }
    const posting = await details(hit).catch(() => hit);
    out.leads.push({ i: item.i, row: leadRow(item, { company, lead_key: board + ':' + posting.ext_id, posting, now }) });
  }
  return out;
}

// Lead key for a posting known only by its URL: the job id on LinkedIn or Glassdoor, else the bare URL.
export function urlKey(url, fallback) {
  const u = String(url || '');
  let m = u.match(/linkedin\.com\/(?:comm\/)?jobs\/view\/(\d+)/);
  if (m) return 'linkedin:' + m[1];
  m = u.match(/glassdoor\.com\/.*[?&](?:jl|jobListingId)=(\d+)/);
  if (m) return 'glassdoor:' + m[1];
  try { const x = new URL(u); return 'web:' + (x.host + x.pathname).toLowerCase().replace(/\/+$/, ''); } catch { return fallback; }
}

// -> { sql: [statements], report: [lines], errors: [messages] }
export function emailSaveSql(match, found = [], { now = Date.now() } = {}) {
  const rows = match.leads.map(l => l.row), outreach = [], report = [], errors = [];
  const byI = new Map();
  for (const f of asList(found, 'found file')) {
    const r = foundPosting.safeParse(f);
    if (r.success) byI.set(r.data.i, r.data);
    else errors.push(`found ${f?.i}: ` + r.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; '));
  }
  for (const { i, item, note, closed } of match.unmatched) {
    const f = byI.get(i);
    const company = item.company ? findCompany(item.company) : null;
    if (f && company) {
      const posting = { title: f.title || item.title, location: f.location || item.location, url: f.url, posted_at: f.posted_at,
        comp_text: f.comp_text || item.comp_text, base_min: f.base_min, base_max: f.base_max, description: f.description };
      rows.push(leadRow(item, { company, lead_key: urlKey(f.url, 'email:' + item.email_id + ':' + i), posting, now }));
      report.push(`item ${i}: found the posting at ${f.url}`);
    } else if (item.kind === 'recruiter') {
      outreach.push({
        email_id: item.email_id, company: item.company || null, title: item.title || null, recruiter: item.recruiter || null,
        channel: item.channel || 'Email', url: item.url || null, received_at: item.received_at,
        summary: (item.message || '').slice(0, 1000), details: item.message || null,
      });
      report.push(`item ${i}: recruiter outreach from ${item.recruiter || 'unknown'} (${note}), added to the tracker unscored`);
    } else if (closed) {
      report.push(`item ${i}: ${item.company} — ${item.title} ${note}, skipped`);
    } else if (company && item.title) {
      // An alert whose posting could not be found: score it on what the email says, and say so.
      // (Alerts the hard filters drop are saved as filtered, so later runs know them.)
      const listed = [`Title: ${item.title}`, `Company: ${item.company}`, item.location && `Location: ${item.location}`, item.comp_text && `Pay: ${item.comp_text}`].filter(Boolean).join('\n');
      const posting = { title: item.title, location: item.location, url: item.url || '', comp_text: item.comp_text,
        description: `Job description not available: this lead came from a ${item.source} job alert email and the posting could not be found on the company's own site. What the email listed:\n${listed}` };
      if (!posting.url) { report.push(`item ${i}: alert without a link, skipped`); continue; }
      const row = leadRow(item, { company, lead_key: urlKey(item.url, 'email:' + item.email_id + ':' + i), posting, now });
      rows.push(row);
      report.push(row.status === 'filtered' ? `item ${i}: ${row.filter_reason}, saved as filtered`
        : `item ${i}: posting not found (${note}), saved from the alert details only`);
    } else report.push(`item ${i}: alert without company or title, skipped`);
  }
  const sql = [];
  for (let k = 0; k < rows.length; k += 25) sql.push(opSql('insert', { leads: rows.slice(k, k + 25) }));
  if (outreach.length) sql.push(opSql('add_outreach', { items: outreach }));
  const pending = rows.filter(r => r.status === 'pending').length;
  report.unshift(`${rows.length} lead(s) to insert (${pending} pending, ${rows.length - pending} filtered), ${outreach.length} recruiter outreach`);
  return { sql, report, errors };
}

async function main(argv) {
  const [cmd, a, b] = argv;
  if (cmd === 'brief') { console.log(briefText()); return 0; }
  if (cmd === 'prompts' && a) {
    const leads = asList(readJson(a), 'pending file');
    const feedback = b ? asList(readJson(b), 'feedback file') : [];
    console.log(promptsText(leads, feedback, todayIn()));
    return 0;
  }
  if (cmd === 'finalize' && a && b) {
    const { sql, errors } = finalizeSql(asList(readJson(a), 'pending file'), asList(readJson(b), 'evaluations file'));
    if (sql.length) console.log(sql.join('\n'));
    for (const e of errors) console.error(e);
    return errors.length ? 2 : 0;
  }
  if (cmd === 'surface' && a) {
    console.log(surfaceSql(asList(readJson(a), 'pool file'), {
      minScore: Number(process.env.JOB_AGENT_MIN_SCORE) || 80,
      cap: Number(process.env.JOB_AGENT_DAILY_CAP) || 15,
    }));
    return 0;
  }
  if (cmd === 'email-dupes' && a) {
    const { items, errors } = parseItems(readJson(a));
    for (const e of errors) console.error(e);
    if (errors.length) return 2;
    console.log(emailDupesSql(items));
    return 0;
  }
  if (cmd === 'email-match' && a && b) {
    const { items, errors } = parseItems(readJson(a));
    for (const e of errors) console.error(e);
    if (errors.length) return 2;
    const out = await matchItems(items, readJson(b));
    console.log(JSON.stringify(out, null, 2));
    console.error(`${out.leads.length} matched on a job board, ${out.unmatched.length} unmatched, ${out.skipped.length} skipped`);
    for (const u of out.unmatched) console.error(`  unmatched ${u.i}${u.search ? ' [search]' : ''}: ${u.item.company || '?'} — ${u.item.title || '?'} (${u.note})`);
    return 0;
  }
  if (cmd === 'email-save' && a) {
    const { sql, report, errors } = emailSaveSql(readJson(a), b ? readJson(b) : []);
    for (const e of errors) console.error(e);
    if (errors.length) return 2;
    if (sql.length) console.log(sql.join('\n'));
    for (const line of report) console.error(line);
    return 0;
  }
  console.error('usage: leads.mjs brief | prompts <pending.json> [feedback.json] | finalize <pending.json> <evaluations.json> | surface <pool.json>'
    + ' | email-dupes <items.json> | email-match <items.json> <dupes.json> | email-save <match.json> [found.json]');
  return 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  main(process.argv.slice(2)).then(code => { process.exitCode = code; }, err => { console.error(err.message); process.exitCode = 1; });
}
