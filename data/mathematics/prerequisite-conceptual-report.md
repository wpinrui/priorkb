# Conceptual prerequisite pilot report

This report records the final v3 conceptual-understanding vote and the user's
decision to classify all three disputed pairs as helpful. The original votes are
unchanged. The separate [human decisions](prerequisite-decisions.json) record the
approval and identify the exact evidence packet.

The packet contains 36 canonical candidate pairs, 63 skill records, 94 appearances, and 12 pathways. The original selection contained 40 appearance-level selections that deduplicated to those 36 directed pairs. V3 used the user-approved essential definition: prior mastery is essential when it is needed to understand and explain the target concept as scoped, rather than merely to execute its procedure.

Sources: [conceptual pilot packet](prerequisite-conceptual-pilot.json), [Luna 01 votes](prerequisite-conceptual-votes/luna-01.json), [Luna 02 votes](prerequisite-conceptual-votes/luna-02.json), [Luna 03 votes](prerequisite-conceptual-votes/luna-03.json), [Luna 04 votes](prerequisite-conceptual-votes/luna-04.json), [Luna 05 votes](prerequisite-conceptual-votes/luna-05.json), [final relationships](relationships.json), [initial pilot manifest](manifest-initial-pilot.json), [superseded conceptual draft manifest](manifest-conceptual-draft.json).

## Final tally

The packet accepts a classification at four of five votes. All 180 v3 votes were
present before tallying. The user subsequently approved helpful classifications
for pilots 021, 023 and 039. These are human decisions, not additional model votes.

| Result | Count |
| --- | ---: |
| Accepted essential | 26 |
| Accepted helpful | 10 |
| Rejected, accepted none | 0 |
| Pending user decision | 0 |

All 36 pilot links are accepted: 33 by model consensus and 3 by user decision.
The full prerequisite graph remains unassessed. These relationships are not
official Ministry of Education prerequisite relations.

## Links resolved by the user

| Candidate | Prior skill -> target skill | Votes E/H/N | Pathway context | Actual rationale split |
| --- | --- | --- | --- | --- |
| pilot-021 | Use sine, cosine, and tangent to calculate unknown sides in right-angled triangles -> Use inverse trigonometric ratios to calculate unknown acute angles in right-angled triangles | 2/3/0 | secondary-g3 Sec 2 -> Sec 2 | Essential votes say inverse ratios depend conceptually on the direct sine, cosine, and tangent relationships between sides and angles. Helpful votes say direct side calculations give a concrete forward-operation bridge, but inverse ratios can be understood without first solving for sides. |
| pilot-023 | Derivative as rate of change -> Use standard differentiation notation, including f′(x), f″(x), dy/dx, and d²y/dx² = d/dx(dy/dx) | 2/3/0 | secondary-g2-additional Sec 3-4 -> Sec 3-4; secondary-g3-additional Sec 3-4 -> Sec 3-4 | Essential votes say the rate-of-change concept is needed to explain what prime and dy/dx notations denote. Helpful votes say the concept gives notation an explanatory meaning and helps communicate derivatives, but notation can be learned without prior mastery of that interpretation. |
| pilot-039 | Behaviour of a sequence, such as the limiting behaviour of a sequence -> Solve first-order linear homogeneous and non-homogeneous recurrence relations with constant coefficients of the form uₙ = auₙ₋₁ + b, where a, b ∈ ℝ and a ≠ 0 | 0/3/2 | h2-further-mathematics -> h2-further-mathematics | Helpful votes say sequence behaviour helps interpret how recurrence solutions evolve and their limiting patterns, but is not required for the algebraic solution. None votes say sequence behaviour analyzes recurrence outcomes rather than supplying the construction needed to solve the recurrence, so the direct explanatory direction is reversed. |

All three links above are now classified as helpful by user decision. Their
original split votes remain visible, and their model consensus remains unset.

## Comparison with the initial pilot

This comparison is between model votes only, before the human decisions above.

The initial pilot produced 18 accepted essential links, 12 accepted helpful links, 0 accepted none links, and 6 pending links. V3 produces 26 essential, 7 helpful, 0 accepted none, and 3 pending. Twenty-four candidate classifications stayed the same. The following 12 changed classifications.

| Candidate | Prior -> target | Initial result, E/H/N | V3 result, E/H/N |
| --- | --- | --- | --- |
| pilot-001 | Number notation, representations and place values (tens, ones) -> Comparing and ordering numbers | pending, 3/2/0 | essential, 5/0/0 |
| pilot-005 | Equivalent fractions -> Adding and subtracting fractions with denominators not exceeding 12, no more than two denominators, without calculator | pending, 3/2/0 | essential, 5/0/0 |
| pilot-012 | Linear functions (y = ax + b) -> Graphs of linear functions | helpful, 1/4/0 | essential, 5/0/0 |
| pilot-016 | Linear functions y = ax + b -> Graphs of linear functions | helpful, 1/4/0 | essential, 5/0/0 |
| pilot-019 | Linear functions y = ax + b -> Graphs of linear functions | helpful, 1/4/0 | essential, 5/0/0 |
| pilot-020 | Factorisation of quadratic expressions ax² + bx + c -> Solve quadratic equations by formula and completing the square for y = x² + px + q | pending, 0/2/3 | helpful, 0/5/0 |
| pilot-022 | Six trigonometric functions for angles of any magnitude -> Use exact trigonometric values for special angles | essential, 4/1/0 | helpful, 0/5/0 |
| pilot-023 | Derivative as rate of change -> Use standard differentiation notation | helpful, 0/4/1 | pending, 2/3/0 |
| pilot-029 | Derivative of f(x) as the gradient of the tangent -> Derivatives of xⁿ for rational n, eˣ, ln x, and constant multiples, sums and differences | helpful, 0/5/0 | essential, 5/0/0 |
| pilot-033 | Derivative as rate of change -> Differentiate the listed standard functions | helpful, 0/5/0 | essential, 5/0/0 |
| pilot-035 | Use if-then conditionals -> Direct proof | pending, 3/2/0 | essential, 4/1/0 |
| pilot-036 | Use existential quantifiers -> Proof of existence | helpful, 1/4/0 | essential, 5/0/0 |

The graph/function links in pilots 012, 016 and 019 and the derivative links in pilots 029 and 033 moved from helpful to essential, while pilot-023 moved from helpful to pending. These changes should not be attributed to the policy definition alone. The evidence view also changed. V3 omitted candidate justifications and raw parent source text from the model-facing view, while retaining canonical skill descriptions, constraints, scope limits, source references, and the full offline evidence packet. The evidence-view change and the conceptual policy therefore both affect comparisons with the initial pilot.

The conceptual draft manifest is retained as a superseded artifact because its input scope broadened one child competence. It is not the final outcome. The final relationships file and v3 packet are the authoritative outputs for this pilot.
