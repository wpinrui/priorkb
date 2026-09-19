"""Assemble a bounded, five-perspective topic assessment without changing the live graph."""
import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

CLASSES = ('essential', 'helpful', 'none')


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def build(directory):
    manifest = read(directory / 'manifest.json')
    packet_path = directory / 'packet.json'
    packet = read(packet_path)
    catalogue_path = directory / manifest['knowledge']
    knowledge_hash = hashlib.sha256(catalogue_path.read_text(encoding='utf-8').encode()).hexdigest()
    if packet['knowledgeSha256'] != knowledge_hash:
        raise ValueError('The trial catalogue has changed')
    candidates = {item['id']: item for item in packet['candidates']}
    if len(candidates) != len(packet['candidates']):
        raise ValueError('Duplicate candidate IDs')
    assessors = manifest['assessors']
    if len(assessors) != 5 or len({item['agentTask'] for item in assessors}) != 5:
        raise ValueError('Five distinct agent tasks are required')
    ballots = {}
    questions = set()
    for assessor in assessors:
        ballot = read(directory / assessor['votes'])
        if ballot['assessor'] != assessor['id'] or not ballot['question'].strip():
            raise ValueError('Missing assessor identity or question')
        questions.add(ballot['question'])
        votes = {item['candidateId']: item for item in ballot['votes']}
        if set(votes) != set(candidates) or len(votes) != len(ballot['votes']):
            raise ValueError('Each assessor must classify every candidate exactly once')
        if any(v['classification'] not in CLASSES or not v['rationale'].strip() for v in votes.values()):
            raise ValueError('Invalid vote')
        ballots[assessor['id']] = votes
    if len(questions) != 5:
        raise ValueError('This trial requires five distinct assessment questions')
    entries = []
    for candidate_id, candidate in candidates.items():
        votes = [{'assessor': who, **ballot[candidate_id]} for who, ballot in ballots.items()]
        counts = Counter(v['classification'] for v in votes)
        winner, count = counts.most_common(1)[0]
        classification = winner if count >= 4 else None
        entries.append({
            **candidate,
            'classification': classification,
            'status': 'needs-decision' if classification is None else 'rejected' if classification == 'none' else 'accepted',
            'counts': {key: counts[key] for key in CLASSES},
            'votes': votes,
        })
    findings_path = directory / 'findings.json'
    findings = read(findings_path) if findings_path.exists() else []
    result = {
        'formatVersion': 1,
        'scope': 'single-topic-trial',
        'target': packet['target'],
        'knowledgeSha256': knowledge_hash,
        'packetSha256': hashlib.sha256(packet_path.read_text(encoding='utf-8').encode()).hexdigest(),
        'policy': packet['policy'],
        'assessors': assessors,
        'summary': {
            'candidateCount': len(entries), 'voteCount': len(entries) * 5,
            'classifications': dict(Counter(e['classification'] or 'needs-decision' for e in entries)),
            'candidateKinds': dict(Counter(e['kind'] for e in entries)),
        },
        'entries': entries,
        'editorialFindings': findings,
    }
    (directory / 'assessment.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    lines = ['# Pythagoras prerequisite trial', '', 'Target: use of Pythagoras’ theorem, Secondary 2, G1/G2/G3.', '',
             'Five distinct questions. Independent candidate discovery, followed by independent assessment of the combined list. Four or five matching votes accept a class; other splits need a user decision.', '',
             'This is a single-topic trial, not a change to the live prerequisite graph. Inferred subskills are explicitly labelled and have no claimed syllabus introduction year.', '',
             '## Questions', '']
    for assessor in assessors:
        ballot = read(directory / assessor['votes'])
        lines.append(f"- **{assessor['id']}**: {ballot['question']}")
    for group in ('essential', 'helpful', 'needs-decision', 'none'):
        lines.extend(['', f'## {group.capitalize()}', '', '| Candidate | Scope | E / H / N |', '| --- | --- | --- |'])
        for entry in entries:
            if (entry['classification'] or 'needs-decision') != group:
                continue
            c = entry['counts']
            label = entry['label'].replace('|', '/')
            scope = 'Syllabus skill' if entry['skillId'] else 'Inferred subskill'
            lines.append(f"| {entry['id']}: {label} | {scope} | {c['essential']} / {c['helpful']} / {c['none']} |")
    if findings:
        lines.extend(['', '## Unresolved interpretation issues', ''])
        for finding in findings:
            lines.append(f"- {finding['description']}")
    lines.extend(['', 'Exact scopes, source appearances and all individual rationales are in [assessment.json](assessment.json). Original proposals are preserved in the discovery files. Similar-sounding but differently scoped candidates were not silently merged.', '',
                  'The native agent task identifiers in the manifest are actual task identities. They are not claimed to be Codex CLI session UUIDs. All five assessors used GPT-5.6 Luna. Distinct questions do not guarantee statistical independence or correctness.', ''])
    (directory / 'README.md').write_text('\n'.join(lines), encoding='utf-8', newline='\n')
    print(json.dumps(result['summary']))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path)
    build(parser.parse_args().directory)
