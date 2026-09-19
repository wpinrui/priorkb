#!/usr/bin/env python
"""Validate completed isolated voter runs and import their vote files."""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CLASSES = {"essential", "helpful", "none"}
VOTER_IDS = [f"luna-{index:02}" for index in range(1, 6)]


def fail(message: str) -> None:
    raise ValueError(message)


def read_json(path: Path) -> tuple[dict[str, Any], str]:
    text = path.read_text(encoding="utf-8")
    try:
        value = json.loads(text)
    except json.JSONDecodeError as error:
        fail(f"Invalid JSON in {path}: {error}")
    if not isinstance(value, dict):
        fail(f"Expected an object in {path}")
    return value, text


def resolve(manifest_path: Path, value: str | Path) -> Path:
    relative = Path(value)
    candidate = relative if relative.is_absolute() else manifest_path.parent / relative
    if candidate.exists():
        return candidate
    fail(f"Manifest path does not exist: {value}")


def cli_path(value: str) -> Path:
    path = Path(value)
    if not path.is_absolute():
        path = Path.cwd() / path
    if not path.exists():
        fail(f"Path does not exist: {value}")
    return path


def resolve_output(manifest_path: Path, value: str | Path) -> Path:
    candidate = manifest_path.parent / Path(value)
    if candidate.parent.exists() or not Path(value).is_absolute():
        return candidate
    return Path(value)


def load_events(path: Path) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError as error:
            fail(f"Invalid event JSON in {path}:{line_number}: {error}")
        if not isinstance(event, dict):
            fail(f"Event in {path}:{line_number} is not an object")
        events.append(event)
    return events


def event_tool_call(event: dict[str, Any]) -> bool:
    event_type = str(event.get("type", "")).lower()
    if any(marker in event_type for marker in ("tool", "function_call", "mcp", "command_execution", "web_search", "file_search", "computer")):
        return True
    item = event.get("item")
    if isinstance(item, dict):
        item_type = str(item.get("type", "")).lower()
        return "tool" in item_type or "function_call" in item_type or "mcp" in item_type
    return False


def inspect_events(path: Path) -> tuple[str, dict[str, Any], dict[str, Any]]:
    events = load_events(path)
    started = [event for event in events if event.get("type") == "thread.started"]
    if len(started) != 1 or not isinstance(started[0].get("thread_id"), str) or not started[0]["thread_id"]:
        fail(f"{path} must contain exactly one thread.started event with thread_id")
    completed = [event for event in events if event.get("type") == "turn.completed"]
    if not completed:
        fail(f"{path} has no completed turn")
    usage = completed[-1].get("usage")
    if not isinstance(usage, dict):
        fail(f"{path} completed turn has no usage object")
    tool_calls = [event for event in events if event_tool_call(event)]
    evidence = {
        "completedTurnCount": len(completed),
        "toolCallCount": len(tool_calls),
        "toolCalls": tool_calls,
    }
    return started[0]["thread_id"], usage, evidence


def validate_votes(raw: dict[str, Any], expected_ids: set[str], path: Path) -> list[dict[str, Any]]:
    votes = raw.get("votes")
    if not isinstance(votes, list) or len(votes) != len(expected_ids):
        fail(f"{path} must contain exactly one vote for every packet candidate")
    seen: set[str] = set()
    for vote in votes:
        if not isinstance(vote, dict):
            fail(f"{path} contains a non-object vote")
        for key in ("candidateId", "classification", "rationale"):
            if key not in vote:
                fail(f"{path} vote is missing {key}")
        candidate_id = vote["candidateId"]
        if candidate_id not in expected_ids:
            fail(f"{path} contains unknown candidate {candidate_id}")
        if candidate_id in seen:
            fail(f"{path} contains duplicate candidate {candidate_id}")
        if vote["classification"] not in CLASSES:
            fail(f"{path} contains invalid classification for {candidate_id}")
        if not isinstance(vote["rationale"], str) or not vote["rationale"].strip():
            fail(f"{path} contains an empty rationale for {candidate_id}")
        seen.add(candidate_id)
    missing = expected_ids - seen
    if missing:
        fail(f"{path} is missing candidates: {', '.join(sorted(missing))}")
    return votes


def vote_targets(manifest_path: Path, manifest: dict[str, Any]) -> list[Path]:
    values = manifest.get("relationshipVotes")
    if not isinstance(values, list) or len(values) != 5:
        fail("Manifest must list exactly five relationship vote output paths")
    return [resolve_output(manifest_path, value) for value in values]


