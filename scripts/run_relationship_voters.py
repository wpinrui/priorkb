#!/usr/bin/env python
"""Run isolated read-only voters against a manifest-selected packet."""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import shutil
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PROMPT_VERSION = "relationship-voter-v1"


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
    fail(f"Path does not exist: {value}")


def cli_path(value: str) -> Path:
    path = Path(value)
    if not path.is_absolute():
        path = Path.cwd() / path
    if not path.exists():
        fail(f"Path does not exist: {value}")
    return path


def build_schema(packet: dict[str, Any]) -> dict[str, Any]:
    candidate_ids = [candidate["id"] for candidate in packet["candidates"]]
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["votes"],
        "properties": {
            "votes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["candidateId", "classification", "rationale"],
                    "properties": {
                        "candidateId": {"type": "string", "enum": candidate_ids},
                        "classification": {"type": "string", "enum": ["essential", "helpful", "none"]},
                        "rationale": {"type": "string"},
                    },
                },
            }
        },
    }


def make_prompt(packet: dict[str, Any]) -> str:
    subject = packet.get("subject", "the stated subject")
    return f"""You are one independent curriculum assessor for the {subject} curriculum in PriorKB.
This is a bounded read-only assessment, not an implementation task. Do not edit
files, run commands, delegate, browse, or read other workers' votes. All evidence
you need is included below. Return exactly one vote per candidate with a concise
subject-specific justification. Judge the direction prerequisite -> dependent.

essential: prior mastery of this specific skill is required to perform or learn
the dependent competence as scoped. Do not treat a merely common teaching order
or one optional solution method as necessary.
helpful: the skill offers a concrete useful bridge but is not required.
none: there is no defensible prior-knowledge link in this direction, or the
candidate confuses overlap/equivalence with a prerequisite.

Use the canonical skill description and each appearance's scopeNotes and
constraints to define the competence. The parent topic and sourceText are
provenance and context. Do not reattach sibling competencies from a compound
source bullet when the canonical skill or appearance scope excludes them.
Prefer immediate instructional building blocks; if a relation is only a remote
ancestral dependency, explain that limitation rather than assuming a direct link.
Pathways are parallel curricula, not a chronological hierarchy. Earlier source
placement alone is not evidence of necessity. Do not infer an unstated year or
cohort order.
Assumed knowledge can be essential, but does not establish when
it was introduced. Source-uncertain cohort labels do not invalidate otherwise
clear subject content. Classify the skills using all their scope notes.
Do not invent syllabus claims. No web lookup is required. This is only a pilot
and does not imply that omitted pairs are absent from the full prerequisite graph.

FROZEN EVIDENCE:
""" + json.dumps(packet, ensure_ascii=False)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", default="data/mathematics/manifest.json")
    parser.add_argument("--packet", help="Override manifest relationshipsPacket path")
    parser.add_argument("--output-dir", default="temp/prerequisite-voters")
    parser.add_argument("--model", default="gpt-5.6-luna")
    parser.add_argument("--max-concurrent", type=int, default=3)
    parser.add_argument("--voter-count", type=int, default=5)
    args = parser.parse_args()
    if args.max_concurrent < 1:
        fail("--max-concurrent must be positive")
    if args.voter_count != 5:
        fail("Exactly five independent voters are required")

    manifest_path = Path(args.manifest)
    manifest, _ = read_json(manifest_path)
    packet_path = cli_path(args.packet) if args.packet else resolve(manifest_path, manifest["relationshipsPacket"])
    packet, packet_text = read_json(packet_path)
    if packet.get("formatVersion") != 1 or not packet.get("candidates"):
        fail("Packet must have formatVersion 1 and a non-empty candidates array")
    packet_hash = hashlib.sha256(packet_text.encode("utf-8")).hexdigest()
    output_dir = Path(args.output_dir)
    if not output_dir.is_absolute():
        output_dir = ROOT / output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    voter_ids = [f"luna-{index:02}" for index in range(1, args.voter_count + 1)]
    existing = [output_dir / f"{voter_id}.json" for voter_id in voter_ids]
    if any(path.exists() for path in existing):
        names = ", ".join(path.name for path in existing if path.exists())
        fail(f"Refusing to overwrite existing voter outputs: {names}")
    executable = shutil.which("codex.exe") or shutil.which("codex")
    if not executable:
        fail("Codex CLI not found")

    schema_path = output_dir / "response.schema.json"
    schema_path.write_text(json.dumps(build_schema(packet), ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    prompt = make_prompt(packet)
    metadata = {
        "packetPath": str(packet_path),
        "packetSha256": packet_hash,
        "model": args.model,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "voterIds": voter_ids,
        "maxConcurrent": args.max_concurrent,
        "promptVersion": PROMPT_VERSION,
        "promptSha256": hashlib.sha256(prompt.encode("utf-8")).hexdigest(),
        "promptText": prompt,
    }
    (output_dir / "run-metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")

    def run(voter_id: str) -> None:
        output_path = output_dir / f"{voter_id}.json"
        command = [
            executable,
            "exec",
            "--ephemeral",
            "-m",
            args.model,
            "-s",
            "read-only",
            "-c",
            'approval_policy="never"',
            "-c",
            'model_reasoning_effort="high"',
            "--json",
            "--output-schema",
            str(schema_path),
            "-o",
            str(output_path),
            "-",
        ]
        started = time.time()
        with (output_dir / f"{voter_id}.events.jsonl").open("w", encoding="utf-8", newline="\n") as stdout, (output_dir / f"{voter_id}.stderr.log").open("w", encoding="utf-8", newline="\n") as stderr:
            result = subprocess.run(command, input=prompt, text=True, encoding="utf-8", stdout=stdout, stderr=stderr, cwd=ROOT)
        print(json.dumps({"voterId": voter_id, "exitCode": result.returncode, "seconds": round(time.time() - started, 1)}), flush=True)
        if result.returncode:
            raise RuntimeError(f"{voter_id} failed; see its local log")

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.max_concurrent) as pool:
        futures = [pool.submit(run, voter_id) for voter_id in voter_ids]
        for future in concurrent.futures.as_completed(futures):
            future.result()


if __name__ == "__main__":
    main()
