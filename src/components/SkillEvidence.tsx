import { pathwayLabel, yearLabel, type Appearance, type Catalogue, type Relationship, type Skill } from "../lib/catalogue";

type SkillEvidenceProps = {
  skill: Skill;
  catalogue: Catalogue;
  onSelect: (id: string) => void;
};

const PATHWAY_ORDER: Record<string, number> = {
  "primary-common": 0,
  "primary-standard": 1,
  "primary-foundation": 2,
  "secondary-g1": 3,
  "secondary-g2": 4,
  "secondary-g3": 5,
  "secondary-g2-additional": 6,
  "secondary-g3-additional": 7,
  "h1-mathematics": 8,
  "h2-mathematics": 9,
  "h2-further-mathematics": 10,
  "h3-mathematics": 11,
};

function pathwayName(id: string): string {
  const names: Record<string, string> = {
    "primary-common": "Primary common",
    "primary-standard": "Primary standard",
    "primary-foundation": "Primary foundation",
    "secondary-g1": "Secondary G1",
    "secondary-g2": "Secondary G2",
    "secondary-g3": "Secondary G3",
    "secondary-g2-additional": "Secondary G2 additional",
    "secondary-g3-additional": "Secondary G3 additional",
    "h1-mathematics": "H1 Mathematics",
    "h2-mathematics": "H2 Mathematics",
    "h2-further-mathematics": "H2 Further Mathematics",
    "h3-mathematics": "H3 Mathematics",
  };
  return names[id] ?? pathwayLabel(id);
}

function yearRank(year: string | null): number {
  if (!year) return 999;
  const primary = /^P(\d+)$/.exec(year);
  if (primary) return Number(primary[1]) - 1;
  const secondary = /^Sec\s+(\d+)(?:-(\d+))?$/.exec(year);
  if (secondary) return 20 + Number(secondary[1]) * 10 + Number(secondary[2] ?? secondary[1]);
  return 500;
}

function appearanceOrder(a: Appearance, b: Appearance): number {
  return (PATHWAY_ORDER[a.pathway] ?? 100) - (PATHWAY_ORDER[b.pathway] ?? 100)
    || yearRank(a.year) - yearRank(b.year)
    || a.id.localeCompare(b.id);
}

function appearanceLabel(appearance: Appearance): string {
  return `${pathwayName(appearance.pathway)}, ${yearLabel(appearance.year)}`;
}

function sourcePages(appearance: Appearance): string {
  const pdf = appearance.source.pdfPages.length ? `PDF p. ${appearance.source.pdfPages.join(", ")}` : "PDF page not specified";
  const printed = appearance.source.printedPages.length ? `printed p. ${appearance.source.printedPages.join(", ")}` : "printed page not specified";
  return `${pdf}; ${printed}${appearance.source.item ? `; item ${appearance.source.item}` : ""}`;
}

function contextLabel(appearance: Appearance | undefined): string {
  if (!appearance) return "Appearance not found in this catalogue";
  return `${appearanceLabel(appearance)}: ${appearance.topic || appearance.objectiveId}`;
}

function classificationLabel(classification: string | null | undefined): string {
  if (classification === "essential") return "Essential";
  if (classification === "helpful") return "Helpful";
  if (classification === "none") return "No link";
  return "Unresolved";
}

function sourceWarning(appearance: Appearance, sourceMissing: boolean): string | null {
  if (sourceMissing) return "Source uncertain: the source record is not available in this catalogue.";
  if (appearance.status && appearance.status !== "ready") return `Source status: ${appearance.status}.`;
  return null;
}

function AppearanceRow({ appearance, first, source }: { appearance: Appearance; first: boolean; source: Catalogue["sources"][number] | undefined }) {
  const warning = sourceWarning(appearance, !source);
  return (
    <article className="appearance">
      <div className="appearance-main">
        <strong>{appearanceLabel(appearance)}</strong>
        <span className={`role role-${appearance.role}`}>
          {appearance.role === "assumed-knowledge" ? "Assumed knowledge" : first ? "First listed" : "Syllabus content"}
        </span>
        <p>{appearance.topic || appearance.objectiveId}</p>
      </div>
      <div className="source-line">
        {source ? `${source.title}, ${source.edition}, ${source.implementationCohort}` : "Source title unavailable"}
        <br />
        {sourcePages(appearance)}
      </div>
      {(appearance.constraints.length > 0 || appearance.scopeNotes.length > 0) && (
        <details className="appearance-details">
          <summary>Constraints and scope notes</summary>
          {appearance.constraints.length > 0 && <div><strong>Constraints</strong><ul>{appearance.constraints.map((item) => <li key={item}>{item}</li>)}</ul></div>}
          {appearance.scopeNotes.length > 0 && <div><strong>Scope notes</strong><ul>{appearance.scopeNotes.map((item) => <li key={item}>{item}</li>)}</ul></div>}
        </details>
      )}
      {warning && <p className="notice source-warning">{warning}</p>}
    </article>
  );
}

