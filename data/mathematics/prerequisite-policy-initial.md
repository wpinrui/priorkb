# Prerequisite pilot policy

This is the policy used for the initial pilot. Its emphasis on conceptual
understanding versus procedural readiness is awaiting the user's specification
before assessment expands to the full catalogue.

The pilot records directional relationships from a prerequisite skill to a dependent skill. Each candidate is judged against the full canonical competence named by both skills and the stated context appearances. A broad subset of a skill is not enough to establish a prerequisite relationship.

`essential` means that prior mastery of the specific prerequisite skill is mathematically necessary to perform or learn the dependent competence as scoped. A common teaching order, a remote ancestor, or a merely familiar topic is insufficient. An optional solution method does not make that method an essential prerequisite when the dependent competence can be learned through the other stated methods.

`helpful` means that the prerequisite offers a concrete instructional bridge or useful interpretation, but the dependent competence can be learned without prior mastery of that exact skill. `none` means that no defensible direct prior-knowledge relationship exists in the stated direction, including cases where the candidate confuses shared content or equivalence with prerequisite status.

The five votes are genuine independent assessments. Vote files must identify the voter, model, session, and packet hash, and must contain exactly one vote for every candidate. No vote may be generated from the other voters' outputs or silently treated as an abstention. Missing, duplicate, unknown, or malformed votes invalidate the aggregation.

The assembler accepts a class only when at least four of five voters choose the same class. Four or five `essential` votes produce an accepted essential relationship. Four or five `helpful` votes produce an accepted helpful relationship. Four or five `none` votes produce a rejected relationship. Any 3-to-2 or more divided result remains `needs-decision`; it is never inferred as `none`.

Accepted essential relationships form a directed graph. Any accepted essential edge that participates in a directed cycle is retained with its vote consensus and flagged `needs-decision` for structural review. The cycle is not silently removed and is not treated as evidence that the vote was invalid.

The pilot is representative. Its skill coverage is reported as `pilot-only` for skills that receive candidate edges and `unassessed` for skills without incoming pilot candidates. The output must not claim complete prerequisite coverage or absence of relationships outside the pilot.
