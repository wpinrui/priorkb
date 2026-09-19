"""Assemble source-derived skills without modifying syllabus evidence.

Usage: python scripts/build_knowledge.py data/mathematics/manifest.json
Only the Python standard library is required. Paths are relative to the manifest.
"""

import argparse
import collections
import hashlib
import json
import pathlib
import re


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def normalized(text):
    # Preserve mathematical case and superscripts. They can change meaning.
    return re.sub(r"\s+", " ", text).strip()


def build(manifest_path):
    manifest = read(manifest_path)
    folder = manifest_path.parent
    datasets = [read(folder / filename) for filename in manifest["datasets"]]
    objectives = [record for data in datasets for record in data["objectives"]]
    by_id = {o["id"]: o for o in objectives}
    if len(by_id) != len(objectives):
        raise ValueError("Objective IDs must be unique across datasets")
    split_ids = {oid for data in datasets for a in data["ambiguities"] if a["kind"] == "split" for oid in a["objectiveIds"]}
    decisions = {}
    for filename in manifest.get("editorialDecisions", []):
        for decision in read(folder / filename)["decisions"]:
            oid = decision["objectiveId"]
            if oid not in by_id or oid in decisions:
                raise ValueError(f"Unknown or repeated editorial objective: {oid}")
            if decision["decision"] not in {"keep", "split", "defer"}:
                raise ValueError(f"Invalid decision: {oid}")
            parts = decision["parts"]
            if (decision["decision"] == "split" and len(parts) < 2) or (decision["decision"] != "split" and len(parts) != 1):
                raise ValueError(f"Invalid decomposition: {oid}")
            for part in parts:
                if not part["label"].strip() or not part["description"].strip() or not isinstance(part["scopeNotes"], list):
                    raise ValueError(f"Incomplete part: {oid}")
                if part.get("role", by_id[oid]["role"]) not in {"syllabus-content", "assumed-knowledge"}:
                    raise ValueError(f"Invalid part role: {oid}")
            decisions[oid] = decision
    if split_ids - decisions.keys():
        raise ValueError(f"Missing editorial decisions for {len(split_ids-decisions.keys())} objectives")

    appearances = []
    descriptions = {}
    for objective in objectives:
        oid = objective["id"]
        decision = decisions.get(oid)
        parts = decision["parts"] if decision else [{"label": objective["label"], "description": objective["sourceText"], "scopeNotes": []}]
        for index, part in enumerate(parts, 1):
            appearance_id = f"{oid}:part-{index:02}"
            source_uncertain = any("source-conflict" in flag for flag in objective["reviewFlags"])
            status = "deferred" if decision and decision["decision"] == "defer" else "source-uncertain" if source_uncertain else "ready"
            appearance = {
                "id": appearance_id,
                "objectiveId": oid,
                "pathway": objective["pathway"],
                "year": objective["year"],
                "role": part.get("role", objective["role"]),
                "strand": objective["strand"],
                "topic": objective["topic"],
                "constraints": objective["constraints"],
                "scopeNotes": part["scopeNotes"],
                "source": objective["source"],
                "status": status,
            }
            # Exact semantic wording, topic and limits must agree to merge by
            # default. Explicit reviewed equivalences can bridge topic names.
            fingerprint = json.dumps({"subject": manifest["subject"], "description": normalized(part["description"]), "topic": normalized(objective["topic"]), "constraints": sorted(normalized(c) for c in objective["constraints"]), "scopeNotes": sorted(normalized(c) for c in part["scopeNotes"])}, sort_keys=True, ensure_ascii=False)
            appearance["skillId"] = f'{manifest["subject"]}-skill-{hashlib.sha256(fingerprint.encode()).hexdigest()[:16]}'
            appearances.append(appearance)
            descriptions[appearance_id] = part

    by_appearance = {a["id"]: a for a in appearances}
    equivalences = read(folder / manifest["skillEquivalences"])["groups"] if manifest.get("skillEquivalences") else []
    # Union reviewed groups with the exact-wording groups, including every
    # appearance of a skill. This avoids orphaning unlisted exact duplicates.
    parents = {a["skillId"]: a["skillId"] for a in appearances}

    def find(key):
        while parents[key] != key:
            parents[key] = parents[parents[key]]
            key = parents[key]
        return key

    merged_labels = []
    group_ids = set()
    for group in equivalences:
        if group["id"] in group_ids or group["decision"] != "merge":
            raise ValueError(f"Invalid or repeated equivalence: {group['id']}")
        group_ids.add(group["id"])
        if len(set(group["appearanceIds"])) < 2 or len(set(group["appearanceIds"])) != len(group["appearanceIds"]) or not all(group[key].strip() for key in ("reason", "label", "description")):
            raise ValueError("Reviewed equivalences require members and a reason")
        members = [by_appearance[aid] for aid in group["appearanceIds"]]
        roots = sorted({find(a["skillId"]) for a in members})
        for child in roots[1:]:
            parents[child] = roots[0]
        merged_labels.append((members[0]["id"], group["label"], group["description"]))

    skills = {}
    for appearance in appearances:
        appearance["skillId"] = find(appearance["skillId"])
        sid = appearance["skillId"]
        part = descriptions[appearance["id"]]
        skill = skills.setdefault(sid, {"id": sid, "subject": manifest["subject"], "label": part["label"], "description": part["description"], "appearanceIds": [], "topics": []})
        skill["appearanceIds"].append(appearance["id"])
        if appearance["topic"] not in skill["topics"]:
            skill["topics"].append(appearance["topic"])
    for aid, label, description in merged_labels:
        sid = by_appearance[aid]["skillId"]
        skills[sid]["label"] = label
        skills[sid]["description"] = description

    result = {
        "formatVersion": 1,
        "subject": manifest["subject"],
        "title": manifest["title"],
        "sources": [source for data in datasets for source in data["sources"]],
        "skills": sorted(skills.values(), key=lambda skill: skill["id"]),
        "appearances": appearances,
        "editorialSummary": {
            "sourceObjectives": len(objectives),
            "skills": len(skills),
            "appearances": len(appearances),
            "decisions": dict(collections.Counter(d["decision"] for d in decisions.values())),
            "reviewedEquivalenceGroups": len(equivalences),
            "appearanceStatuses": dict(collections.Counter(a["status"] for a in appearances)),
        },
    }
    destination = folder / manifest.get("knowledge", "knowledge.json")
    destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result["editorialSummary"], indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=pathlib.Path)
    build(parser.parse_args().manifest)
