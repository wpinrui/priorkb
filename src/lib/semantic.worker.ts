import { env, pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';

type Request = { id: number; query: string; corpus: { modelId: string; revision: string; dtype: string; vectors: { id: string; vector: number[] }[] } };
const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const REVISION = '751bff37182d3f1213fa05d7196b954e230abad9';
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
let activeId = 0;
let latestId = 0;
let extractor: Promise<FeatureExtractionPipeline> | undefined;
let queue = Promise.resolve();

async function search(request: Request) {
  activeId = request.id;
  try {
    if (request.corpus.modelId !== MODEL_ID || request.corpus.revision !== REVISION || request.corpus.dtype !== 'q8') throw new Error('The semantic model and index versions differ.');
    self.postMessage({ id: request.id, type: 'status', message: 'Preparing the browser model. The first use downloads model files...' });
    extractor ??= pipeline('feature-extraction', MODEL_ID, {
      revision: REVISION, dtype: 'q8', device: 'wasm',
      progress_callback: (progress: { status: string; progress?: number }) => {
        if (progress.status === 'progress' && progress.progress !== undefined) self.postMessage({ id: activeId, type: 'status', message: `Downloading model file: ${Math.round(progress.progress)}%` });
      },
    });
    const model = await extractor;
    if (request.id !== latestId) { self.postMessage({ id: request.id, type: 'error', message: 'A newer search replaced this query.' }); return; }
    self.postMessage({ id: request.id, type: 'status', message: 'Finding related topics...' });
    const output = await model(request.query, { pooling: 'mean', normalize: true });
    const query = output.data as Float32Array;
    const results = request.corpus.vectors.map((item) => {
      let score = 0;
      for (let i = 0; i < query.length; i++) score += query[i] * item.vector[i];
      return { id: item.id, score };
    }).sort((a, b) => b.score - a.score);
    self.postMessage({ id: request.id, type: 'results', results });
  } catch (error) {
    extractor = undefined;
    self.postMessage({ id: request.id, type: 'error', message: error instanceof Error ? error.message : 'The semantic model could not run.' });
  }
}

self.onmessage = (event: MessageEvent<Request>) => {
  latestId = event.data.id;
  queue = queue.then(() => search(event.data));
};
