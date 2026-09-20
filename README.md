# PriorKB

PriorKB maps syllabus learning objectives to the prior knowledge teachers can build
on. The initial subject is Singapore MOE Mathematics, covering primary, secondary
and A-level pathways.

The data contains source objectives and a generated skill catalogue with pathway,
year or band, scope constraints and source references. See the
[extraction report](data/mathematics/extraction-report.md) for coverage and editorial
decisions, the [transcription evidence](data/mathematics/transcription-report.md)
for formula corrections, and the [dataset format](data/README.md) for rebuilding
the catalogue or using another subject.

Original syllabus PDFs are local inputs in `syllabus/` and are gitignored.
A [five-voter prerequisite pilot](data/mathematics/prerequisite-conceptual-report.md)
records accepted links and disputed decisions with their evidence. It covers a
small selection using conceptual understanding as the definition of an essential
prerequisite. It does not cover the full prerequisite graph.

## Teacher website

The public website searches the complete extracted catalogue: 1,031 skills across
1,486 syllabus appearances. Filter by pathway and year, open a skill, and explore
its essential prerequisites, helpful prior knowledge and outgoing connections.
Separate appearances preserve overlaps between pathways. Primary Standard and
Foundation filters include their shared primary content.

The site loads the 36-link pilot plus the Pythagoras topic assessment: 63 accepted
links in total, with 15 disputed Pythagoras candidates kept under **Needs decision**.
Pythagoras has 10 essential and 17 helpful candidate links, including overlapping
competencies. Inferred instructional subskills are labelled separately and have no
invented source or introduction year. Source-backed skills keep their original
IDs; the semantic search catalogue remains unchanged.
The interface labels missing assessments explicitly. An empty list does
not establish that a topic has no prerequisites. Votes, human decisions and the
specific syllabus contexts assessed remain visible beside the links.

Source references identify the syllabus edition, item and page. They do not serve
the gitignored PDFs. An appearance indicates where content is listed, not proof
of its first introduction. Assumed knowledge and uncertain source labels are
identified separately. A-level records do not invent a J1/J2 assignment.

The app requires no accounts, server database or API keys. Topic links preserve
the current search and filters and can be shared with colleagues.

### Search by meaning

Keyword search works immediately. The optional **Search by meaning** switch runs
query embeddings in a browser worker and combines semantic and keyword rankings.
It ranks all skills eligible for the current filters, including topics without
matching keywords. Turning it off stops the worker and returns to keyword search.

The first semantic query downloads model files from Hugging Face and a WebAssembly
runtime from its configured CDN. Queries stay in the browser. Downloads and local
inference can take time on slower connections or devices; the app shows progress
and keeps keyword results available if the semantic search cannot complete.

The committed corpus uses [all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2)
through [Transformers.js](https://huggingface.co/docs/transformers.js), with a pinned
model revision, q8 weights, mean pooling and normalized vectors. The catalogue
hash and model settings must match before the index can be used. Rebuild after
editing the catalogue:

```sh
yarn build:search
```

This offline command writes `public/search/<subject>/corpus.json`. It needs an
internet connection for the initial model download and caches files in ignored
`temp/huggingface/`. Normal website builds use the committed index and do not run
model inference or regenerate prerequisite votes.

## Develop and build

Use Node 24 and Yarn 1.22.22. On PowerShell with restricted script execution,
invoke `yarn.cmd` in place of `yarn`.

```sh
yarn install --frozen-lockfile
yarn dev
yarn build
```

The production files are written to `dist/`. The MVP build bundles the website
without running the separate engineering checks.

## Host on Netlify

Import this repository into Netlify. The committed `netlify.toml` sets
`yarn build`, publishes `dist`, pins the build environment and supplies the SPA
fallback for shared links. No server functions or secret environment variables
are needed. You can also upload a locally built `dist` directory.

This follows [Netlify's Vite setup](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/).
The repository configuration prepares deployment; it does not create or publish
a Netlify site.

## Use a different subject

Document extraction and editorial decisions stay outside the application. Supply
another subject directory under `data/` using the existing manifest and dataset
formats, then run the catalogue and relationship assemblers described in the
[data guide](data/README.md). Set `VITE_SUBJECT` to that directory name when
building the website. Preserve the separate pathway appearances and source
references, and assess prerequisite candidates with the same five-voter policy.
Changing subjects does not require rebuilding the teacher interface.
Run `yarn build:search` with the same `VITE_SUBJECT` value to generate that subject's
semantic index. Keyword search remains available if a semantic index has not been
generated. A manifest without a `relationships` entry loads an entirely
unassessed catalogue; a manifest that names a missing or stale graph fails visibly.

For example, in PowerShell after supplying the chemistry data:

```powershell
$env:VITE_SUBJECT = 'chemistry'
yarn.cmd build:search
yarn.cmd build
```
