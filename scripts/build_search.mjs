import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pipeline } from '@huggingface/transformers';

const subject = process.env.VITE_SUBJECT || 'mathematics';
const root = new URL(`../data/${subject}/`, import.meta.url);
process.env.HF_HOME ||= fileURLToPath(new URL('../temp/huggingface/', import.meta.url));
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
const knowledgeFile = manifest.knowledge || 'knowledge.json';
const raw = await readFile(new URL(knowledgeFile, root));
const knowledge = JSON.parse(raw);
const modelId = 'Xenova/all-MiniLM-L6-v2';
const revision = '751bff37182d3f1213fa05d7196b954e230abad9';
const dtype = 'q8';
const cacheDir = fileURLToPath(new URL('../temp/huggingface/', import.meta.url));
const extractor = await pipeline('feature-extraction', modelId, { revision, dtype, cache_dir: cacheDir });
const vectors = [];
for (const skill of knowledge.skills) {
  const appearances = knowledge.appearances.filter((appearance) => appearance.skillId === skill.id);
  const text = [skill.label, skill.description, ...skill.topics, ...appearances.flatMap((a) => [a.strand, a.topic, ...a.constraints, ...a.scopeNotes])].join('. ');
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  vectors.push({ id: skill.id, vector: Array.from(output.data) });
}
const normalized = raw.toString('utf8').replace(/\r\n/g, '\n');
const output = { subject, knowledgeHash: createHash('sha256').update(normalized).digest('hex'), modelId, revision, dtype, vectors };
await mkdir(new URL(`../public/search/${subject}/`, import.meta.url), { recursive: true });
await writeFile(new URL(`../public/search/${subject}/corpus.json`, import.meta.url), JSON.stringify(output));
console.log(`Wrote ${vectors.length} vectors for ${subject}`);