def legacy_prompt(packet: dict[str, Any], source_path: Path) -> dict[str, str] | None:
    """Recover the exact prompt template used by the existing pilot runner."""
    if not source_path.exists():
        return None
    module = ast.parse(source_path.read_text(encoding="utf-8"), filename=str(source_path))
    for node in ast.walk(module):
        if not isinstance(node, ast.Assign) or not any(isinstance(target, ast.Name) and target.id == "prompt" for target in node.targets):
            continue
        value = node.value
        if isinstance(value, ast.BinOp) and isinstance(value.left, ast.Constant) and isinstance(value.left.value, str):
            prompt = value.left.value + json.dumps(packet, ensure_ascii=False)
            return {
                "promptVersion": "legacy-temp-run_pilot_voters.py",
                "promptSha256": hashlib.sha256(prompt.encode("utf-8")).hexdigest(),
                "promptText": prompt,
                "source": "temp/run_pilot_voters.py",
            }
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", default="data/mathematics/manifest.json")
    parser.add_argument("--raw-output-dir", default="temp/prerequisite-voters")
    parser.add_argument("--packet", help="Override manifest relationshipsPacket path")
    parser.add_argument("--model", default="gpt-5.6-luna")
    parser.add_argument("--legacy-prompt-script", help="Required only for an existing batch created without run-metadata.json")
    args = parser.parse_args()
    manifest_path = Path(args.manifest)
    manifest, _ = read_json(manifest_path)
    packet_path = cli_path(args.packet) if args.packet else resolve(manifest_path, manifest["relationshipsPacket"])
    packet, packet_text = read_json(packet_path)
    packet_hash = hashlib.sha256(packet_text.encode("utf-8")).hexdigest()
    expected_ids = {candidate["id"] for candidate in packet.get("candidates", [])}
    if not expected_ids:
        fail("Packet has no candidate IDs")
    raw_dir = Path(args.raw_output_dir)
    if not raw_dir.is_absolute():
        raw_dir = ROOT / raw_dir
    metadata_path = raw_dir / "run-metadata.json"
    metadata: dict[str, Any] | None = None
    if metadata_path.exists():
        metadata, _ = read_json(metadata_path)
        if metadata.get("packetSha256") != packet_hash:
            fail("Run metadata packetSha256 does not match the current packet")
        if metadata.get("model") != args.model:
            fail("Run metadata model does not match --model")
    prompt_info = None
    if metadata is not None and all(key in metadata for key in ("promptVersion", "promptSha256", "promptText")):
        if hashlib.sha256(metadata["promptText"].encode("utf-8")).hexdigest() != metadata["promptSha256"]:
            fail("Run metadata promptSha256 does not match promptText")
        prompt_info = {
            "promptVersion": metadata["promptVersion"],
            "promptSha256": metadata["promptSha256"],
            "promptText": metadata["promptText"],
            "source": "run-metadata.json",
        }
    elif metadata is None:
        if not args.legacy_prompt_script:
            fail("Raw batch has no run-metadata.json; pass --legacy-prompt-script to identify its recorded legacy prompt")
        legacy_path = Path(args.legacy_prompt_script)
        if not legacy_path.is_absolute():
            legacy_path = Path.cwd() / legacy_path
        prompt_info = legacy_prompt(packet, legacy_path)
        if prompt_info is None:
            fail(f"Could not recover legacy prompt from {legacy_path}")

    targets = vote_targets(manifest_path, manifest)
    voters: list[dict[str, Any]] = []
    sessions: set[str] = set()
    for index, voter_id in enumerate(VOTER_IDS):
        raw_path = raw_dir / f"{voter_id}.json"
        events_path = raw_dir / f"{voter_id}.events.jsonl"
        if not raw_path.exists() or not events_path.exists():
            fail(f"Missing completed raw run for {voter_id}")
        raw, _ = read_json(raw_path)
        votes = validate_votes(raw, expected_ids, raw_path)
        session_id, usage, execution = inspect_events(events_path)
        if session_id in sessions:
            fail(f"Duplicate real session ID: {session_id}")
        sessions.add(session_id)
        voters.append({
            "voterId": voter_id,
            "model": args.model,
            "sessionId": session_id,
            "packetSha256": packet_hash,
            "votes": votes,
            "usage": {"turnCompleted": usage},
            "executionEvidence": execution,
            "provenance": {
                "runMetadataPresent": metadata is not None,
                "packetHashComputed": True,
                "packetHashMatchedRunMetadata": metadata is not None,
            },
        })
        if prompt_info is not None:
            voters[-1]["promptProvenance"] = prompt_info

    for target in targets:
        if target.exists():
            fail(f"Refusing to overwrite existing imported vote file: {target}")
    for target, voter in zip(targets, voters):
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(voter, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    metadata_note = "with run metadata" if metadata is not None else "using the current packet hash; raw batch has no run metadata"
    print(f"imported {len(voters)} voters, {len(voters[0]['votes'])} votes each, {metadata_note}")


if __name__ == "__main__":
    main()
