# Prerequisite pilot report

This report records the five independent voter outputs for the pilot packet. It does not add prerequisite links, change votes, or decide the six disputed pairs.

The pilot selection contains 40 appearance-level selections that deduplicate to 36 canonical directed candidate pairs. The packet contains 36 candidate pairs, 63 skill records, 94 appearances, and 12 pathways. The packet scope is pilot only. The full prerequisite graph remains unassessed. The five voter event logs each completed one voting turn and one result item.

Sources: [pilot packet](prerequisite-pilot.json), [Luna 01 votes](prerequisite-votes/luna-01.json), [Luna 02 votes](prerequisite-votes/luna-02.json), [Luna 03 votes](prerequisite-votes/luna-03.json), [Luna 04 votes](prerequisite-votes/luna-04.json), [Luna 05 votes](prerequisite-votes/luna-05.json).

## Measured tally

The packet policy accepts a class at four of five votes. This produces 18 accepted essential links and 12 accepted helpful links. Six disputed links have no accepted class and remain pending user decision. The tally is based on the raw classifications in the five voter files.

The accepted links are pilot results only. They are not official Ministry of Education prerequisite relations, and the source-inferred links do not establish a complete curriculum graph.

## Disputed links pending user decision

| Candidate | Prior skill -> target skill | Votes E/H/N | Pathway context | Actual rationale split |
| --- | --- | --- | --- | --- |
| pilot-001 | number notation, representations and place values (tens, ones) -> comparing and ordering numbers | 3/2/0 | primary-common P1, numbers up to 100 | Essential votes say tens and ones place value gives the magnitude needed to compare two-digit numbers. Helpful votes say comparison can also use counting, number lines, or other magnitude reasoning, so place value is useful but not strictly required. |
| pilot-005 | equivalent fractions -> adding and subtracting fractions with denominators not exceeding 12, with no more than two denominators, without calculator | 3/2/0 | primary-foundation P5 | Essential votes say unlike-fraction addition and subtraction requires equivalent fractions with a common denominator. Helpful votes describe equivalent fractions as a direct bridge or method that is not indispensable in every approach. One helpful rationale refers to every one of the four operations, but this target is only adding and subtracting fractions. That rationale is broader than the target scope. |
| pilot-020 | Factorisation of quadratic expressions ax^2 + bx + c -> Solve quadratic equations by formula and completing the square for y = x^2 + px + q | 0/2/3 | secondary-g3 Sec 2 to Sec 3-4 | Helpful votes say factorisation can illuminate roots and provide checks. None votes say the stated formula and completing-square methods do not require factorisation. Several none rationales mention a graphical method because the full source bullet includes it, but the canonical target skill in the packet names formula and completing the square. That is a source-scope mismatch to resolve. |
| pilot-021 | Use sine, cosine, and tangent to calculate unknown sides in right-angled triangles -> Use inverse trigonometric ratios to calculate unknown acute angles in right-angled triangles | 2/3/0 | secondary-g3 Sec 2 | Essential votes say inverse ratios presuppose the direct sine, cosine, and tangent ratios. Helpful votes say side calculations reinforce ratio interpretation, but inverse ratios can be taught and used directly. |
| pilot-035 | Use if-then conditionals in mathematical statements -> Direct proof | 3/2/0 | h3-mathematics, mathematical statements to direct proof | Essential votes say direct proof of an implication proceeds from a hypothesis to its conclusion. Helpful votes say conditionals structure a proof, but direct proof can be learned through assumption-to-conclusion reasoning without mastering the full listed conditional vocabulary. |
| pilot-039 | Behaviour of a sequence, such as limiting behaviour -> Solve first-order linear homogeneous and non-homogeneous recurrence relations with constant coefficients of the form u_n = a u_(n-1) + b | 0/2/3 | h2-further-mathematics, recurrence relations | None votes say recurrence solving uses recurrence algebra and does not require sequence limits. Helpful votes say sequence behaviour helps interpret or check solutions, but is not needed for the algebraic solution method. |

These six rows expose two policy questions for the next specification round. First, should a prerequisite capture necessary conceptual understanding, or only knowledge required to execute the target procedure? Second, when two methods can be learned independently at the same level, should the related method be marked helpful because it supports interpretation and checking, or kept out because it is not a direct dependency? The votes apply both policies inconsistently, especially in pilots 001, 005, 021, 035, and 039.

Specification question now sent to the user: Should essential mean needed to understand or explain the target concept, which is the recommended interpretation, or the minimum ability needed to perform the target procedure independently? All five voters marked rate of change to differentiating standard rules as helpful. That result illustrates the current policy boundary because conceptual support was recognized without being treated as an essential procedural dependency. Votes remain unchanged.

## Accepted links

The rationale inspection also found broader-source wording in pilots 035 and
040. Luna 02 and 03 refer to wider conditional vocabulary in pilot 035, although
the prerequisite child only names if-then conditionals. It remains disputed.
Luna 01, 02 and 05 refer to phase lines or slope fields in pilot 040, although the
target child only names families of solution curves. Those references are
extraneous to the target; the helpful classification is retained under the
five-voter rule. These original rationales remain visible rather than being
rewritten. The reusable prompt now explicitly separates child scope from parent
source context; the recorded pilot used the original prompt.

