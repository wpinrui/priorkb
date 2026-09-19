#!/usr/bin/env python
"""Prepare a manifest-selected prerequisite assessment packet."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


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


def resolve_output(value: str | Path, manifest_path: Path) -> Path:
    return Path(value)


def load_dataset_objectives(manifest_path: Path, manifest: dict[str, Any]) -> dict[str, dict[str, Any]]:
    objectives: dict[str, dict[str, Any]] = {}
    for filename in manifest.get("datasets", []):
        dataset, _ = read_json(resolve(manifest_path, filename))
        for objective in dataset.get("objectives", []):
            objective_id = objective.get("id")
            if not isinstance(objective_id, str) or objective_id in objectives:
                fail(f"Duplicate or invalid objective ID: {objective_id}")
            objectives[objective_id] = objective
    return objectives


def build_policy(manifest: dict[str, Any]) -> dict[str, Any]:
    policy = {
        "voterCount": 5,
        "acceptanceThreshold": 4,
        "classes": ["essential", "helpful", "none"],
        "disagreementAction": "flag-for-user",
    }
    if "relationshipDefinitions" not in manifest:
        return policy
    definitions = manifest["relationshipDefinitions"]
    if not isinstance(definitions, dict):
        fail("relationshipDefinitions must be an object")
    required = ("policyVersion", "essentialDefinition", "helpfulDefinition", "noneDefinition")
    missing = [key for key in required if key not in definitions]
    if missing:
        fail(f"relationshipDefinitions is missing {', '.join(missing)}")
    for key in required:
        value = definitions[key]
        if not isinstance(value, str) or not value.strip():
            fail(f"relationshipDefinitions.{key} must be a non-blank string")
    policy.update({key: definitions[key] for key in required})
    return policy


def build(manifest_path: Path, selection_path: Path | None = None) -> dict[str, Any]:
    manifest, _ = read_json(manifest_path)
    knowledge_path = resolve(manifest_path, manifest["knowledge"])
    selection_path = selection_path or resolve(manifest_path, manifest["relationshipSelections"])
    knowledge, knowledge_text = read_json(knowledge_path)
    selections, _ = read_json(selection_path)
    appearances = {appearance["id"]: appearance for appearance in knowledge["appearances"]}
    skills = {skill["id"]: skill for skill in knowledge["skills"]}
    objectives = load_dataset_objectives(manifest_path, manifest)

    pairs: dict[tuple[str, str], dict[str, Any]] = {}
    used_skills: set[str] = set()
    selected_pairs = selections.get("pairs")
    if not isinstance(selected_pairs, list) or not selected_pairs:
        fail("Relationship selections must contain a non-empty pairs array")
    for selected in selected_pairs:
        for key in ("id", "prerequisiteAppearanceId", "dependentAppearanceId", "reasonForCandidate"):
            if key not in selected:
                fail(f"Selection is missing {key}: {selected}")
        prior_id = selected["prerequisiteAppearanceId"]
        dependent_id = selected["dependentAppearanceId"]
        if prior_id not in appearances or dependent_id not in appearances:
            fail(f"Selection {selected['id']} references an unknown appearance")
        prior = appearances[prior_id]
        dependent = appearances[dependent_id]
        prerequisite_skill = prior["skillId"]
        dependent_skill = dependent["skillId"]
        if prerequisite_skill == dependent_skill:
            fail(f"Self link: {selected['id']}")
        if prerequisite_skill not in skills or dependent_skill not in skills:
            fail(f"Selection {selected['id']} references an unknown skill")
        pair = (prerequisite_skill, dependent_skill)
        row = pairs.setdefault(pair, {
            "id": selected["id"],
            "prerequisiteSkillId": prerequisite_skill,
            "dependentSkillId": dependent_skill,
            "contexts": [],
            "candidateReasons": [],
        })
        row["contexts"].append({"prerequisiteAppearanceId": prior_id, "dependentAppearanceId": dependent_id})
        row["candidateReasons"].append(selected["reasonForCandidate"])
        used_skills.update(pair)

    evidence = []
    for skill_id in sorted(used_skills):
        skill = skills[skill_id]
        skill_evidence = []
        for appearance_id in skill["appearanceIds"]:
            appearance = appearances[appearance_id]
            objective_id = appearance["objectiveId"]
            if objective_id not in objectives:
                fail(f"Appearance {appearance_id} references unknown objective {objective_id}")
            skill_evidence.append({**appearance, "sourceText": objectives[objective_id]["sourceText"]})
        evidence.append({**skill, "appearances": skill_evidence})

    return {
        "formatVersion": 1,
        "subject": knowledge["subject"],
        "scope": "pilot",
        "purpose": selections["purpose"],
        "knowledgeSha256": hashlib.sha256(knowledge_text.encode("utf-8")).hexdigest(),
        "coverageNote": "Representative candidates only. Unlisted pairs and skills remain unassessed.",
        "policy": build_policy(manifest),
        "candidates": list(pairs.values()),
        "evidence": evidence,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", default="data/mathematics/manifest.json")
    parser.add_argument("--selection", help="Override manifest relationshipSelections path")
    parser.add_argument("--output", help="Override manifest relationshipsPacket path")
    args = parser.parse_args()
    manifest_path = Path(args.manifest)
    manifest, _ = read_json(manifest_path)
    selection_path = Path(args.selection) if args.selection else None
    output_path = resolve_output(args.output, manifest_path) if args.output else manifest_path.parent / manifest["relationshipsPacket"]
    packet = build(manifest_path, selection_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    # Match the existing preparation script's platform-native newline behavior
    # so re-preparing the frozen packet preserves its byte hash for voters.
    output_path.write_text(json.dumps(packet, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {output_path}: {len(packet['candidates'])} candidates, {len(packet['evidence'])} skills")


if __name__ == "__main__":
    main()
