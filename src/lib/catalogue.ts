export type Source = {
  id: string;
  title: string;
  edition: string;
  implementationCohort: string;
};

export type Skill = {
  id: string;
  label: string;
  description: string;
  topics: string[];
  appearanceIds: string[];
  kind?: 'catalogue-skill' | 'instructional';
};

export type Appearance = {
  id: string;
  skillId: string;
  objectiveId: string;
  pathway: string;
  year: string | null;
  role: string;
  strand: string;
  topic: string;
  constraints: string[];
  scopeNotes: string[];
  source: { documentId: string; pdfPages: number[]; printedPages: string[]; item?: string };
  status: string;
};

export type Relationship = {
  id: string;
  prerequisiteSkillId: string;
  dependentSkillId: string;
  status: string;
  effectiveClassification: 'essential' | 'helpful' | 'none' | null;
  decisionSource: string;
  contexts: { prerequisiteAppearanceId: string; dependentAppearanceId: string }[];
  consensus: { classification: string | null; counts: { essential: number; helpful: number; none: number }; voteCount: number };
  votes: { voterId: string; classification: string; rationale: string }[];
  humanDecision?: { reason: string };
  trialEvidence?: {
    targetAppearances: Appearance[];
    prerequisiteAppearances: Appearance[];
    kind: string;
    questions?: { assessor: string; question: string }[];
    findings: { description: string }[];
  };
};

export type Catalogue = {
  subject: string;
  title: string;
  skills: Skill[];
  supplementalSkills: Skill[];
  appearances: Appearance[];
  sources: Source[];
  relationships: Relationship[];
  skillCoverage: { skillId: string; status: string; incomingCandidateCount: number }[];
  summary: unknown;
  knowledgeHash?: string;
};