The table preserves the accepted classification and the raw E/H/N count for each accepted candidate. Context names show the pathway and year represented by the candidate appearances.

| Candidate | Class, E/H/N | Prior -> target | Context |
| --- | --- | --- | --- |
| pilot-002 | essential, 5/0/0 | fraction as part of a whole -> adding and subtracting like fractions within one whole with denominators of given fractions not exceeding 12 | primary-common P2 |
| pilot-003 | essential, 5/0/0 | Understand the concept of area of a plane figure -> area of rectangle/square | primary-common P3 |
| pilot-004 | essential, 5/0/0 | fraction as part of a whole -> equivalent fractions | primary-foundation P5 |
| pilot-006 | essential, 5/0/0 | concepts of base and height of a triangle -> Find the area of a triangle | primary-foundation P6 and primary-standard P5 |
| pilot-008 | essential, 5/0/0 | notation, representations and interpretation of a:b and a:b:c, where a, b and c are whole numbers, excluding ratios involving fractions and decimals -> equivalent ratios | primary-standard P6 |
| pilot-009 | helpful, 0/5/0 | equivalent ratios -> dividing a quantity in a given ratio | primary-standard P6 |
| pilot-010 | essential, 5/0/0 | using a letter to represent an unknown number -> Use notation, representations and interpretation for simple algebraic expressions | primary-standard P6 |
| pilot-011 | essential, 5/0/0 | Perform the four operations with integers -> Perform the four operations with fractions | secondary-g1 Sec 1 |
| pilot-012 | helpful, 1/4/0 | linear functions (y = ax + b) -> graphs of linear functions | secondary-g1 Sec 2 |
| pilot-013 | helpful, 0/5/0 | factorisation of linear expressions of the form ax + kay -> Factorise quadratic expressions of the form x^2 + px + q | secondary-g1 Sec 3-4 |
| pilot-014 | essential, 5/0/0 | Identify prime numbers -> Perform prime factorisation | secondary-g2 Sec 1 and secondary-g3 Sec 1 |
| pilot-015 | essential, 5/0/0 | Perform prime factorisation -> Find the highest common factor by prime factorisation | secondary-g2 Sec 1 |
| pilot-016 | helpful, 1/4/0 | Linear functions y = ax + b -> graphs of linear functions | secondary-g2 Sec 2 |
| pilot-017 | helpful, 0/5/0 | Find the area of a parallelogram -> Find the area of composite plane figures | secondary-g2 Sec 1 |
| pilot-019 | helpful, 1/4/0 | linear functions (y = ax + b) -> graphs of linear functions | secondary-g3 Sec 1 |
| pilot-022 | essential, 4/1/0 | Six trigonometric functions for angles of any magnitude -> Use exact trigonometric values for special angles | secondary-g2-additional and secondary-g3-additional Sec 3-4 |
| pilot-023 | helpful, 0/4/1 | Derivative as rate of change -> Use standard differentiation notation | secondary-g2-additional and secondary-g3-additional Sec 3-4 |
| pilot-024 | helpful, 0/4/1 | Use standard differentiation notation -> Differentiate x^n for rational n | secondary-g2-additional Sec 3-4 |
| pilot-026 | essential, 4/1/0 | Use basic trigonometric identities -> Simplification of trigonometric expressions | secondary-g3-additional Sec 3-4 |
| pilot-028 | essential, 5/0/0 | Concept of function as a rule where every input has one output -> Functions e^x and ln x and their graphs | h1-mathematics |
| pilot-029 | helpful, 0/5/0 | Derivative of f(x) as the gradient of the tangent -> Derivatives of x^n for rational n, e^x, ln x, and constant multiples, sums and differences | h1-mathematics |
| pilot-030 | essential, 5/0/0 | Standard normal distribution -> Finding P(X < x1) or a related probability from x1, mu, and sigma | h1-mathematics |
| pilot-031 | essential, 5/0/0 | Concept of binomial distribution B(n, p) as a probability model, including conditions for suitability -> Mean and variance of a binomial distribution without proof | h1-mathematics |
| pilot-032 | essential, 5/0/0 | Concepts of function, domain and range -> Use inverse functions | h2-mathematics |
| pilot-033 | helpful, 0/5/0 | Derivative as rate of change -> Differentiate the listed standard functions | h2-mathematics |
| pilot-034 | essential, 5/0/0 | Standard normal distribution -> Finding P(X < x1) or a related probability from x1, mu, and sigma | h2-mathematics |
| pilot-036 | helpful, 1/4/0 | Use existential quantifiers -> Proof of existence | h3-mathematics |
| pilot-037 | essential, 5/0/0 | Complex numbers in trigonometric or exponential form -> Use de Moivre's theorem for powers and roots | h2-further-mathematics |
| pilot-038 | essential, 5/0/0 | Functions of two variables and surfaces z = f(x, y) -> Find first-order partial derivatives | h2-further-mathematics |
| pilot-040 | helpful, 0/5/0 | Solve first-order linear differential equations -> Use families of solution curves | h2-further-mathematics |

The accepted classes are measured classifications from this pilot. They do not answer the six pending policy questions and do not support inferences about unlisted pairs. The source-inferred links are AI-generated relations from syllabus content and appearance evidence, not official Ministry of Education relations.
