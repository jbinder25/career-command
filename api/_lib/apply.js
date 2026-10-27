// Application helpers: is a posting still open, what does its form ask (Greenhouse only; Lever and Ashby
// do not publish their questions), and which questions code answers itself (contact, uploads, EEO) versus
// the ones the model drafts. Network calls only ever go to the three job-board APIs, with a validated
// slug and id, so a pasted URL cannot steer a request anywhere else.
const agent = require('./job-agent');

const SLUG = /^[a-z0-9][a-z0-9_-]{0,60}$/i;
const NUM_ID = /^\d{3,12}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIMEOUT_MS = 8000;

const stripTags = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

// Where could this posting live? Direct board URLs name the board; a company-hosted page with ?gh_jid=
// only gives the job id, so the board comes from the scan's company list or a guess from the name.
function candidates(url, company) {
  let u;
  try { u = new URL(String(url || '')); } catch (e) { return []; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return [];
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  const parts = u.pathname.split('/').filter(Boolean);
  const out = [];
  const add = (ats, slug, id, explicit) => {
    if (!slug || !id || !SLUG.test(slug)) return;
    if (ats === 'lever' || ats === 'ashby' ? !UUID.test(id) : !NUM_ID.test(id)) return;
    if (!out.some(c => c.ats === ats && c.slug === slug.toLowerCase() && c.id === id)) out.push({ ats, slug: slug.toLowerCase(), id, explicit });
  };
  if (/(^|\.)greenhouse\.io$/.test(host)) add('greenhouse', parts[0], parts[1] === 'jobs' ? parts[2] : u.searchParams.get('gh_jid'), true);
  else if (host === 'jobs.lever.co') add('lever', parts[0], parts[1], true);
  else if (host === 'jobs.ashbyhq.com') add('ashby', parts[0], parts[1], true);
  const ghid = u.searchParams.get('gh_jid');
  if (ghid && !out.length) {
    const known = (agent.COMPANIES.find(c => c.name.toLowerCase() === String(company || '').toLowerCase())?.boards || [])
      .filter(b => b.startsWith('greenhouse:')).map(b => b.slice('greenhouse:'.length));
    for (const s of known) add('greenhouse', s, ghid, true);
    for (const s of agent.slugGuesses(String(company || ''))) add('greenhouse', s, ghid, false);
  }
  return out;
}

async function getJson(url, fetchImpl) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, { signal: ctl.signal, headers: { accept: 'application/json', 'user-agent': 'career-console/1.0' } });
    if (res.status === 404) return { status: 404 };
    if (!res.ok) return { status: res.status };
    return { status: 200, json: await res.json() };
  } finally { clearTimeout(timer); }
}

// ---------- question handling ----------

const RULES = [
  ['upload', /\b(resume|cv|curriculum vitae)\b|cover letter|attach|upload/i],
  ['contact', /^(first|last|full|legal|preferred)?\s*name\b|\be-?mail\b|\bphone\b|\bmobile\b|linkedin|current (city|location)|^location\b|^city\b/i],
  ['eeo', /\b(gender|race|ethnicity|hispanic|veteran|disabilit|sexual orientation|pronouns|transgender|demographic)\b/i],
];
const FLAGS = [
  ['authorization', /authori[sz]ed to work|legally (authori[sz]ed|eligible|permitted)|right to work|work permit|eligib\w+ to work/i],
  ['sponsorship', /sponsor/i],
  ['clearance', /clearance/i],
  ['degree', /\b(degree|bachelor|master'?s|phd|education level)\b/i],
  ['years', /years of (relevant |professional |product |work )?experience|how many years/i],
  ['salary', /salary|compensation|pay (range|expectation)|expected (base|pay|salary)|desired (base|pay|salary)/i],
  ['location', /relocat|on-?site|in[- ]office|hybrid|commute|work from|reside|located/i],
  ['previous_employer', /(ever|previously|currently)\s+(been\s+)?(employed|worked|work)\b|former (employee|intern)|worked (at|for)\b/i],
  ['notice', /notice period|start date|available to start|earliest/i],
  ['legal', /\b(certify|attest|acknowledge|consent|privacy|agree to|opt[- ]?in|whatsapp|text messages?|sms)\b/i],
];

function classify(label, type) {
  const l = String(label || '');
  if (type === 'input_file') return { kind: 'upload', flag: null };
  for (const [kind, re] of RULES) if (re.test(l)) return { kind, flag: null };
  const flag = FLAGS.find(([, re]) => re.test(l));
  return { kind: 'draft', flag: flag ? flag[0] : null };
}

function normalizeGreenhouse(list) {
  return (list || []).map((q, i) => {
    const field = (q.fields || [])[0] || {};
    const options = (field.values || []).map(v => stripTags(v.label)).filter(Boolean).slice(0, 60);
    const label = stripTags(q.label) + (q.description ? ' ' + stripTags(q.description).slice(0, 300) : '');
    const type = (q.fields || []).some(f => f.type === 'input_file') && !(q.fields || []).some(f => f.type === 'textarea') ? 'input_file' : field.type || 'input_text';
    return { id: 'q' + (i + 1), label: stripTags(q.label) || label, hint: q.description ? stripTags(q.description).slice(0, 300) : '', required: !!q.required, type, options };
  }).filter(q => q.label);
}

// Pasted text -> questions. Blocks are separated by blank lines; a block's first line is the question and
// short lines under it are its options. A lone block with several lines of prose stays one question.
function parsePasted(text) {
  const blocks = String(text || '').replace(/\r/g, '').split(/\n\s*\n+/).map(b => b.split('\n').map(l => l.trim()).filter(Boolean)).filter(b => b.length);
  const looksQ = l => /\?$|^(\d+[.)]|q\d*[.:)])\s/i.test(l);
  const single = blocks.length === 1 && blocks[0].filter(looksQ).length >= 2;
  const groups = single ? blocks[0].map(l => [l]) : blocks;
  return groups.map((b, i) => {
    const label = b[0].replace(/^(\d+[.)]|q\d*[.:)]|[-*•])\s*/i, '').trim();
    const options = b.slice(1).map(l => l.replace(/^[-*•()\s\]\[xX]+/, '').trim()).filter(l => l && l.length <= 90);
    const choice = options.length >= 2 && options.length === b.length - 1;
    return { id: 'q' + (i + 1), label: choice ? label : [label, ...b.slice(1)].join(' '), hint: '', required: false, type: choice ? 'multi_value_single_select' : 'textarea', options: choice ? options : [] };
  }).filter(q => q.label);
}

