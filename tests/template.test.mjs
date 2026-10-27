// Smoke tests for the template data: they prove the app loads and parses whatever is in knowledge/.
// They keep passing after you fill the templates in, and fail if a file you edit breaks the format.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const read = f => fs.readFileSync(new URL(f, root), 'utf8');

test('every document named in knowledge/profile.json exists', () => {
  const profile = JSON.parse(read('knowledge/profile.json'));
  for (const k of ['name', 'first_name', 'current_title', 'city', 'state', 'home_base', 'hybrid_areas', 'resume_library']) assert.ok(String(profile[k] || '').trim(), `profile.${k} is empty`);
  for (const k of ['subject', 'object', 'possessive']) assert.ok(profile.pronouns[k], `profile.pronouns.${k} is empty`);
  const files = [profile.resume_library, ...(profile.tailor_rules ? [profile.tailor_rules] : []), ...profile.sources.map(s => s.path)];
  for (const f of files) assert.ok(fs.existsSync(new URL(f, root)), `${f} is named in profile.json but missing`);
  assert.ok(profile.sources.some(s => s.path === profile.resume_library), 'the resume library must also be a source');
});

test('the resume library parses into an ordered set of roles with tagged bullets', () => {
  const tailor = require('../api/_lib/tailor.js');
  const { BASE } = tailor;
  assert.ok(BASE.name && BASE.contact && BASE.headline && BASE.summary, 'header, contact, headline and summary are all present');
  assert.ok(BASE.expertise.length >= 3, 'the Core expertise line has items separated by " · "');
  assert.ok(BASE.roles.length >= 2 && BASE.roles[0].id === 'R1');
  for (const r of BASE.roles) assert.ok(r.bullets.length > 0, `${r.id} has no bullets`);
  assert.ok(BASE.education, 'the Education section has content');
  assert.ok(BASE.headline.toLowerCase().startsWith(JSON.parse(read('knowledge/profile.json')).current_title.toLowerCase()), 'the headline must begin with current_title');
});

test('a resume composes from the library and passes the style-guide checks', () => {
  const { BASE, composeResume, checkDraft, enforce } = require('../api/_lib/tailor.js');
  const draft = {
    headline: BASE.headline, summary: BASE.summary, expertise: BASE.expertise.slice(0, 5),
    roles: BASE.roles.map((r, i) => ({ role_id: r.id, bullets: r.bullets.slice(0, i === 0 ? 1 : 0).map(b => ({ text: b.text, from: [b.id] })) })),
  };
  const md = composeResume(BASE, draft);
  assert.ok(md.startsWith('# ' + BASE.name) && md.includes('## Education'));
  assert.deepEqual(enforce(draft).draft.roles.length, BASE.roles.length);
  assert.ok(Array.isArray(checkDraft(draft)));
});

test('the tailor prompt carries the owner profile and every source', () => {
  const { SYSTEM } = require('../api/_lib/tailor.js');
  const profile = JSON.parse(read('knowledge/profile.json'));
  assert.ok(SYSTEM.includes(profile.name));
  for (const s of profile.sources) assert.ok(SYSTEM.includes(`<source name="${s.label}">`), s.label);
});

test('search.json compiles and the title and location filters behave', () => {
  const search = JSON.parse(read('knowledge/job-agent/search.json'));
  for (const group of [search.title, search.location]) for (const v of Object.values(group)) if (v && typeof v === 'object') assert.doesNotThrow(() => new RegExp(v.source, v.flags || ''));
  const agent = require('../api/_lib/job-agent.js');
  const company = { name: 'Example Co', boards: [] };
  assert.equal(agent.titleVerdict('Principal Product Manager, Growth', company), null);
  assert.equal(agent.titleVerdict('Graphic Designer', company), 'not a product management role');
  assert.equal(agent.locationVerdict('Remote - United States'), null);
  assert.ok(agent.locationVerdict('London, UK'));
});

test('the scoring prompt is the brief followed by the scoring instructions', () => {
  const agent = require('../api/_lib/job-agent.js');
  const prompt = agent.scoringSystemPrompt();
  assert.equal(prompt, read('knowledge/job-agent/rubric.md') + '\n' + read('knowledge/job-agent/scoring-instructions.md'));
  for (const h of ['## 1. Mission', '## 4. Compensation Expectations', '## 10. Personalized Scoring Model', 'Step 5: Recommendation']) assert.ok(prompt.includes(h), h);
});

test('the scan has boards to read even with no favorites', () => {
  const agent = require('../api/_lib/job-agent.js');
  assert.ok(Array.isArray(agent.COMPANIES));
  assert.ok(agent.ALL_COMPANIES.length > 100);
});

test('the scan handler and the schema are present', () => {
  assert.equal(typeof require('../api/job-scan.js'), 'function');
  const sql = read('supabase/schema.sql');
  for (const t of ['jobs', 'job_leads', 'job_agent_config', 'only_owner_signup']) assert.ok(sql.includes(t), t + ' is missing from schema.sql');
  const vercel = JSON.parse(read('vercel.json'));
  assert.equal(vercel.crons.length, 3);
  assert.ok(vercel.redirects.some(r => r.source === '/' && r.destination === '/career'));
});

test('the Claude-plan helper prints the brief and a lead prompt', async () => {
  const { briefText, promptsText, todayIn } = await import('../scripts/leads.mjs');
  const agent = require('../api/_lib/job-agent.js');
  assert.ok(briefText().startsWith(agent.scoringSystemPrompt()));
  const lead = { id: 7, company: 'Acme', title: 'Staff Product Manager', tier: 1, first_seen_at: '2026-10-22', source: 'greenhouse', url: 'https://x', description: 'd' };
  assert.match(promptsText([lead], [], '2026-10-24'), /^=== LEAD 7 ===/);
  assert.match(todayIn('America/New_York', new Date('2026-10-24T16:00:00Z')), /^2026-10-24$/);
});
