## How to answer

You are scoring ONE posting found by an automated daily scan of company job boards. You cannot browse. Judge the company only from what you reliably know, and say so when that knowledge is dated or uncertain. Never invent salary figures, dates or company facts. Score what the posting shows against the anchors below: do not inflate a score to reach a bar, and do not deflate it to be safe.

The brief above this section describes the candidate: experience (§2), target levels (§3), pay (§4), geography (§5), industries and products (§6), company preferences (§7) and the scoring model (§10). Every judgment below refers to that brief. If the brief leaves something open, say so in the report instead of guessing.

Work through these steps in order.

### Step 1: Eligibility (decides disqualifiers and work_arrangement)
- Eligible: a location in the home area or the hybrid and on-site areas the brief names in §5, or remote that allows the candidate's home area. "Remote, US", "Remote - United States", "Anywhere in the US" and a location list that includes the candidate's home area all count. A list of several cities is eligible when ANY entry is an eligible place under §5.
- Not eligible: on-site or hybrid only in a place §5 excludes; remote limited to named states or countries that exclude the home area; relocation the brief rules out. Set location_eligibility to "ineligible" and add a disqualifier.
- Use "likely" or "unclear" when the posting does not say. Say what is missing in location_note.

### Step 2: Is it the right kind of job?
- It must be the kind of job the brief's target levels (§3) and role description call for, with real ownership. Roles the brief names as poor fits (§6 deprioritization), scopes beyond the candidate's seniority guardrails (§3), or roles that only use fashionable vocabulary are disqualifiers, not low scores.
- Decide match_type honestly: "demonstrated" when the posting's core work matches experience in the brief (§2), "transferable" when adjacent experience clearly carries over, "stretch" when the candidate could plausibly succeed but lacks required background, "weak" when the gap is large.

### Step 3: Compensation
- Fill base_min and base_max only from figures stated in the posting: annual base in USD for the range that applies to an employee in the candidate's home area. Use null when no base pay is stated. Distinguish base from OTE, bonus and equity.

### Step 4: Score each category within its weight, using these anchors
- responsibilities_fit (0-25): demonstrated 19-25, transferable 12-18, stretch 6-11, weak 0-5. It must agree with match_type.
- product_interest (0-20): the product and problem sit in the brief's tier 1 interest areas (§6) 14-20; neutral, competent product with no pull, or tier 2 and 3 areas, 7-13; areas the brief deprioritizes 0-6. Do not confuse enthusiasm for a brand with enthusiasm for the work.
- career_progression (0-15): a level at or above the brief's highest-priority titles (§3) with real scope 11-15; a lateral move or narrower scope 6-10; below the target level 0-7.
- compensation (0-15): measure the top of the stated base range against the pay targets in §4. At or above the preferred base 13-15; within reach of it, as §4 describes 8-12; clearly below what §4 treats as acceptable 0-4; not stated 5-7. Strong equity or bonus can add a point or two.
- company_quality (0-10): stable, growing, well-run, and matching the brief's company criteria (§7) 8-10; mixed or unproven 5-7; layoffs, instability or unknown 0-4.
- work_arrangement (0-10): the candidate's preferred arrangement under §5, or remote that allows the home area 8-10; unclear 4-7; ineligible 0-2.
- freshness (0-5): posted within 14 days 4-5; 15-30 days 2-3; older or undated 0-2.

### Step 5: Recommendation
- Add the category scores in your head; the code recomputes the total. Then choose: "Strong Apply" when the total is 80 or more and there are no disqualifiers; "Worth Exploring" for 70-79 with no disqualifiers and no major tradeoff; "Conditional" for 70-79 where a real tradeoff remains; "Do not recommend" for anything below 70, any disqualifier, or when the honest answer to "would I advise the candidate to apply?" is no, including "interesting company, but the candidate would not want that job".
- Keep disqualifiers for hard constraints only (location, wrong kind of job, scope). Put softer worries in concerns, never in disqualifiers.

### Step 6: Write the report fields, short and specific
- why: two or three sentences connecting this position to the candidate's demonstrated experience.
- appeal: why the candidate might want it (product, company, responsibilities, growth, pay or personal interest).
- concerns: the most consequential tradeoffs, gaps, company risks or missing information.
- bottom_line: one decisive sentence on whether to apply and why.
- highlights: fit, appeal and watch_out are each a plain phrase of at most 12 words (no trailing period) naming the single most important point from why, appeal and concerns.

The prompt may list the candidate's recent decisions on earlier leads. Use them to calibrate, distinguishing one-off reactions to a single posting from enduring preferences; do not rule out a whole industry because the candidate rejected one company.
