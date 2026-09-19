import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadCatalogue, pathwayLabel, yearLabel, type Catalogue, type Skill } from './lib/catalogue';
import { searchSkills } from './lib/search';
import { semanticSearch, disposeSemantic } from './lib/semantic';
import { SkillEvidence } from './components/SkillEvidence';

type Navigation = { query: string; pathway: string; year: string; linkedOnly: boolean; skill: string | null };
function readNavigation(): Navigation {
  const p = new URLSearchParams(location.search);
  return { query: p.get('q') ?? '', pathway: p.get('pathway') ?? '', year: p.get('year') ?? '', linkedOnly: p.get('linked') === '1', skill: p.get('skill') };
}
function navigationUrl(state: Navigation) {
  const p = new URLSearchParams();
  if (state.query) p.set('q', state.query);
  if (state.pathway) p.set('pathway', state.pathway);
  if (state.year) p.set('year', state.year);
  if (state.linkedOnly) p.set('linked', '1');
  if (state.skill) p.set('skill', state.skill);
  return `${location.pathname}${p.size ? `?${p}` : ''}`;
}
function Logo() {
  return <div className="brand"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 7.5 16 3l11 4.5v17L16 29 5 24.5z"/><path d="M5 7.5 16 12l11-4.5M16 12v17"/></svg><span>PriorKB</span></div>;
}

