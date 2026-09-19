# Source transcription decisions

This slice checks mathematical notation against rendered pages of the supplied
PDFs. It does not split objectives, approve shared skills or generate prerequisites.
The objective IDs and their syllabus placements remain the same.

## Results

| Dataset | Original formula flags resolved | Records with visual evidence | Source texts changed |
|---|---:|---:|---:|
| Secondary | 61 | 96 | 92 |
| A-level | 42 | 42 | 1 |

All 103 original formula flags are resolved. The secondary log also covers 35
previously unflagged records found during the visual checks and independent scan.
These included lost fraction bars, algebraic powers, squared/cubed units, inverse
trigonometric functions and calculus notation.

The dataset still has 1,082 occurrences. Its 313 split decisions and the source
label conflict affecting 16 occurrences remain open. No skills were merged.

## Evidence logs

- [Secondary transcription log](secondary-transcription-log.json)
- [A-level transcription log](alevel-transcription-log.json)

Each entry retains the original and corrected text, label, constraints and review
flags, along with its document and one-based PDF page references. A verified entry
can have unchanged wording when the existing transcription matches the PDF.

The 42 A-level formula flags were visually checked on H1 PDF pages 17-20,
H2 pages 18-23 and 25-26, and Further Mathematics pages 18-21. The polar-area
formula was made explicit as `A = (1/2) integral from alpha to beta of r^2 dtheta`.
The other flagged A-level source text matched the rendered formulas.

An independent spot check matched Further Mathematics page 18, H1 page 19 and
H2 page 23, including distribution parameters, sampling variances, summations
and exclusions. A parent spot check also matched the matrices and recurrence
notation on Further Mathematics page 20.

Secondary inspection covered the original flagged formulas and the further
unflagged errors identified by an independent scan. A parent spot check matched
the trigonometric graphs and identities, circle equations and linearisation
formulas on Additional Mathematics PDF page 19.

The before/after logs were reconciled against the previous committed dataset and
the corrected records. All edited records have evidence entries. Required field
shapes, log source references, objective IDs, source metadata, roles, coverage and
year placements were checked. Only transcription text, labels, constraints and
flags changed within objective records.

## Unresolved source label

The G2/G3 Additional Mathematics PDF contradicts itself about its Sec 5 supplement:

| Location | Visible label |
|---|---|
| PDF page 2, contents | Sec 5 students taking G2 Additional Mathematics |
| PDF page 26, printed page 24, heading and introductory prose | Sec 5 students taking G3 Additional Mathematics, to be read with G3 |
| PDF page 26, footer | Section 4: G2 Additional Mathematics Syllabus |
| PDF page 27, printed page 25 | Describes the limitations of the G2 calculus topic before listing supplementary content |

The existing G3 placement is retained provisionally because it follows the body
heading. This is not a resolution of the contradiction. The source-conflict flags
remain on all 16 affected occurrences, with both labels retained in their
constraints. Source clarification is needed before treating that placement as
authoritative.

## Primary spot check

The five previously corrected primary records were visually checked and matched:

- Standard P6 algebra notation on PDF page 43.
- Standard P6 square/cube root symbols on PDF page 44.
- Standard P6 average formula on PDF page 44.
- Foundation P6 average formula and related quantities on PDF page 50.

No primary dataset changes were required. Their `source-text-corrected` flags
record earlier corrections and are not unresolved formula warnings.

## Remaining editorial work

Compound-objective splits and shared-skill equivalence remain open decisions.
Overlap candidates are refreshed from the corrected wording while preserving IDs
for groups whose membership is unchanged. Similar wording is not proof of equal
scope or a prerequisite relationship.
