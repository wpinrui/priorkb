#!/usr/bin/env python
"""Aggregate prerequisite pilot votes into a reviewable relationship file."""

from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


CLASSES = ("essential", "helpful", "none")
VOTER_COUNT = 5
ACCEPTANCE_THRESHOLD = 4


def fail(message: str) -> None:
    raise ValueError(message)


def normalized_text(path: Path) -> str:
    with path.open("r", encoding="utf-8", newline=None) as handle:
        return handle.read()


def load_json(path: Path) -> tuple[dict[str, Any], str]:
    text = normalized_text(path)
    try:
        value = json.loads(text)
    except json.JSONDecodeError as error:
        fail(f"Invalid JSON in {path}: {error}")
    if not isinstance(value, dict):
        fail(f"Expected an object in {path}")
    return value, text


def resolve(manifest_path: Path, value: str) -> Path:
    relative = manifest_path.parent / value
    if relative.exists():
        return relative
    fail(f"Manifest path does not exist: {value}")


def require_keys(value: dict[str, Any], keys: tuple[str, ...], label: str) -> None:
    missing = [key for key in keys if key not in value]
    if missing:
        fail(f"{label} is missing required fields: {', '.join(missing)}")


def validate_packet(packet: dict[str, Any]) -> None:
    require_keys(packet, ("formatVersion", "subject", "scope", "purpose", "knowledgeSha256", "candidates", "evidence"), "Packet")
    if packet["formatVersion"] != 1:
        fail("Packet formatVersion must be 1")
    if not isinstance(packet["candidates"], list) or not packet["candidates"]:
        fail("Packet candidates must be a non-empty array")


def validate_candidates(packet: dict[str, Any], skills: dict[str, Any], appearances: dict[str, Any]) -> dict[str, dict[str, Any]]:
    candidates: dict[str, dict[str, Any]] = {}
    pairs: set[tuple[str, str]] = set()
    for candidate in packet["candidates"]:
        require_keys(candidate, ("id", "prerequisiteSkillId", "dependentSkillId", "contexts", "candidateReasons"), "Candidate")
        candidate_id = candidate["id"]
        if candidate_id in candidates:
            fail(f"Duplicate candidate ID: {candidate_id}")
        prerequisite = candidate["prerequisiteSkillId"]
        dependent = candidate["dependentSkillId"]
        if prerequisite not in skills or dependent not in skills:
            fail(f"Candidate {candidate_id} references an unknown skill")
        if prerequisite == dependent:
            fail(f"Candidate {candidate_id} is a self-pair")
        pair = (prerequisite, dependent)
        if pair in pairs:
            fail(f"Duplicate directed skill pair: {prerequisite} -> {dependent}")
        pairs.add(pair)
        if not isinstance(candidate["contexts"], list) or not candidate["contexts"]:
            fail(f"Candidate {candidate_id} must have at least one context")
        if not isinstance(candidate["candidateReasons"], list) or not candidate["candidateReasons"]:
            fail(f"Candidate {candidate_id} must have at least one candidate reason")
        for context in candidate["contexts"]:
            require_keys(context, ("prerequisiteAppearanceId", "dependentAppearanceId"), f"Context for {candidate_id}")
            prior_id = context["prerequisiteAppearanceId"]
            dependent_id = context["dependentAppearanceId"]
            if prior_id not in appearances or dependent_id not in appearances:
                fail(f"Candidate {candidate_id} references an unknown appearance")
            if appearances[prior_id].get("skillId") != prerequisite:
                fail(f"Candidate {candidate_id} prerequisite context does not belong to its prerequisite skill")
            if appearances[dependent_id].get("skillId") != dependent:
                fail(f"Candidate {candidate_id} dependent context does not belong to its dependent skill")
        candidates[candidate_id] = candidate
    return candidates


