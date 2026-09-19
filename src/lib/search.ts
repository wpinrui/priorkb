import type { Appearance, Catalogue, Skill } from './catalogue';

export type SearchFilters = { pathway: string; year: string; linkedOnly: boolean };

const synonyms: Record<string, string[]> = {
  add: ['addition', 'sum', 'total', 'plus'], subtract: ['subtraction', 'difference', 'minus'],
  multiply: ['multiplication', 'product', 'times'], divide: ['division', 'quotient', 'share'],
  fraction: ['fractions', 'numerator', 'denominator'], shape: ['shapes', 'geometry'],
  graph: ['graphs', 'chart', 'plot'], probability: ['chance', 'likelihood'],
  equation: ['equations', 'unknown', 'algebra'], ratio: ['proportion', 'rate'],
};
const synonymExpansions = Object.entries(synonyms).reduce<Record<string, string[]>>((result, [word, alternatives]) => {
  result[word] = [...(result[word] ?? []), ...alternatives];
  alternatives.forEach((alternative) => { result[alternative] = [...(result[alternative] ?? []), word, ...alternatives.filter((item) => item !== alternative)]; });
  return result;
}, {});

const words = (value: string) => value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'how', 'what', 'is', 'are']);
function matchingAppearances(catalogue: Catalogue, skill: Skill, filters: SearchFilters): Appearance[] {
  return catalogue.appearances.filter((appearance) => appearance.skillId === skill.id &&
    (!filters.pathway || appearance.pathway === filters.pathway || (['primary-standard', 'primary-foundation'].includes(filters.pathway) && appearance.pathway === 'primary-common')) &&
    (!filters.year || appearance.year === filters.year));
}

export function searchSkills(catalogue: Catalogue, query: string, filters: SearchFilters): Skill[] {
  const queryWords = words(query).filter((word) => !stopWords.has(word));
  const expanded = new Set(queryWords);
  if (catalogue.subject === 'mathematics') queryWords.forEach((word) => (synonymExpansions[word] ?? []).forEach((synonym) => expanded.add(synonym)));
  const linked = new Set(catalogue.relationships.filter((r) => r.status === 'accepted' && ['essential', 'helpful'].includes(r.effectiveClassification ?? '')).flatMap((r) => [r.prerequisiteSkillId, r.dependentSkillId]));
  return catalogue.skills.map((skill, index) => {
    const appearances = matchingAppearances(catalogue, skill, filters);
    if (!appearances.length || (filters.linkedOnly && !linked.has(skill.id))) return { skill, score: -1, index };
    const text = words([skill.label, skill.description, ...skill.topics, ...appearances.flatMap((a) => [a.strand, a.topic, ...a.constraints, ...a.scopeNotes])].join(' '));
    const textSet = new Set(text);
    let score = 0;
    expanded.forEach((word) => { if (textSet.has(word)) score += queryWords.includes(word) ? 5 : 2; });
    if (query.trim() && skill.label.toLowerCase().includes(query.trim().toLowerCase())) score += 12;
    if (queryWords.length && queryWords.every((word) => textSet.has(word))) score += 4;
    return { skill, score, index };
  }).filter(({ score }) => score >= 0 && (!query.trim() || score > 0)).sort((a, b) => b.score - a.score || a.index - b.index).map(({ skill }) => skill);
}
