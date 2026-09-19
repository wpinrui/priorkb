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
};

export type Catalogue = {
  subject: string;
  title: string;
  skills: Skill[];
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
const cache = new Map<string, Promise<Catalogue>>();

function subjectName(): string {
  return (import.meta.env.VITE_SUBJECT as string | undefined) || 'mathematics';
}

function toCatalogue(raw: Record<string, any>): Catalogue {
  const knownSkills = new Set((raw.skills ?? []).map((skill: any) => skill.id));
  const graph = raw.relationships ?? {};
  if (graph.subject && graph.subject !== raw.subject) throw new Error(`Catalogue integrity error: ${graph.subject} relationships cannot be used with ${raw.subject} knowledge.`);
  const graphEntries = graph.entries ?? [];
  const staleEntry = graphEntries.find((entry: any) => !knownSkills.has(entry.prerequisiteSkillId) || !knownSkills.has(entry.dependentSkillId));
  if (staleEntry) throw new Error(`Catalogue integrity error: relationship ${staleEntry.id} references a missing skill.`);
  const relationships = graphEntries.map((entry: any) => ({
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
  return {
    subject: raw.subject,
    title: raw.title,
    skills: raw.skills ?? [],
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
    return toCatalogue({ ...knowledge, relationships, knowledgeHash });
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