// Code answers the questions it can; the rest go to the model with their flags.
function triage(questions, facts) {
  const done = [], draft = [];
  for (const q of questions) {
    const { kind, flag } = classify(q.label, q.type);
    if (kind === 'upload') done.push({ id: q.id, kind: 'skip', answer: '', option: '', reason: /cover/i.test(q.label) ? 'Upload your cover letter from Documents.' : 'Upload your tailored resume from Documents.' });
    else if (kind === 'contact') done.push({ id: q.id, ...contactAnswer(q.label, facts) });
    else if (kind === 'eeo') done.push({ id: q.id, kind: 'skip', answer: '', option: '', reason: 'Demographic question: optional and your own choice. Not drafted.' });
    else draft.push({ ...q, flag });
  }
  return { done, draft };
}

function contactAnswer(label, facts) {
  const l = label.toLowerCase();
  const pick = (answer, reason) => ({ kind: 'answer', answer, option: '', reason: reason || 'From your resume header.' });
  if (/first/.test(l)) return pick(facts.first);
  if (/last/.test(l)) return pick(facts.last);
  if (/name/.test(l)) return pick(facts.first + ' ' + facts.last);
  if (/mail/.test(l)) return pick(facts.email);
  if (/phone|mobile/.test(l)) return pick(facts.phone);
  if (/linkedin/.test(l)) return pick(facts.linkedin);
  if (/location|city/.test(l)) return pick(facts.location);
  return { kind: 'skip', answer: '', option: '', reason: 'Fill this one in directly.' };
}

// "Austin, TX · jane@example.com · 555.123.4567 · linkedin.com/in/jane" -> contact facts
function contactFacts(headerLine, name) {
  const bits = String(headerLine || '').split('·').map(s => s.trim());
  const [first, ...rest] = String(name || require('../../public/shared/config.js').ownerName).split(/\s+/);
  const li = bits.find(b => /linkedin\.com/i.test(b)) || '';
  return {
    first, last: rest.join(' '), location: bits.find(b => /,\s*[A-Z]{2}$/.test(b)) || '',
    email: bits.find(b => /@/.test(b)) || '', phone: bits.find(b => /\d{3}[.\s-]\d{3}[.\s-]\d{4}/.test(b)) || '',
    linkedin: li ? (/^https?:/.test(li) ? li : 'https://www.' + li) : '',
  };
}

// ---------- posting status ----------

async function check(c, fetchImpl) {
  try {
    if (c.ats === 'greenhouse') {
      const r = await getJson(`https://boards-api.greenhouse.io/v1/boards/${c.slug}/jobs/${c.id}?questions=true`, fetchImpl);
      if (r.status === 200) return { open: { ats: 'greenhouse', status: 'open', applyUrl: r.json.absolute_url || '', questions: normalizeGreenhouse(r.json.questions) } };
      return { gone: r.status === 404 && c.explicit };
    }
    if (c.ats === 'lever') {
      const r = await getJson(`https://api.lever.co/v0/postings/${c.slug}/${c.id}`, fetchImpl);
      if (r.status === 200) return { open: { ats: 'lever', status: 'open', applyUrl: r.json.applyUrl || '', questions: [], note: 'Lever does not publish its application questions. Paste them to draft answers.' } };
      return { gone: r.status === 404 };
    }
    const r = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${c.slug}`, fetchImpl);
    if (r.status !== 200) return { gone: false };
    const hit = (r.json.jobs || []).find(j => String(j.id).toLowerCase() === c.id.toLowerCase());
    if (hit) return { open: { ats: 'ashby', status: 'open', applyUrl: hit.applyUrl || '', questions: [], note: 'Ashby does not publish its application questions. Paste them to draft answers.' } };
    return { gone: true };
  } catch (e) { return { gone: false }; } // timeout or network: unknown, not closed
}

async function inspect(url, company, fetchImpl = fetch) {
  const cands = candidates(url, company).slice(0, 6);
  if (!cands.length) return { ats: 'unknown', status: 'unknown', questions: [], note: 'Not a Greenhouse, Lever or Ashby link, so there is nothing to check automatically.' };
  const results = await Promise.all(cands.map(c => check(c, fetchImpl)));
  const open = results.find(r => r.open);
  if (open) return open.open;
  const gone = results.some(r => r.gone);
  return { ats: cands[0].ats, status: gone ? 'closed' : 'unknown', questions: [], note: gone ? 'The job board no longer lists this posting.' : 'Could not reach the job board just now.' };
}

module.exports = { candidates, classify, normalizeGreenhouse, parsePasted, triage, contactFacts, contactAnswer, inspect, stripTags };