function ContextDetails({ relationship, catalogue }: { relationship: Relationship; catalogue: Catalogue }) {
  const byId = new Map(catalogue.appearances.map((appearance) => [appearance.id, appearance]));
  const consensus = relationship.consensus as Relationship["consensus"] | null | undefined;
  return (
    <details className="evidence-details">
      <summary>Evidence details</summary>
      {relationship.contexts.length > 0 ? (
        <div className="context-list">
          <strong>Specific contexts</strong>
          {relationship.contexts.map((context, index) => (
            <p key={`${context.prerequisiteAppearanceId}-${context.dependentAppearanceId}-${index}`}>
              {contextLabel(byId.get(context.prerequisiteAppearanceId))} <span aria-hidden="true">to</span> {contextLabel(byId.get(context.dependentAppearanceId))}
            </p>
          ))}
        </div>
      ) : <p className="muted">No specific appearance context is recorded.</p>}
      <div className="assessment-summary">
        <strong>Independent model assessments</strong>
        {consensus ? (
          <p>Counts: essential {consensus.counts.essential}, helpful {consensus.counts.helpful}, no link {consensus.counts.none}. Total assessments: {consensus.voteCount}. Model consensus: {consensus.classification ? classificationLabel(consensus.classification) : "No four-of-five consensus"}.</p>
        ) : <p>No consensus record is available.</p>}
        {relationship.votes.length > 0 && <ul>{relationship.votes.map((vote) => <li key={vote.voterId}><strong>{classificationLabel(vote.classification)}</strong> from independent model assessment {vote.voterId}: {vote.rationale}</li>)}</ul>}
      </div>
      <div className="decision-source">
        <strong>Decision source</strong>
        <p>{relationship.decisionSource || "Decision source not specified"}</p>
        {relationship.humanDecision && <p>Human decision: {relationship.humanDecision.reason}</p>}
      </div>
    </details>
  );
}

function RelationCard({ relationship, linkedSkill, catalogue, direction, onSelect }: { relationship: Relationship; linkedSkill: Skill; catalogue: Catalogue; direction: "incoming" | "outgoing"; onSelect: (id: string) => void }) {
  const unresolved = relationship.status === "needs-decision" || relationship.effectiveClassification === null;
  const warning = relationship.status !== "accepted" ? `Relationship status: ${relationship.status || "not accepted"}.` : null;
  return (
    <article className="relation-card">
      <div className="relation-card-main">
        <button className="link-button" type="button" onClick={() => onSelect(linkedSkill.id)}>{linkedSkill.label}</button>
        <span className={`role relation-badge relation-${relationship.effectiveClassification ?? "unresolved"}`}>{classificationLabel(relationship.effectiveClassification)}</span>
        <p>{direction === "incoming" ? "Assessed as prior knowledge in the contexts below." : "This concept supports understanding the linked concept."}</p>
      </div>
      <ContextDetails relationship={relationship} catalogue={catalogue} />
      {warning && <p className="notice source-warning">{warning}</p>}
      {unresolved && <p className="notice">Unresolved relationship. It is not part of the active prerequisite graph.</p>}
    </article>
  );
}

function RelationGroup({ title, classification, items, skill, catalogue, direction, onSelect }: { title: string; classification: "essential" | "helpful"; items: Relationship[]; skill: Skill; catalogue: Catalogue; direction: "incoming" | "outgoing"; onSelect: (id: string) => void }) {
  const filtered = items.filter((relationship) => relationship.effectiveClassification === classification);
  if (filtered.length === 0) return null;
  return <div className="relation-group"><h4>{title}<span>{filtered.length}</span></h4>{filtered.map((relationship) => { const id = direction === "incoming" ? relationship.prerequisiteSkillId : relationship.dependentSkillId; const linkedSkill = catalogue.skills.find((candidate) => candidate.id === id); return linkedSkill ? <RelationCard key={relationship.id} relationship={relationship} linkedSkill={linkedSkill} catalogue={catalogue} direction={direction} onSelect={onSelect} /> : null; })}</div>;
}

