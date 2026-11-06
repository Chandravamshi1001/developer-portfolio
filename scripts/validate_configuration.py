"""Validate repository agent configuration and optional GitHub PR routing."""

import argparse
import json
from pathlib import Path
import sys
import tomllib

import yaml


ROOT = Path(__file__).resolve().parents[1]
ROLES = {"planner", "developer", "reviewer", "tester"}


def validate_configuration(root: Path = ROOT) -> None:
    files = sorted((root / ".codex" / "agents").glob("*.toml"))
    if {path.stem for path in files} != ROLES:
        raise ValueError("Expected exactly planner, developer, reviewer, and tester TOML files")
    for path in files:
        with path.open("rb") as stream:
            config = tomllib.load(stream)
        for field in ("name", "description", "developer_instructions"):
            if not isinstance(config.get(field), str) or not config[field].strip():
                raise ValueError(f"{path.name}: {field} must be a nonempty string")
        if config["name"] != path.stem:
            raise ValueError(f"{path.name}: name must match filename")
    workflows = sorted((root / ".github" / "workflows").glob("*.y*ml"))
    if not workflows:
        raise ValueError("Expected at least one workflow")
    for path in workflows:
        with path.open(encoding="utf-8") as stream:
            workflow = yaml.safe_load(stream)
        if not isinstance(workflow, dict) or not isinstance(workflow.get("jobs"), dict):
            raise ValueError(f"{path.name}: expected a workflow mapping with jobs")
    print(f"Validated {len(files)} agent TOMLs and {len(workflows)} workflow YAML file(s)")


def validate_pr_route(event: dict) -> None:
    pr = event["pull_request"]
    head, base = pr["head"], pr["base"]
    head_ref, base_ref = head["ref"], base["ref"]
    same_repo = head["repo"] is not None and head["repo"]["full_name"] == base["repo"]["full_name"]
    task_route = base_ref == "develop" and head_ref not in {"main", "develop"}
    release_route = base_ref == "main" and head_ref == "develop" and same_repo
    if not (task_route or release_route):
        raise ValueError("Task PRs must target develop; release PRs must be same-repository develop -> main")
    print(f"Validated PR route: {head_ref} -> {base_ref}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--event-path", type=Path, help="GitHub pull_request event JSON")
    args = parser.parse_args()
    try:
        validate_configuration()
        if args.event_path:
            with args.event_path.open(encoding="utf-8") as stream:
                validate_pr_route(json.load(stream))
    except (OSError, ValueError, KeyError, TypeError, yaml.YAMLError) as error:
        print(f"Configuration validation failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
