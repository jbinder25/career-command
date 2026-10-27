// Tailor a resume and cover letter to one job (POST, behind the site login gate).
// Four independent steps: "answers" drafts the application-form answers (code handles contact and upload
// fields, the model drafts the rest, the owner's-call topics always come back as "needs_you"); "gap" is the optional requirement-by-requirement fit
// check; "resume" selects bullets from the library under the style guide's
// budget (one retry with the violations spelled out, then deterministic
// trimming); "letter" writes the cover letter (one retry on style problems).
// The browser calls only the ones the owner asked for, resume and letter in parallel.
// Saving to Supabase happens in the browser.
const Anthropic = require('@anthropic-ai/sdk');
const { zodOutputFormat } = require('@anthropic-ai/sdk/helpers/zod');
const { z } = require('zod');
const tailor = require('./_lib/tailor');
const apply = require('./_lib/apply');

const MODEL = process.env.TAILOR_MODEL || 'claude-opus-5-5';
// The optional fit check only classifies requirements, so a faster model at low effort is enough.
const GAP_MODEL = process.env.TAILOR_GAP_MODEL || 'claude-sonnet-5-5';

async function ask(client, model, effort, maxTokens, schema, messages) {
  const response = await client.messages.parse({
    model,
    max_tokens: maxTokens,
    output_config: { effort, format: zodOutputFormat(schema) },
    system: [{ type: 'text', text: tailor.SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages,
  });
  if (response.stop_reason === 'refusal') throw Object.assign(new Error('The model declined this request.'), { status502: true });
  if (!response.parsed_output) throw Object.assign(new Error('The model returned an unreadable result; try again.'), { status502: true });
  return response.parsed_output;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'ANTHROPIC_API_KEY is not set' });
  const { step, job, gaps, answers, vetting, questions, questions_text } = req.body || {};
  if (!job || !job.company || !job.title) return res.status(400).json({ error: 'Company and role are required' });
  if (String(job.description || '').trim().length < 200) return res.status(400).json({ error: 'Paste the full job description (at least a few paragraphs).' });
  if (!['gap', 'resume', 'letter', 'answers'].includes(step)) return res.status(400).json({ error: 'Unknown step' });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    if (step === 'gap') {
      return res.status(200).json(await ask(client, GAP_MODEL, 'low', 8000, tailor.gapSchema(z), tailor.gapMessages(job)));
    }
    if (step === 'answers') {
      const raw = Array.isArray(questions) ? questions : apply.parsePasted(String(questions_text || '').slice(0, 20000));
      const list = raw.slice(0, 40).map((q, i) => ({
        id: String(q.id || 'q' + (i + 1)).slice(0, 20), label: String(q.label || '').slice(0, 600), hint: '', required: !!q.required,
        type: String(q.type || 'text').slice(0, 40), options: Array.isArray(q.options) ? q.options.slice(0, 60).map(o => String(o).slice(0, 120)) : [],
      })).filter(q => q.label);
      if (!list.length) return res.status(400).json({ error: 'Add at least one application question.' });
      const split = apply.triage(list.map(q => ({ ...q, flag: undefined })), apply.contactFacts(tailor.BASE.contact, tailor.BASE.name));
      const asked = split.draft.map(q => ({ ...q, flag: apply.classify(q.label, q.type).flag }));
      let model = { answers: [], knockouts: [], summary: '' }, enforced = [];
      if (asked.length) {
        const schema = tailor.answersSchema(z);
        model = await ask(client, MODEL, 'medium', 12000, schema, tailor.answersMessages(job, asked, vetting));
        let violations = tailor.checkAnswers(model, asked);
        if (violations.length) {
          model = await ask(client, MODEL, 'medium', 12000, schema, tailor.answersMessages(job, asked, vetting, { violations, previous: model }));
          violations = tailor.checkAnswers(model, asked);
        }
        if (violations.length) {
          const fixed = tailor.enforceAnswers(model, asked);
          model = fixed.result; enforced = fixed.notes;
          console.warn('tailor: enforced answers after retry', violations.slice(0, 5));
        }
      }
      const byId = new Map([...split.done, ...model.answers].map(a => [a.id, a]));
      return res.status(200).json({
        answers: list.map(q => ({ ...q, flag: apply.classify(q.label, q.type).flag, ...(byId.get(q.id) || { kind: 'needs_you', answer: '', option: '', reason: 'No draft came back for this one.' }) })),
        knockouts: model.knockouts || [], summary: model.summary || '', enforced,
      });
    }
    if (step === 'letter') {
      const schema = tailor.letterSchema(z);
      let letter = (await ask(client, MODEL, 'medium', 6000, schema, tailor.letterMessages(job, gaps, answers, vetting))).cover_letter_markdown;
      let violations = tailor.checkLetter(letter);
      if (violations.length) {
        letter = (await ask(client, MODEL, 'medium', 6000, schema, tailor.letterMessages(job, gaps, answers, vetting, { violations, previous: letter }))).cover_letter_markdown;
        violations = tailor.checkLetter(letter);
      }
      return res.status(200).json({ cover_letter_markdown: tailor.composeLetter(tailor.BASE, letter), warnings: violations });
    }
    const schema = tailor.resumeSchema(z);
    let draft = await ask(client, MODEL, 'medium', 12000, schema, tailor.resumeMessages(job, gaps, vetting));
    let violations = tailor.checkDraft(draft);
    let retried = false;
    if (violations.length) {
      retried = true;
      draft = await ask(client, MODEL, 'medium', 12000, schema, tailor.resumeMessages(job, gaps, vetting, { violations, previous: draft }));
      violations = tailor.checkDraft(draft);
    }
    const notes = [];
    if (violations.length) {
      const fixed = tailor.enforce(draft);
      draft = fixed.draft;
      notes.push(...fixed.notes);
      console.warn('tailor: enforced budget after retry', violations.slice(0, 5));
    }
    const bullets = draft.roles.reduce((n, r) => n + r.bullets.length, 0);
    return res.status(200).json({
      resume_markdown: tailor.composeResume(tailor.BASE, draft),
      changes: [...draft.changes, ...notes],
      unaddressed_gaps: draft.unaddressed_gaps,
      suggested_base_additions: draft.suggested_base_additions,
      wording_changes: tailor.wordingChanges(draft),
      stats: { bullets, retried, words: tailor.resumeWords(tailor.composeResume(tailor.BASE, draft)) },
    });
  } catch (err) {
    console.error('tailor', step, err);
    if (err.status502) return res.status(502).json({ error: err.message });
    return res.status(502).json({ error: err instanceof Anthropic.APIError ? `Model API error (${err.status})` : 'Tailoring failed' });
  }
};
