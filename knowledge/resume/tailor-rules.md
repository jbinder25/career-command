<!--
HOW THIS FILE WORKS (for the owner's Claude agent; no coding needed).
The tailoring prompts in api/_lib/tailor.js are generic. This file holds the rules that only make sense
for ONE person's career: employer names, project names, topic tags, salary hints. Edit this file, never the code.
It is optional: with every section empty (as shipped) the tailor still works, using only the generic prompts.

Format: each "## name" heading starts a section; the text under it is inserted into the prompt at one fixed place.
Any section may be left empty or deleted, and the prompt simply omits that piece. An empty file is valid.
HTML comments like this one are ignored. Write plain sentences. These placeholders are filled in for you:
{first} (first name), {name} (full name), {title} (current title), {subject} (he/she/they), {possessive} (his/her/their).
Use the employer names, topic tags and role ids exactly as they appear in knowledge/resume/resume-library.md
(R1 is the first role listed there, R2 the second, and so on).

Sections:
  resume.emphasis    A phrase (no leading comma, no final period) completing "Decide the three or four needs this posting
                     stresses most, including ...": the kinds of need worth looking for.
  resume.leave-out   A phrase completing "bullets that do not serve this posting even if they are impressive (for example ...)".
  resume.vocabulary  Sentences added to the "mirror the posting's vocabulary" rule: wording that is accurate or forbidden.
  resume.rules       Extra numbered resume rules, ONE RULE PER LINE (a line can be long). Do not number them: the code numbers
                     them and renumbers the rules after them. Typical use: which library blocks or topic tags to prefer
                     for which kinds of posting.
  answers.salary     A phrase for the application-answers prompt, used as an example of a suggested "needs you" answer,
                     such as "a salary suggestion of $X or more".

Examples (delete the comment markers around one to use it):
  ## resume.emphasis
  hands-on data analysis or experimentation when the posting asks for it
  ## resume.leave-out
  older roles in an unrelated field
  ## resume.rules
  Prefer the bullets tagged data-platform (R1) for postings about analytics infrastructure.
  ## answers.salary
  a salary suggestion of $120,000 or more
-->

## resume.emphasis

## resume.leave-out

## resume.vocabulary

## resume.rules

## answers.salary
