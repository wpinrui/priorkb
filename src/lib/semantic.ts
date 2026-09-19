import type { Catalogue, Skill } from './catalogue';
import { searchSkills, type SearchFilters } from './search';

const MODEL = { modelId: 'Xenova/all-MiniLM-L6-v2', revision: '751bff37182d3f1213fa05d7196b954e230abad9', dtype: 'q8' };
type Corpus = typeof MODEL & { subject: string; knowledgeHash: string; vectors: { id: string; vector: number[] }[] };
type Reply = { id: number; type: 'status' | 'error' | 'results'; message?: string; results?: { id: string; score: number }[] };
type Pending = { finish: (results: Reply) => void; status: (message: string) => void; timer: ReturnType<typeof setTimeout> };
const pending = new Map<number, Pending>();
const corpora = new Map<string, Promise<Corpus>>();
let worker: Worker | undefined;
let sequence = 0;
let generation = 0;

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./semantic.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (event: MessageEvent<Reply>) => {
    const request = pending.get(event.data.id);
    if (!request) return;
    if (event.data.type === 'status') request.status(event.data.message ?? 'Preparing semantic search...');
    else {
      clearTimeout(request.timer);
      pending.delete(event.data.id);
      request.finish(event.data);
    }
  };
  worker.onerror = () => disposeSemantic('The semantic search worker could not run.');
  return worker;
}

function loadCorpus(catalogue: Catalogue): Promise<Corpus> {
  const key = `${catalogue.subject}:${catalogue.knowledgeHash}`;
  const cached = corpora.get(key);
  if (cached) return cached;
  const loading = (async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}search/${encodeURIComponent(catalogue.subject)}/corpus.json`, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error('The semantic index could not be downloaded.');
    const corpus = await response.json() as Corpus;
    if (corpus.subject !== catalogue.subject || corpus.knowledgeHash !== catalogue.knowledgeHash) throw new Error('The semantic index does not match this syllabus catalogue.');
    if (corpus.modelId !== MODEL.modelId || corpus.revision !== MODEL.revision || corpus.dtype !== MODEL.dtype) throw new Error('The semantic index requires a different model version.');
    const ids = new Set(corpus.vectors.map((item) => item.id));
    if (ids.size !== catalogue.skills.length || corpus.vectors.length !== ids.size || catalogue.skills.some((skill) => !ids.has(skill.id)) || corpus.vectors.some((item) => item.vector.length !== 384 || item.vector.some((value) => !Number.isFinite(value)))) throw new Error('The semantic index is incomplete.');
    return corpus;
  })();
  corpora.set(key, loading);
  loading.catch(() => corpora.delete(key));
  return loading;
}

export async function semanticSearch(catalogue: Catalogue, query: string, filters: SearchFilters, onStatus: (message: string) => void): Promise<Skill[]> {
  const lexical = searchSkills(catalogue, query, filters);
  const eligible = searchSkills(catalogue, '', filters);
  if (!query.trim() || !eligible.length) return lexical;
  const fallback = (reason: string) => { onStatus(`${reason} Showing keyword results.`); return lexical; };
  if (typeof Worker === 'undefined') return fallback('Semantic search is unavailable in this browser.');
  try {
    const startedGeneration = generation;
    onStatus('Loading the semantic index...');
    const corpus = await loadCorpus(catalogue);
    if (startedGeneration !== generation) return lexical;
    const currentWorker = getWorker();
    const id = ++sequence;
    const reply = await new Promise<Reply>((finish) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        finish({ id, type: 'error', message: 'Semantic search timed out. You can retry or continue with keywords.' });
        if (pending.size === 0) { worker?.terminate(); worker = undefined; }
      }, 180_000);
      pending.set(id, { finish, status: onStatus, timer });
      currentWorker.postMessage({ id, query, corpus });
    });
    if (reply.type === 'error') return fallback(reply.message ?? 'Semantic search is unavailable.');
    const allowed = new Set(eligible.map((skill) => skill.id));
    const semanticRank = new Map((reply.results ?? []).filter((item) => allowed.has(item.id)).map((item, index) => [item.id, index]));
    const lexicalRank = new Map(lexical.map((skill, index) => [skill.id, index]));
    const score = (skill: Skill) => 1 / (60 + (semanticRank.get(skill.id) ?? eligible.length)) + (lexicalRank.has(skill.id) ? 1 / (60 + lexicalRank.get(skill.id)!) : 0);
    onStatus('Ranked by meaning and keyword matches.');
    return [...eligible].sort((a, b) => score(b) - score(a));
  } catch (error) {
    return fallback(error instanceof Error ? error.message : 'Semantic search is unavailable.');
  }
}

export function disposeSemantic(reason = 'Semantic search was stopped.'): void {
  generation += 1;
  worker?.terminate();
  worker = undefined;
  for (const [id, request] of pending) {
    clearTimeout(request.timer);
    request.finish({ id, type: 'error', message: reason });
  }
  pending.clear();
}
