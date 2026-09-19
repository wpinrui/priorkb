# Syllabus objective datasets

Each subject lives in its own directory with a manifest and JSON datasets using
[syllabus-dataset.schema.json](syllabus-dataset.schema.json). The format has no
mathematics-specific fields or pathway enumeration. Another subject can supply
its own documents, pathway names and objective records without changing the format.
Document interpretation still needs subject-aware extraction and inspection.

The first dataset is [mathematics](mathematics/manifest.json). Its records are
syllabus occurrences and objective candidates. `knowledge.json` is the derived
skill catalogue. Shared skills retain a separate appearance for each pathway and
source item. A prerequisite pilot now supplies inferred links for a limited
selection of skills; the remaining graph is unassessed.

## Record meaning

- `sourceText` retains extracted syllabus wording and nested content. PDF text
  extraction can lose formula layout; flagged records require checking the PDF.
  Verified mathematical expressions may use explicit text notation such as `x^2`
  and parenthesized fractions to preserve the original formula's meaning.
- `label` is a navigation aid. Source wording and constraints determine scope.
- `pathway` and `year` describe the occurrence. A year can be an official band;
  A-level records deliberately use `null` rather than an inferred J1/J2 split.
- `role` distinguishes syllabus content from explicitly assumed knowledge. Neither
  automatically means the skill is introduced for the first time in that pathway.
- `source` identifies the original item and both one-based PDF pages and printed
  page labels. Unnumbered bullets receive a local bullet reference.
- `constraints` retains scope limits and exclusions. They are not extra skills.
- `reviewFlags` and `ambiguities` flag decisions about splitting, overlapping
  content or source interpretation. A flag is not a prerequisite vote.
- `coverage` counts occurrences by pathway and year, not unique skills.
- `sources` records supplied filenames, editions, implementation cohorts and
  SHA-256 hashes. Source paths resolve from the repository root.

The original PDFs in `syllabus/` are local inputs and are gitignored. Keep the
supplied filenames when sharing the PDFs separately so source references resolve.

## Transcription evidence

The manifest lists separate transcription logs, using
[transcription-log.schema.json](transcription-log.schema.json). Each entry records
the objective, original PDF pages, before/after text, labels, constraints and flags,
plus a note from visual inspection. A log can document verification without a text
change. Removing a formula uncertainty flag does not resolve a split decision or
establish equivalence with another occurrence.

The manifest's dataset paths and schema path resolve relative to its directory.
Its `sourceRoot` points to the base for source document filenames.
IDs identify these extracted occurrences; preserve them when labels are edited.
If a candidate is later split, keep its original ID as provenance for the children.

## Derived skills

Run `python scripts/build_knowledge.py data/mathematics/manifest.json` to rebuild
the catalogue using the Python standard library. The original datasets remain
unchanged. Subject-specific decisions live in files named by the manifest, so
another subject can use the same assembler with its own data and decisions.

- `editorialDecisions` records whether an original objective stays intact or
  splits into separately teachable competencies, with reasons and scope notes.
- `skillEquivalences` records inspected same-scope matches across appearances.
  Identical descriptions, topics and limits also group automatically. Candidate
  overlap wording alone does not authorize a merge.
- `knowledge.skills` supplies searchable labels and descriptions.
- `knowledge.appearances` preserves each skill's pathway, year, source page,
  original objective ID, role and limits. Assumed knowledge is not evidence of
  introduction in that year. No universal introduction year is assigned.
- `source-uncertain` marks the Additional Mathematics Sec 5 cohort-label
  contradiction. Its mathematical content can still be split and grouped.

Appearance IDs combine the original objective ID and editorial part number.
Skill IDs are content-derived; changing a decomposition or equivalence can change
them. Freeze the catalogue before collecting prerequisite votes, and invalidate
votes when their catalogue changes. Editorial equivalence decisions are separate
from the five-agent prerequisite assessment.

The catalogue groups inspected candidate overlaps conservatively. It does not
claim that every differently worded equivalent skill has already been found.

## Prerequisite votes

The manifest identifies a frozen evidence packet, five independent vote files,
and a generated relationship file. The packet contains explicit candidate pairs,
their appearance contexts and source evidence. See the
[pilot report](mathematics/prerequisite-pilot-report.md) and
[classification policy](mathematics/prerequisite-policy.md).

Run `python scripts/build_relationships.py data/mathematics/manifest.json` to
aggregate the recorded votes. Each pair requires five complete votes from
distinct sessions. Four or five votes for the same class accept an essential or
helpful link, or reject a candidate classified as `none`. Other splits remain
`needs-decision`. Cycles in accepted essential links are also flagged.

Only entries whose `status` is `accepted` belong in the active graph. A disputed
entry has no consensus classification. Keep its full vote record visible for a
human decision. These links are inferred assessments, not official MOE claims.

The evidence and catalogue SHA-256 values use UTF-8 text with line endings
normalized to LF. Changed catalogue or evidence text invalidates prior votes.
Coverage is explicit for every skill: having no candidate is `unassessed`, not
evidence that a skill needs no prior knowledge.

For a new subject or assessment batch, provide appearance-pair selections and
new vote output paths in its manifest. `prepare_relationships.py --manifest ...`
builds the evidence packet. `run_relationship_voters.py --manifest ...
--output-dir temp/new-batch` starts five new isolated Codex CLI sessions using
Luna by default. `import_relationship_votes.py --manifest ... --raw-output-dir
temp/new-batch` imports completed results with session IDs, prompt provenance and
usage metadata. Both voting and import refuse to overwrite existing votes.
Only the voting command makes model calls; packet preparation and aggregation
run locally with the Python standard library.

The initial pilot was executed before the reusable runner recorded run metadata.
Its imported votes explicitly say so and preserve the original prompt recovered
from that batch's script. Later runs record the packet and prompt hashes before
execution. The reusable prompt now makes clear that parent syllabus bullets are
context and must not broaden a split skill's scope. This clarification was not
part of the original pilot prompt.
