# Syllabus objective datasets

Each subject lives in its own directory with a manifest and JSON datasets using
[syllabus-dataset.schema.json](syllabus-dataset.schema.json). The format has no
mathematics-specific fields or pathway enumeration. Another subject can supply
its own documents, pathway names and objective records without changing the format.
Document interpretation still needs subject-aware extraction and inspection.

The first dataset is [mathematics](mathematics/manifest.json). Its records are
syllabus occurrences and objective candidates, not approved canonical skills.
Repeated content across pathways remains separate. No prerequisite or helpful
prior-knowledge relationships have been generated.

## Record meaning

- `sourceText` retains extracted syllabus wording and nested content. PDF text
  extraction can lose formula layout; flagged records require checking the PDF.
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

The manifest's dataset paths and schema path resolve relative to its directory.
Its `sourceRoot` points to the base for source document filenames.
IDs identify these extracted occurrences; preserve them when labels are edited.
If a candidate is later split, keep its original ID as provenance for the children.

## Current editorial boundary

Compound source bullets stay intact when their decomposition requires a decision.
Candidate overlaps must be compared for scope before merging into canonical skills.
The next stage is editorial resolution, followed by the separately requested
five-agent prerequisite assessment. Neither is part of this extraction slice.