def validate_votes(vote_paths: list[Path], candidates: dict[str, dict[str, Any]], packet_hash: str) -> tuple[list[dict[str, Any]], dict[str, dict[str, dict[str, Any]]]]:
    if len(vote_paths) != VOTER_COUNT:
        fail(f"Expected exactly {VOTER_COUNT} vote files, found {len(vote_paths)}")
    voters: list[dict[str, Any]] = []
    by_candidate: dict[str, dict[str, dict[str, Any]]] = defaultdict(dict)
    voter_ids: set[str] = set()
    session_ids: set[str] = set()
    prompt_hashes: set[str] = set()
    expected_ids = set(candidates)
    for path in vote_paths:
        vote_file, _ = load_json(path)
        require_keys(vote_file, ("voterId", "model", "sessionId", "packetSha256", "votes"), f"Vote file {path}")
        voter_id = vote_file["voterId"]
        session_id = vote_file["sessionId"]
        if not all(isinstance(vote_file[key], str) and vote_file[key].strip() for key in ("voterId", "model", "sessionId")):
            fail(f"Voter identity must not be empty: {path}")
        if voter_id in voter_ids:
            fail(f"Duplicate voterId: {voter_id}")
        if session_id in session_ids:
            fail(f"Duplicate sessionId: {session_id}")
        voter_ids.add(voter_id)
        session_ids.add(session_id)
        if vote_file["packetSha256"] != packet_hash:
            fail(f"Packet SHA256 mismatch in {path}")
        prompt = vote_file.get("promptProvenance", {})
        prompt_hash = prompt.get("promptSha256")
        if not prompt_hash or hashlib.sha256(prompt.get("promptText", "").encode("utf-8")).hexdigest() != prompt_hash:
            fail(f"Missing or inconsistent prompt provenance in {path}")
        prompt_hashes.add(prompt_hash)
        if len(prompt_hashes) != 1:
            fail("All five voters must assess the same prompt and evidence")
        votes = vote_file["votes"]
        if not isinstance(votes, list) or len(votes) != len(candidates):
            fail(f"Vote file {path} must contain exactly one vote for every candidate")
        seen: set[str] = set()
        for vote in votes:
            require_keys(vote, ("candidateId", "classification", "rationale"), f"Vote in {path}")
            candidate_id = vote["candidateId"]
            if candidate_id not in candidates:
                fail(f"Unknown candidate {candidate_id} in {path}")
            if candidate_id in seen:
                fail(f"Duplicate candidate vote {candidate_id} in {path}")
            if vote["classification"] not in CLASSES:
                fail(f"Invalid classification for {candidate_id} in {path}")
            if not isinstance(vote["rationale"], str) or not vote["rationale"].strip():
                fail(f"Missing rationale for {candidate_id} in {path}")
            seen.add(candidate_id)
            by_candidate[candidate_id][voter_id] = {
                "voterId": voter_id,
                "model": vote_file["model"],
                "sessionId": session_id,
                "classification": vote["classification"],
                "rationale": vote["rationale"],
            }
        missing = expected_ids - seen
        if missing:
            fail(f"Vote file {path} is missing candidates: {', '.join(sorted(missing))}")
        voters.append({"voterId": voter_id, "model": vote_file["model"], "sessionId": session_id, "promptSha256": prompt_hash})
    return voters, by_candidate


def validate_decisions(
    path: Path | None,
    candidates: dict[str, dict[str, Any]],
    packet_hash: str,
    knowledge_hash: str,
) -> dict[str, dict[str, Any]]:
    if path is None:
        return {}
    decisions_file, _ = load_json(path)
    require_keys(decisions_file, ("formatVersion", "packetSha256", "knowledgeSha256", "decisions"), f"Decision file {path}")
    if decisions_file["formatVersion"] != 1:
        fail(f"Decision file {path} formatVersion must be 1")
    if decisions_file["packetSha256"] != packet_hash:
        fail(f"Packet SHA256 mismatch in decision file {path}")
    if decisions_file["knowledgeSha256"] != knowledge_hash:
        fail(f"Knowledge SHA256 mismatch in decision file {path}")
    decisions = decisions_file["decisions"]
    if not isinstance(decisions, list):
        fail(f"Decision file {path} decisions must be an array")
    by_candidate: dict[str, dict[str, Any]] = {}
    for decision in decisions:
        require_keys(decision, ("candidateId", "classification", "decidedBy", "reason", "evidence"), f"Decision in {path}")
        candidate_id = decision["candidateId"]
        if candidate_id not in candidates:
            fail(f"Unknown decision candidate {candidate_id}")
        if candidate_id in by_candidate:
            fail(f"Duplicate decision candidate {candidate_id}")
        if decision["classification"] not in CLASSES:
            fail(f"Invalid decision classification for {candidate_id}")
        for field in ("decidedBy", "reason", "evidence"):
            if not isinstance(decision[field], str) or not decision[field].strip():
                fail(f"Decision {candidate_id} has an empty {field}")
        by_candidate[candidate_id] = decision
    return by_candidate


