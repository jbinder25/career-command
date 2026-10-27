# Resume library

`resume-library.md` is the master source for resumes and cover letters. It holds the owner's header, summary, expertise list and education, and a **library of approved bullets** for every role. It is deliberately longer than any one resume: tailoring picks a few bullets from it for each job.

Finished, job-specific versions are stored in Supabase (`documents` / `document_versions`, attached to a job through `job_documents`), not in this repo.

## File format (the tailor parses it, so keep this shape)

1. `# Full Name`, then the contact line as the first line under it, then the headline in `**bold**`.
   - Contact line: `City, ST · email · phone · linkedin.com/in/handle`, separated by ` · `. Application forms read the email, phone (ddd.ddd.dddd), LinkedIn and `City, ST` pieces from it.
   - Headline: it must begin with `current_title` from `knowledge/profile.json`.
2. `## Summary`: one paragraph.
3. `## Core expertise`: one line of items separated by ` · `. Tailored resumes choose up to 10 of them verbatim.
4. `## Experience`: for each employer a `### Company — City · what it does` heading, then for each role a line starting with `**Title** · Mon YYYY – Mon YYYY`, then its bullets. Roles are numbered R1, R2, ... in the order they appear; R1 is the current role.
5. `## Education`.

Do not put HTML comments or notes in the header, summary, expertise or education sections: every line there is used as content. Comments are safe inside `## Experience` (lines that start with `-`, `**` or `###` are the exception).

## How the library works

- Each bullet starts with a topic tag in backticks, e.g. `` `data-migration` ``. Bullets that share a topic are alternative wordings of the same achievement; a tailored resume uses at most one of them.
- The first line of the model's pick for a role is its strongest evidence for the posting. Bullets are chosen, lightly reworded, and never invented.
- Budget for a tailored resume (`style-guide.md`, enforced in `api/_lib/tailor.js`): at most 12 bullets and one page (about 450 words); R1 gets 4–6, R2 gets 2–4, each later role 0–2, each bullet at most 35 words.
- To add a bullet: put it under the right role with a topic tag (reuse an existing tag if it is a variant). It must be supported by `knowledge/career/career-source-of-truth.md` and follow `knowledge/claims.yaml` and `knowledge/rules/editorial.md`.
- To retire a bullet, delete its line. Bullet ids (R1.1, R1.2, …) are positions in this file and are regenerated on every request, so nothing else needs updating.

## Rules for tailoring

- Facts come only from the sources listed in `knowledge/profile.json`, under `knowledge/rules/editorial.md`.
- Choose, reorder and lightly reword; do not add skills, tools, metrics or responsibilities those sources do not support.
- Keep `internal_only` claims out of anything sent to an employer.
- Owner-specific prompt rules (employers, topic tags to prefer) go in `tailor-rules.md`.

## Application answers

`application-facts.md` holds the confirmed facts the application-answers step may use (location, pay target, contact details) and lists what it must never settle for the owner (work authorization, sponsorship, start date and similar).