type RawModule = { default: Record<string, any> };
const dataModules = import.meta.glob('../../data/*/*.json', { eager: false }) as Record<string, () => Promise<RawModule>>;
const rawDataModules = import.meta.glob('../../data/*/*.json', { eager: false, query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;
const topicAssessmentModules = import.meta.glob('../../data/*/topic-trials/*/assessment.json', { eager: false }) as Record<string, () => Promise<RawModule>>;
const cache = new Map<string, Promise<Catalogue>>();

function subjectName(): string {
  return (import.meta.env.VITE_SUBJECT as string | undefined) || 'mathematics';
}

function toCatalogue(raw: Record<string, any>, trialAssessments: Record<string, any>[] = []): Catalogue {
  const knownSkills = new Set((raw.skills ?? []).map((skill: any) => skill.id));
  const graph = raw.relationships ?? {};
  if (graph.subject && graph.subject !== raw.subject) throw new Error(`Catalogue integrity error: ${graph.subject} relationships cannot be used with ${raw.subject} knowledge.`);
  const graphEntries = graph.entries ?? [];
  const staleEntry = graphEntries.find((entry: any) => !knownSkills.has(entry.prerequisiteSkillId) || !knownSkills.has(entry.dependentSkillId));
  if (staleEntry) throw new Error(`Catalogue integrity error: relationship ${staleEntry.id} references a missing skill.`);
  const relationships: Relationship[] = graphEntries.map((entry: any) => ({
    id: entry.id,
    prerequisiteSkillId: entry.prerequisiteSkillId,
    dependentSkillId: entry.dependentSkillId,
    status: entry.status,
    effectiveClassification: entry.effectiveClassification ?? null,
    decisionSource: entry.decisionSource ?? '',
    contexts: entry.contexts ?? [],
    consensus: entry.consensus ?? { classification: 'none', counts: { essential: 0, helpful: 0, none: 0 }, voteCount: 0 },
    votes: (entry.votes ?? []).map((vote: any) => ({ voterId: vote.voterId, classification: vote.classification, rationale: vote.rationale })),
    ...(entry.humanDecision ? { humanDecision: entry.humanDecision } : {}),
  }));
  const supplementalSkills: Skill[] = [];
  const baseRelationshipPairs = new Set(relationships.map((entry) => `${entry.prerequisiteSkillId}->${entry.dependentSkillId}`));
  for (const trial of trialAssessments) {
    const target = trial.target;
    const targetSkill = (raw.skills ?? []).find((skill: Skill) => skill.id === target.id);
    if (!targetSkill) throw new Error(`Topic assessment integrity error: target ${target.id} is missing from the catalogue.`);
    const targetAppearances = (raw.appearances ?? []).filter((appearance: Appearance) => appearance.skillId === target.id);
    const findings = (trial.editorialFindings ?? []);
    for (const entry of trial.entries ?? []) {
      const canonical = entry.skillId ? (raw.skills ?? []).find((skill: Skill) => skill.id === entry.skillId) : undefined;
      if (entry.skillId && !canonical) throw new Error(`Topic assessment integrity error: candidate ${entry.id} references missing skill ${entry.skillId}.`);
      const prerequisiteSkillId = canonical ? canonical.id : `instructional:${target.id}:${entry.id}`;
      if (!canonical) supplementalSkills.push({ id: prerequisiteSkillId, label: entry.label, description: entry.description, topics: target.topics ?? [], appearanceIds: [], kind: 'instructional' });
      const pair = `${prerequisiteSkillId}->${target.id}`;
      if (entry.status === 'accepted' && baseRelationshipPairs.has(pair)) throw new Error(`Topic assessment conflict: accepted ${entry.id} duplicates ${pair}.`);
      const matchingFindings = findings.filter((finding: any) => finding.status === 'needs-decision' && (finding.candidateIds ?? []).includes(entry.id)).map((finding: any) => ({ description: finding.description }));
      relationships.push({
        id: `trial-${target.id}-${entry.id}`,
        prerequisiteSkillId,
        dependentSkillId: target.id,
        status: entry.status ?? 'needs-decision',
        effectiveClassification: entry.classification ?? null,
        decisionSource: entry.classification ? 'consensus' : 'pending',
        contexts: [],
        consensus: { classification: entry.classification ?? null, counts: entry.counts ?? { essential: 0, helpful: 0, none: 0 }, voteCount: (entry.votes ?? []).length },
        votes: (entry.votes ?? []).map((vote: any) => ({ voterId: vote.assessor, classification: vote.classification, rationale: vote.rationale })),
        trialEvidence: { targetAppearances, prerequisiteAppearances: entry.appearances ?? [], kind: entry.kind, findings: matchingFindings },
      });
    }
  }
  return {
    subject: raw.subject,
    title: raw.title,
    skills: raw.skills ?? [],
    supplementalSkills,
    appearances: raw.appearances ?? [],
    sources: raw.sources ?? [],
    relationships,
    skillCoverage: graph.skillCoverage?.length ? graph.skillCoverage : (raw.skills ?? []).map((skill: Skill) => ({ skillId: skill.id, status: 'unassessed', incomingCandidateCount: 0 })),
    summary: raw.editorialSummary ?? {},
    knowledgeHash: raw.knowledgeHash ?? graph.knowledgeSha256,
  };
}

export async function loadCatalogue(): Promise<Catalogue> {
  const subject = subjectName();
  const existing = cache.get(subject);
  if (existing) return existing;
  const manifestPath = Object.keys(dataModules).find((key) => key.endsWith(`/${subject}/manifest.json`));
  if (!manifestPath) throw new Error(`Unsupported subject: ${subject}`);
  const loading = dataModules[manifestPath]().then(async ({ default: manifest }) => {
    const base = manifestPath.slice(0, manifestPath.lastIndexOf('/'));
    const knowledgePath = `${base}/${manifest.knowledge || 'knowledge.json'}`;
    const relationshipsPath = manifest.relationships ? `${base}/${manifest.relationships}` : '';
    const knowledgeModule = dataModules[knowledgePath];
    if (!knowledgeModule) throw new Error(`Catalogue integrity error: ${subject} manifest points to missing ${manifest.knowledge}.`);
    if (relationshipsPath && !dataModules[relationshipsPath]) throw new Error(`Catalogue integrity error: ${subject} manifest points to missing ${manifest.relationships}.`);
    const [{ default: knowledge }, relationshipResult] = await Promise.all([
      knowledgeModule(),
      relationshipsPath && dataModules[relationshipsPath] ? dataModules[relationshipsPath]() : Promise.resolve({ default: {} }),
    ]);
    const relationships = relationshipResult.default;
    const rawKnowledge = rawDataModules[knowledgePath] ? await rawDataModules[knowledgePath]() : '';
    const normalized = rawKnowledge.replace(/\r\n/g, '\n');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
    const knowledgeHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    if (relationships.knowledgeSha256 && relationships.knowledgeSha256 !== knowledgeHash) throw new Error(`Catalogue integrity error: relationships hash ${relationships.knowledgeSha256} does not match knowledge hash ${knowledgeHash}.`);
    const trialAssessments: Record<string, any>[] = [];
    for (const relative of manifest.topicAssessments ?? []) {
      const trialPath = `${base}/${relative}`;
      const loader = topicAssessmentModules[trialPath];
      if (!loader) throw new Error(`Catalogue integrity error: topic assessment ${relative} is missing.`);
      const { default: assessment } = await loader();
      if (assessment.subject && assessment.subject !== knowledge.subject) throw new Error(`Topic assessment integrity error: ${relative} subject does not match ${knowledge.subject}.`);
      if (assessment.knowledgeSha256 !== knowledgeHash) throw new Error(`Topic assessment integrity error: ${relative} knowledge hash does not match the catalogue.`);
      trialAssessments.push(assessment);
    }
    return toCatalogue({ ...knowledge, relationships, knowledgeHash }, trialAssessments);
  });
  const cached = loading.catch((error) => { cache.delete(subject); throw error; });
  cache.set(subject, cached);
  return cached;
}

export function pathwayLabel(id: string): string {
  const labels: Record<string, string> = { 'primary-common': 'Primary common', 'primary-standard': 'Primary standard', 'primary-foundation': 'Primary foundation', secondary: 'Secondary', 'a-level': 'A-level' };
  return labels[id] ?? id.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function yearLabel(year: string | null): string {
  return year ?? 'Year not specified';
}