export function SkillEvidence({ skill, catalogue, onSelect }: SkillEvidenceProps) {
  const appearances = catalogue.appearances.filter((appearance) => appearance.skillId === skill.id).sort(appearanceOrder);
  const syllabusAppearances = appearances.filter((appearance) => appearance.role === "syllabus-content");
  const firstByPathway = new Set<string>();
  const incoming = catalogue.relationships.filter((relationship) => relationship.status === "accepted" && relationship.dependentSkillId === skill.id && ["essential", "helpful"].includes(relationship.effectiveClassification ?? ""));
  const outgoing = catalogue.relationships.filter((relationship) => relationship.status === "accepted" && relationship.prerequisiteSkillId === skill.id && ["essential", "helpful"].includes(relationship.effectiveClassification ?? ""));
  const unresolved = catalogue.relationships.filter((relationship) => (relationship.dependentSkillId === skill.id || relationship.prerequisiteSkillId === skill.id) && relationship.status === "needs-decision");
  const coverage = catalogue.skillCoverage.find((item) => item.skillId === skill.id);
  const sourceFor = (appearance: Appearance) => catalogue.sources.find((source) => source.id === appearance.source.documentId);
  const hasPilot = incoming.length > 0 || outgoing.length > 0 || unresolved.length > 0 || coverage?.status === "pilot-only";

  return (
    <div className="skill-evidence">
      <section className="detail-section" aria-labelledby="where-listed-heading">
        <div className="section-heading"><div><span className="eyebrow">Where it is listed</span><h3 id="where-listed-heading">Syllabus appearances</h3></div><span className="section-note">First listed is calculated within each pathway from syllabus content.</span></div>
        {appearances.length === 0 ? <p className="muted">No canonical syllabus appearance is recorded for this concept.</p> : <div className="appearance-list">{appearances.map((appearance) => { const first = appearance.role === "syllabus-content" && !firstByPathway.has(appearance.pathway); if (first) firstByPathway.add(appearance.pathway); return <AppearanceRow key={appearance.id} appearance={appearance} first={first} source={sourceFor(appearance)} />; })}</div>}
        {appearances.length > 0 && syllabusAppearances.length === 0 && <p className="notice">This concept has only assumed knowledge appearances. They do not count as a syllabus-content first listing.</p>}
        {appearances.length > 0 && <p className="muted">Canonical appearances show where the concept is recorded. They are not necessarily individually assessed for prerequisite status.</p>}
      </section>

      <section className="detail-section relation-section" aria-labelledby="relationships-heading">
        <div className="section-heading"><div><span className="eyebrow">Relationships</span><h3 id="relationships-heading">Prior knowledge and what it builds towards</h3></div></div>
        <div className="relation-group"><h4>Prior knowledge</h4><RelationGroup title="Essential" classification="essential" items={incoming} skill={skill} catalogue={catalogue} direction="incoming" onSelect={onSelect} /><RelationGroup title="Helpful" classification="helpful" items={incoming} skill={skill} catalogue={catalogue} direction="incoming" onSelect={onSelect} /></div>
        <div className="relation-group"><h4>Builds towards</h4><RelationGroup title="Essential" classification="essential" items={outgoing} skill={skill} catalogue={catalogue} direction="outgoing" onSelect={onSelect} /><RelationGroup title="Helpful" classification="helpful" items={outgoing} skill={skill} catalogue={catalogue} direction="outgoing" onSelect={onSelect} /></div>
        {unresolved.length > 0 && <div className="relation-group unresolved-relations"><h4>Needs decision <span>{unresolved.length}</span></h4><p className="notice">These relationships remain unresolved and are excluded from the active graph.</p>{unresolved.map((relationship) => { const id = relationship.dependentSkillId === skill.id ? relationship.prerequisiteSkillId : relationship.dependentSkillId; const linkedSkill = catalogue.skills.find((candidate) => candidate.id === id); return linkedSkill ? <RelationCard key={relationship.id} relationship={relationship} linkedSkill={linkedSkill} catalogue={catalogue} direction={relationship.dependentSkillId === skill.id ? "incoming" : "outgoing"} onSelect={onSelect} /> : null; })}</div>}
        {!hasPilot && <p className="muted">No prerequisite relationships are currently covered for this concept. No matches do not establish that there are no prerequisites.</p>}
        {hasPilot && incoming.length === 0 && <p className="muted">No accepted essential or helpful prior knowledge is recorded in the current pilot coverage.</p>}
        {coverage?.status === "unassessed" && <p className="notice">Incoming prerequisite coverage is unassessed for this concept. Any outgoing pilot links do not establish its own prerequisites.</p>}
        {coverage?.status === "pilot-only" && <p className="notice">Relationship coverage is from the current pilot and may be incomplete.</p>}
      </section>
    </div>
  );
}
