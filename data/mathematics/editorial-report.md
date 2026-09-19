# Mathematics skill catalogue

The source datasets retain their original objective IDs and source wording.
The derived catalogue splits selected compound objectives into teachable skills
and groups inspected equivalent skills while preserving each syllabus appearance.

The current build contains 1,031 skills and 1,486 appearances from 1,082 original
objectives across 12 pathways. Editorial decisions split 264 source objectives
and explicitly retain 95. All 313 original decomposition flags have a decision;
46 additional objectives were considered during the scan for compound content.
The equivalence file records decisions for 158 candidate groups requiring
comparison beyond the assembler's exact-match rule.

All original objectives remain represented. Source references and inherited
constraints are preserved on every appearance. There are 27 source-uncertain
appearances derived from the 16 original Additional Mathematics Sec 5 records
with conflicting cohort labels.

## Editorial policy

Split independently teachable operations, shape properties and methods when the
source gives enough detail to describe each separately. Keep examples, alternative
notations and inseparable concepts together. Preserve numerical bounds, excluded
methods and assumed-knowledge roles. Each decision includes its reason.

Automatically group only identical competency descriptions with matching topics
and limits. Explicit equivalence decisions may bridge different wording or topic
names when the mathematical competence and limits match. Keep broader and narrower
scopes separate. This is an editorial catalogue, not a statement that every
possible equivalent objective has been identified.

The Additional Mathematics Sec 5 cohort-label contradiction remains attached to
its appearances as `source-uncertain`. It does not change the mathematical content
or establish a different skill by itself. See the transcription report for the
conflicting source headings.

## Reproduction and use

Run `python scripts/build_knowledge.py data/mathematics/manifest.json`.
The command reports source, skill, appearance and editorial-decision counts.
`knowledge.json` contains the generated counts in `editorialSummary`.

A teacher-facing view can use skill labels for search, follow `appearanceIds` to
show every recorded pathway placement, and follow `objectiveId` to the original
syllabus wording. Source references include PDF page numbers and printed labels.
Primary common content remains identified as common rather than being duplicated
into Standard and Foundation. A-level years remain unspecified.

Introduction is pathway-specific. An explicitly assumed-knowledge appearance does
not prove introduction in that course. An occurrence within an official year band
does not identify which individual year teaches it.

Prerequisite voting is a separate step. No ordering, earlier year, or shared topic
in this catalogue constitutes an accepted prerequisite relationship.
