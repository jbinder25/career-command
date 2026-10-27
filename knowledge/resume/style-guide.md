# Resume and cover letter style guide

These rules are sent to the model with every tailoring request and enforced in code (`api/_lib/tailor.js`). Edit this file to change the house style. The generic rules below work for most people; the "Approved characterizations" section is the one to fill in.

## The principle: choose from the library, don't add

`resume-library.md` holds every approved bullet for every role: far more than fit on a resume, with several wordings of the same achievement. A tailored resume is a small, deliberate selection from that library for one role. It is never the whole library, and never a new bullet for every requirement in the posting.

- Pick the three or four needs the posting stresses most. For each, pick the one or two library bullets that prove it best. Everything else stays in the library, unused.
- Bullets with the same topic tag are variants of one achievement. Use at most one per topic: the variant that reads best for this role, lightly tightened.
- A requirement the library does not evidence is a gap, not a bullet. Say so in the gap notes; do not invent or stretch a bullet to cover it.
- If the sources support a strong fact the library lacks, suggest adding it to the library for the owner to approve. Do not put it in this draft.
- Never split one library bullet into several, and never use the same bullet twice.

## Sell, honestly

The goal is an interview. Honest means nothing invented: no skill, title, number, tool or outcome the sources do not support, and no metric moved between programs. It does not mean volunteering weaknesses.

- Write in the owner's voice: lead with the action and the scope the owner drove, and use the strongest wording the facts support. Prefer "led", "built", "defined", "drove" to "contributed to" or "supported".
- Never put hedges or disclaimers in the resume or letter: no "hypothesis pending validation", "small sample", "not yet measured", "limited", "exposure to", "familiar with", "attempted". The caveats in `claims.yaml` and the evidence files are guardrails for the writer (what not to claim), not text for the document. The owner answers detail questions in the interview.
- Choose the framing that serves the posting. Where a requirement is only partly met, lead with the adjacent strength that is true and leave the rest unsaid; do not apologize or explain what is missing.
- Take credit for judgment and leadership. Company results stay worded as the claims index allows, but the owner's role in them is stated plainly and confidently.

## Length and budget

- **One page.** About 450 words for the whole resume, never over 470 (the code enforces this, and the layout is sized for it).
- Bullets, most recent role first: the current role 4–6, the second role 2–4, each earlier role 0–2. No more than 12 in total, however many the library holds.
- Older roles shrink first. Anything more than eight years old gets at most two bullets.
- **Never a header without bullets.** A role (or company) with no bullets is left out of the resume entirely.
- Summary: 2–3 sentences, 55 words or fewer, no first person.
- Expertise line: 10 items or fewer, chosen from the library's list and ordered by relevance to the posting.

## Writing a bullet

- About 30 words, never more than 35: one or two lines. One idea per bullet.
- Start with a strong verb. Use one tense within a bullet: present for ongoing responsibilities in the current role, past for finished work. If a library bullet mixes tenses, fix it when you reword it. Avoid "responsible for", "helped", "worked on", "assisted".
- Cut generic bullets that name no outcome or scope, and bullets that do not serve this posting even when they are impressive.
- Lead with the action and the outcome, then the scope. Do not start consecutive bullets with the same verb.
- Use approved metrics only (`knowledge/claims.yaml`), attached to their own program and era. Never add a number that is not in the source bullet. One number per bullet is usually enough.
- Say what the owner did and led, not what the team or company achieved, unless the claim is marked public.
- No filler adjectives ("dynamic", "passionate", "results-driven", "innovative") and no first-person pronouns.

## Keywords

- Mirror the posting's exact terms where they are true, inside existing bullets, the summary and the expertise order. Do not add a skill, tool or phrase the sources do not support.
- Eight swaps at most. Never repeat a keyword to hit a count.
- The drafting screen lists every word a draft added that is not in the library, so each can be checked.

## Approved characterizations

<!-- TODO (ONBOARDING.md): list wording the sources support and a draft may use, and wording it must not use.
     Examples of the kind of line that belongs here:
     - "<Company>'s self-service products are B2B and paid; never call them consumer products."
     - "The owner managed up to three people at a time; never imply managing managers."
     - "Public claims about <product> are the company's, not the owner's own measurements."
     Delete these comments and this note once you have written your own, or leave the section empty. -->

(None yet.)

## Cover letter

- 250–330 words, three or four short paragraphs, addressed to the hiring team unless a person is named in the posting.
- Do not restate the resume. Open with a specific reason for this company and role, add one or two proof points chosen for this role's biggest need, then how the owner would approach the first months, then a short close.
- Address a gap only when the owner marked it, briefly and confidently: lead with the closest real strength, no apology or disclaimer.
- No clichés ("I am excited to apply", "perfect fit", "passionate about"), no exclamation marks, no claims of passion the sources cannot ground.