export function App() {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [navigation, setNavigation] = useState(readNavigation);
  const [semantic, setSemantic] = useState(false);
  const [semanticStatus, setSemanticStatus] = useState('');
  const [semanticResult, setSemanticResult] = useState<{ key: string; skills: Skill[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [limit, setLimit] = useState(40);
  const searchBox = useRef<HTMLInputElement>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const request = useRef(0);
  const { query, pathway, year, linkedOnly } = navigation;
  const filters = useMemo(() => ({ pathway, year, linkedOnly }), [pathway, year, linkedOnly]);
  const resultKey = JSON.stringify([query, pathway, year, linkedOnly]);
  const load = useCallback(() => {
    setStatus('loading');
    loadCatalogue().then((value) => { setCatalogue(value); setStatus('ready'); }).catch((cause) => {
      setError(cause instanceof Error ? cause.message : 'The catalogue could not be loaded.');
      setStatus('error');
    });
  }, []);
  useEffect(() => { load(); return () => disposeSemantic(); }, [load]);
  useEffect(() => {
    const restore = () => setNavigation(readNavigation());
    addEventListener('popstate', restore);
    return () => removeEventListener('popstate', restore);
  }, []);
  const navigate = (patch: Partial<Navigation>, push = false) => {
    const next = { ...navigation, ...patch };
    const url = navigationUrl(next);
    if (push && url !== `${location.pathname}${location.search}`) history.pushState(null, '', url);
    else history.replaceState(null, '', url);
    setNavigation(next);
    setCopied(false);
  };
  const lexical = useMemo(() => catalogue ? searchSkills(catalogue, query, filters) : [], [catalogue, query, filters]);
  useEffect(() => {
    const id = ++request.current;
    if (!catalogue || !semantic || !query.trim()) {
      setSemanticStatus(semantic ? 'Enter a topic to search by meaning.' : '');
      if (!semantic) disposeSemantic();
      return;
    }
    setSemanticStatus('Showing keyword results while semantic search prepares...');
    const timer = setTimeout(() => {
      semanticSearch(catalogue, query, filters, (message) => {
        if (id === request.current) setSemanticStatus(message);
      }).then((skills) => {
        if (id === request.current) setSemanticResult({ key: resultKey, skills });
      });
    }, 350);
    return () => { clearTimeout(timer); request.current += 1; };
  }, [catalogue, query, filters, semantic, resultKey]);
  const results = semantic && semanticResult?.key === resultKey ? semanticResult.skills : lexical;
  const selected = catalogue?.skills.find((skill) => skill.id === navigation.skill) ?? (!navigation.skill ? results[0] : undefined);
  useEffect(() => {
    if (!navigation.skill && selected) {
      const next = { ...navigation, skill: selected.id };
      history.replaceState(null, '', navigationUrl(next));
      setNavigation(next);
    }
  }, [navigation, selected]);
  useEffect(() => { setLimit(40); }, [resultKey, semantic]);
  const select = (id: string) => {
    navigate({ skill: id }, true);
    requestAnimationFrame(() => detailHeading.current?.focus({ preventScroll: false }));
  };
  const reset = () => navigate({ query: '', pathway: '', year: '', linkedOnly: false, skill: null });
  const copy = async () => {
    const url = new URL(navigationUrl({ ...navigation, skill: selected?.id ?? navigation.skill }), location.origin).href;
    try { await navigator.clipboard.writeText(url); setCopied(true); }
    catch { window.prompt('Copy this topic link', url); }
  };
  const pathways = catalogue ? [...new Set(catalogue.appearances.map((appearance) => appearance.pathway))] : [];
  const years = catalogue ? [...new Set(catalogue.appearances.filter((appearance) => !pathway || appearance.pathway === pathway || (['primary-standard', 'primary-foundation'].includes(pathway) && appearance.pathway === 'primary-common')).map((appearance) => appearance.year).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })) : [];
  const accepted = catalogue?.relationships.filter((r) => r.status === 'accepted' && ['essential', 'helpful'].includes(r.effectiveClassification ?? '')) ?? [];
  const outside = selected && !lexical.some((skill) => skill.id === selected.id) && !(semantic && results.some((skill) => skill.id === selected.id));

  return <div className="app-shell">
    <a className="skip-link" href="#search">Skip to search</a>
    <header className="topbar"><Logo/><span className="topbar-note">A workspace for teachers</span><button className="link-button" onClick={() => { reset(); searchBox.current?.focus(); }}>Reset search</button></header>
    <main className="workspace">
      <section className="hero"><div><p className="eyebrow">{catalogue?.title ?? 'Curriculum knowledge map'}</p><h1>Find the knowledge<br/>to build on.</h1><p className="hero-copy">Find a syllabus topic, explore its prior knowledge, and see where the same skill appears across pathways.</p></div><div className="coverage"><strong>{catalogue?.skills.length.toLocaleString() ?? '...'}</strong><span>searchable skills</span><strong>{catalogue?.appearances.length.toLocaleString() ?? '...'}</strong><span>syllabus appearances</span></div></section>
      <div className="notice coverage-banner"><strong>Prerequisite pilot</strong> {accepted.length} accepted links are available. The full catalogue is searchable; most prerequisite relationships are still unassessed.</div>
      <section className="search-panel" aria-label="Search syllabus">
        <label htmlFor="search">What are you teaching?</label>
        <div className="search-row"><div className="search-input"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input ref={searchBox} id="search" type="search" value={query} onChange={(event) => navigate({ query: event.target.value, skill: null })} placeholder={catalogue?.subject === 'mathematics' ? 'Try fractions, quadratic equations, or rate of change' : 'Search a topic or describe what you are teaching'}/></div></div>
        <div className="filter-row">
          <label>Pathway<select value={pathway} onChange={(event) => navigate({ pathway: event.target.value, year: '', skill: null })}><option value="">All pathways</option>{pathway && !pathways.includes(pathway) && <option value={pathway}>Unknown pathway: {pathway}</option>}{pathways.map((id) => <option key={id} value={id}>{pathwayLabel(id)}</option>)}</select></label>
          <label>Year or band<select value={year} onChange={(event) => navigate({ year: event.target.value, skill: null })}><option value="">All years</option>{year && !years.includes(year) && <option value={year}>{year} (outside this pathway)</option>}{years.map((value) => <option key={value} value={value}>{yearLabel(value)}</option>)}</select></label>
          <label className="toggle"><input type="checkbox" checked={linkedOnly} onChange={(event) => navigate({ linkedOnly: event.target.checked, skill: null })}/><span className="switch"/>With assessed links</label>
          <label className="toggle"><input type="checkbox" checked={semantic} onChange={(event) => { setSemanticResult(null); setSemantic(event.target.checked); }}/><span className="switch"/>Search by meaning</label>
        </div>
        <p className="caption">Search by meaning downloads a model on first use. Queries are processed in your browser. Keyword search is always available.</p>
        {semantic && <p className="search-status" role="status">{semanticStatus}</p>}
      </section>
      {status === 'loading' && <div className="state-card" role="status">Loading the syllabus catalogue...</div>}
      {status === 'error' && <div className="state-card" role="alert"><strong>Could not load the catalogue</strong><p>{error}</p><button className="secondary-button" onClick={load}>Try again</button></div>}
      {status === 'ready' && <div className="content-grid">
        <aside className="results-pane" aria-label="Search results"><div className="results-header"><div><span className="eyebrow">{semantic ? 'Ranked topics' : 'Search results'}</span><h2 aria-live="polite">{results.length.toLocaleString()} skills</h2></div></div>
          {results.length ? <div className="result-list">{results.slice(0, limit).map((skill) => <button className={`result-item ${selected?.id === skill.id ? 'active' : ''}`} aria-current={selected?.id === skill.id ? 'true' : undefined} key={skill.id} onClick={() => select(skill.id)}><span className="result-label">{skill.label}</span><span>{skill.topics.slice(0, 2).join(' / ')}</span><span className="result-meta">{skill.appearanceIds.length} syllabus {skill.appearanceIds.length === 1 ? 'appearance' : 'appearances'}{accepted.some((r) => r.prerequisiteSkillId === skill.id || r.dependentSkillId === skill.id) ? ', pilot links available' : ''}</span></button>)}{limit < results.length && <button className="secondary-button show-more" onClick={() => setLimit(limit + 40)}>Show more ({results.length - limit} remaining)</button>}</div> : <div className="empty"><h3>No matching skills</h3><p>Try a broader topic or remove a filter.</p><button className="link-button" onClick={reset}>Reset filters</button></div>}
        </aside>
        <article className="detail-pane" aria-label="Selected skill">{selected ? <div className="detail">
          <div className="detail-heading"><div><span className="eyebrow">Learning objective</span><h2 ref={detailHeading} tabIndex={-1}>{selected.label}</h2>{selected.description !== selected.label && <p>{selected.description}</p>}</div><button className="share-button" onClick={copy}>{copied ? 'Link copied' : 'Copy link'}</button></div>
          {outside && <p className="notice">This linked skill is outside your current search. Its evidence remains open so you can follow the connection.</p>}
          <div className="stat-strip"><div><strong>{selected.appearanceIds.length}</strong><span>syllabus appearances</span></div><div><strong>{accepted.filter((r) => r.dependentSkillId === selected.id).length}</strong><span>prior knowledge links</span></div><div><strong>{accepted.filter((r) => r.prerequisiteSkillId === selected.id).length}</strong><span>onward links</span></div></div>
          <SkillEvidence key={selected.id} skill={selected} catalogue={catalogue!} onSelect={select}/>
        </div> : <div className="detail-empty"><h2>{navigation.skill ? 'This skill link is unavailable' : 'Select a skill to explore'}</h2><p>{navigation.skill ? 'The skill may belong to another catalogue version. Search for its topic to find the current record.' : 'Choose a result to see its syllabus appearances and relationship evidence.'}</p></div>}</article>
      </div>}
      <footer className="disclosure"><strong>About this map</strong><span>Essential prior knowledge is needed to understand and explain a concept. Helpful prior knowledge provides a useful connection but is not required.</span><span>Links are inferred assessments, not official MOE prerequisite statements. Four or five agreeing model assessments accept a link; disputed links require a recorded human decision.</span><span>Source pages and editions are recorded. Original syllabus documents are not hosted here. A missing link does not mean there are no prerequisites.</span></footer>
    </main>
  </div>;
}