def has_path(adjacency: dict[str, set[str]], start: str, target: str, excluded: tuple[str, str]) -> bool:
    pending = [start]
    visited: set[str] = set()
    while pending:
        current = pending.pop()
        if current == target:
            return True
        if current in visited:
            continue
        visited.add(current)
        for next_node in adjacency.get(current, set()):
            if (current, next_node) != excluded:
                pending.append(next_node)
    return False


def cycle_edges(entries: list[dict[str, Any]]) -> set[tuple[str, str]]:
    adjacency: dict[str, set[str]] = defaultdict(set)
    for entry in entries:
        if entry["status"] == "accepted" and entry["effectiveClassification"] == "essential":
            adjacency[entry["prerequisiteSkillId"]].add(entry["dependentSkillId"])
    result: set[tuple[str, str]] = set()
    for prerequisite, dependents in adjacency.items():
        for dependent in dependents:
            if has_path(adjacency, dependent, prerequisite, (prerequisite, dependent)):
                result.add((prerequisite, dependent))
    return result


def build(manifest_path: Path) -> dict[str, Any]:
    manifest, _ = load_json(manifest_path)
    require_keys(manifest, ("relationshipsPacket", "relationshipVotes", "relationships", "knowledge"), "Manifest")
    packet_path = resolve(manifest_path, manifest["relationshipsPacket"])
    knowledge_path = resolve(manifest_path, manifest["knowledge"])
    vote_paths = [resolve(manifest_path, value) for value in manifest["relationshipVotes"]]
    packet, packet_text = load_json(packet_path)
    knowledge, knowledge_text = load_json(knowledge_path)
    validate_packet(packet)
    if packet["subject"] != knowledge["subject"] or packet["subject"] != manifest["subject"]:
        fail("Manifest, knowledge and packet subjects must agree")
    packet_hash = hashlib.sha256(packet_text.encode("utf-8")).hexdigest()
    knowledge_hash = hashlib.sha256(knowledge_text.encode("utf-8")).hexdigest()
    if packet["knowledgeSha256"] != knowledge_hash:
        fail("Packet knowledgeSha256 does not match the normalized knowledge file")
    skills = {skill["id"]: skill for skill in knowledge.get("skills", [])}
    appearances = {appearance["id"]: appearance for appearance in knowledge.get("appearances", [])}
    if len(skills) != len(knowledge.get("skills", [])):
        fail("Knowledge contains duplicate skill IDs")
    if len(appearances) != len(knowledge.get("appearances", [])):
        fail("Knowledge contains duplicate appearance IDs")
    candidates = validate_candidates(packet, skills, appearances)
    voters, vote_map = validate_votes(vote_paths, candidates, packet_hash)
    decision_path = resolve(manifest_path, manifest["relationshipDecisions"]) if manifest.get("relationshipDecisions") else None
    human_decisions = validate_decisions(decision_path, candidates, packet_hash, knowledge_hash)

    entries: list[dict[str, Any]] = []
    for candidate in packet["candidates"]:
        candidate_id = candidate["id"]
        votes = [vote_map[candidate_id][voter["voterId"]] for voter in voters]
        counts = Counter(vote["classification"] for vote in votes)
        winner, winner_count = max(((classification, counts[classification]) for classification in CLASSES), key=lambda item: item[1])
        if winner_count >= ACCEPTANCE_THRESHOLD:
            status = "rejected" if winner == "none" else "accepted"
        else:
            status = "needs-decision"
        entries.append({
            "id": candidate_id,
            "prerequisiteSkillId": candidate["prerequisiteSkillId"],
            "dependentSkillId": candidate["dependentSkillId"],
            "direction": f"{candidate['prerequisiteSkillId']} -> {candidate['dependentSkillId']}",
            "contexts": candidate["contexts"],
            "candidateReasons": candidate["candidateReasons"],
            "consensus": {
                "classification": winner if winner_count >= ACCEPTANCE_THRESHOLD else None,
                "counts": {classification: counts[classification] for classification in CLASSES},
                "voteCount": len(votes),
            },
            "status": status,
            "votes": votes,
        })

        decision = human_decisions.get(candidate_id)
        if decision is not None:
            entry = entries[-1]
            entry["effectiveClassification"] = decision["classification"]
            entry["decisionSource"] = "user"
            entry["humanDecision"] = decision
            entry["status"] = "rejected" if decision["classification"] == "none" else "accepted"
        else:
            entry = entries[-1]
            entry["effectiveClassification"] = entry["consensus"]["classification"]
            entry["decisionSource"] = "consensus" if entry["consensus"]["classification"] is not None else None

    structural_cycles = cycle_edges(entries)
    for entry in entries:
        edge = (entry["prerequisiteSkillId"], entry["dependentSkillId"])
        if edge in structural_cycles:
            entry["status"] = "needs-decision"
            entry["reviewFlags"] = ["cycle-in-accepted-essential-graph"]
            entry["reviewReason"] = "The effective classification was essential, but this directed edge participates in a cycle in the accepted essential prerequisite graph."

    incoming = Counter(entry["dependentSkillId"] for entry in entries)
    skill_coverage = [
        {
            "skillId": skill_id,
            "incomingCandidateCount": incoming.get(skill_id, 0),
            "status": "pilot-only" if incoming.get(skill_id, 0) else "unassessed",
        }
        for skill_id in sorted(skills)
    ]
    status_counts = Counter(entry["status"] for entry in entries)
    classification_counts = Counter(entry["consensus"]["classification"] for entry in entries if entry["consensus"]["classification"] is not None)
    effective_counts = Counter(entry["effectiveClassification"] for entry in entries if entry["effectiveClassification"] is not None)
    output = {
        "formatVersion": 1,
        "subject": packet["subject"],
        "scope": packet["scope"],
        "purpose": packet["purpose"],
        "packetSha256": packet_hash,
        "knowledgeSha256": knowledge_hash,
        "voteFiles": manifest["relationshipVotes"],
        "voters": voters,
        "summary": {
            "candidateCount": len(entries),
            "voterCount": len(voters),
            "voteCount": len(entries) * len(voters),
            "consensusClassificationCounts": {classification: classification_counts[classification] for classification in CLASSES},
            "finalClassificationCounts": {classification: effective_counts[classification] for classification in CLASSES},
            "humanDecisionCount": len(human_decisions),
            "statusCounts": {status: status_counts[status] for status in ("accepted", "rejected", "needs-decision")},
            "cycleEdgeCount": len(structural_cycles),
            "coverageNote": "Pilot-only coverage. Skills without pilot candidates remain unassessed; this output makes no complete prerequisite-graph claim.",
        },
        "entries": entries,
        "skillCoverage": skill_coverage,
    }
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", nargs="?", default="data/mathematics/manifest.json")
    args = parser.parse_args()
    manifest_path = Path(args.manifest)
    output = build(manifest_path)
    manifest, _ = load_json(manifest_path)
    output_path = manifest_path.parent / manifest["relationships"]
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {output_path}: {len(output['entries'])} entries, {output['summary']['voteCount']} votes")


if __name__ == "__main__":
    main()
