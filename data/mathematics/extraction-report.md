# Mathematics extraction report

This is a source-occurrence dataset for editorial decisions. It does not contain approved canonical skills or prerequisite links.

## Coverage

| Dataset | Source PDFs | Occurrences |
|---|---:|---:|
| [primary.json](primary.json) | 1 | 288 |
| [secondary.json](secondary.json) | 3 | 495 |
| [alevel.json](alevel.json) | 4 | 299 |

Total: 1082 occurrences from 8 supplied PDFs. Counts include repeated appearances and explicitly assumed knowledge.

| Pathway | Year or band | Occurrences |
|---|---|---:|
| primary-common | P1 | 32 |
| primary-common | P2 | 30 |
| primary-common | P3 | 34 |
| primary-common | P4 | 42 |
| primary-standard | P5 | 37 |
| primary-standard | P6 | 27 |
| primary-foundation | P5 | 63 |
| primary-foundation | P6 | 23 |
| secondary-g1 | Sec 1 | 41 |
| secondary-g1 | Sec 2 | 27 |
| secondary-g1 | Sec 3-4 | 22 |
| secondary-g1 | Sec 4 | 2 |
| secondary-g2 | Sec 1 | 51 |
| secondary-g2 | Sec 2 | 38 |
| secondary-g2 | Sec 3-4 | 43 |
| secondary-g2 | Sec 5 | 20 |
| secondary-g2-additional | Sec 3-4 | 42 |
| secondary-g3 | Sec 1 | 52 |
| secondary-g3 | Sec 2 | 35 |
| secondary-g3 | Sec 3-4 | 51 |
| secondary-g3-additional | Sec 3-4 | 55 |
| secondary-g3-additional | Sec 5 | 16 |
| h1-mathematics | Not assigned | 65 |
| h2-mathematics | Not assigned | 140 |
| h3-mathematics | Not assigned | 35 |
| h2-further-mathematics | Not assigned | 59 |

Roles: 1052 syllabus-content occurrences and 30 explicitly assumed-knowledge occurrences.

## Editorial queue

The `ambiguities` arrays in each dataset contain split decisions, source interpretation notes and local overlap candidates. Some source notes document completed transcription corrections. `reviewFlags` identify affected records.

[overlaps.json](overlaps.json) contains 262 cross-pathway candidate groups: 261 exact normalized wording matches plus the manually identified triangle-area group. This is a candidate list, not an exhaustive semantic equivalence analysis. No occurrences were merged.

Decisions to resolve before canonical skills and prerequisite voting:

- Split compound content bullets only when the parts are independently teachable. For example, negative numbers and primes combine distinct concepts; multi-operation bullets may instead be retained as one skill family.
- Decide shared-skill equivalence without discarding pathway-specific scope. Standard P5, Foundation P6 and G1 Sec 1 all contain triangle area.
- Resolve the Additional Maths Sec 5 supplement label conflict: the contents page says G2, while the body says G3. The body label is retained provisionally and affected records are flagged.
- The initial formula-layout flags have been resolved against rendered PDF pages. See the [transcription report](transcription-report.md) and evidence logs for corrections and the remaining source-label conflict.

## Source and integrity checks

- All eight supplied document hashes match the source manifest entries.
- Objective and ambiguity IDs are unique; ambiguity references resolve.
- Required fields, field types, source document references and PDF page bounds were checked.
- Coverage counts and page lists were reconciled with the emitted records.
- Primary numbered-item counts were checked page by page; all 495 secondary numbered item starts match emitted document/page/item references.
- Parent spot checks covered triangle-area placements, primary average formulas, secondary year headings and Sec 5 supplements, A-level exclusions, H3 page continuations and the H2 assumed-knowledge appendix.

These checks establish structural consistency and sampled source fidelity. The
subsequent [transcription slice](transcription-report.md) adds visual verification
for the original formula flags and further detected transcription errors. This is
not a claim that every formula has been independently verified.

## Scope and reuse

Source PDFs remain local and gitignored under `syllabus/`. The tracked data retain filenames, hashes and source page references. A-level school years intentionally remain null; primary and secondary use official years or bands, including explicit Sec 4 exceptions.

The subject-independent format is documented in [../README.md](../README.md). Another subject supplies its own manifest and datasets using the same schema. No application behavior or prerequisite voting is included in this slice.
