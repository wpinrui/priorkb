# Prerequisite pilot policy

This policy distinguishes conceptual understanding from rote procedural
readiness. A prerequisite assessment asks whether the dependent concept can be
understood and explained with the prerequisite competence as scoped.

The pilot records directional relationships from a prerequisite skill to a dependent skill. Each candidate is judged against the full canonical competence named by both skills and the stated context appearances. A broad subset of a skill is not enough to establish a prerequisite relationship.

`essential` means that prior mastery of the specific prerequisite skill is
required to understand and explain the dependent concept as scoped. Mere ability
to execute a rote procedure is not the test, and procedural execution without
conceptual understanding is not evidence that the prerequisite concept is
unnecessary. A common teaching order, a remote ancestor, or a merely familiar
topic is insufficient. An optional solution method does not make that method an
essential prerequisite when the dependent competence can be understood and
explained through the other stated methods.

`helpful` means that the prerequisite offers a concrete explanatory bridge or
useful interpretation, but is not necessary to understand and explain the
dependent concept. `none` means that no defensible conceptual or explanatory
bridge exists in the stated direction, including cases where the candidate
confuses shared content or equivalence with prerequisite status. A finding that a
prerequisite is not required is not, by itself, enough to classify a candidate as
`none` when a concrete explanatory bridge remains.

Each assessment uses the full exact prerequisite and dependent competences as
scoped by their canonical descriptions, constraints, and appearance scope notes.
A narrower hidden subskill must not replace a broader procedural or conceptual
competence. If the stated scope creates a real ambiguity, the voter records it in
the rationale and still returns one class.

The voter evidence view omits candidate proposal reasons and full parent source
bullets. Canonical descriptions, limits, appearance metadata and source references
remain visible. The offline packet retains the original source text for human
traceability; the recorded prompt shows exactly what the voters received.

The five votes are genuine independent assessments. Vote files must identify the voter, model, session, and packet hash, and must contain exactly one vote for every candidate. No vote may be generated from the other voters' outputs or silently treated as an abstention. Missing, duplicate, unknown, or malformed votes invalidate the aggregation.

The assembler accepts a class only when at least four of five voters choose the same class. Four or five `essential` votes produce an accepted essential relationship. Four or five `helpful` votes produce an accepted helpful relationship. Four or five `none` votes produce a rejected relationship. Any 3-to-2 or more divided result remains `needs-decision`; it is never inferred as `none`.

An explicit user decision can resolve a disputed candidate. It is recorded
separately with its classification, reason and evidence identity. The original
votes and consensus stay unchanged, and the effective decision is marked as
coming from the user. Human decisions remain subject to essential-cycle checks.

Accepted essential relationships form a directed graph. Any accepted essential edge that participates in a directed cycle is retained with its vote consensus and flagged `needs-decision` for structural review. The cycle is not silently removed and is not treated as evidence that the vote was invalid.

The pilot is representative. Its skill coverage is reported as `pilot-only` for skills that receive candidate edges and `unassessed` for skills without incoming pilot candidates. The output must not claim complete prerequisite coverage or absence of relationships outside the pilot.
