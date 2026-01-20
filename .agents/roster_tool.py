import json
import os
import sys
import argparse
from typing import Dict, List, Any

ROSTER_PATH = ".agents/roster.md"

def parse_roster() -> Dict[str, Any]:
    if not os.path.exists(ROSTER_PATH):
        return {}
    
    with open(ROSTER_PATH, "r") as f:
        content = f.read()
    
    if "<!-- ROSTER_JSON:" in content:
        json_str = content.split("<!-- ROSTER_JSON:")[1].split("-->")[0]
        return json.loads(json_str)
    return {}

def save_roster(data: Dict[str, Any]):
    md = "# Persona Roster (Persistent)\n\n"
    
    meta = data.get("meta", {})
    md += "## Meta Persona\n"
    md += f"- **Name:** {meta.get('name', 'Roster Steward')}\n"
    md += f"- **Mandate:** {meta.get('mandate', '')}\n"
    md += f"- **Rotation Rules:** {meta.get('rotation_rules', '')}\n"
    md += f"- **Checks:** {meta.get('checks', '')}\n\n"
    
    md += "## Active Personas (4–7 total including Meta)\n\n"
    for i, p in enumerate(data.get("personas", []), 1):
        md += f"### {i}) {p.get('name')}\n"
        md += f"- **Role:** {p.get('role', '')}\n"
        md += f"- **Mandate:** {p.get('mandate', '')}\n"
        md += f"- **Trust Model:** {p.get('trust_model', '')}\n"
        md += f"- **Key Questions:**\n"
        for q in p.get("key_questions", []):
            md += f"  - {q}\n"
        md += f"- **Always-Flags:**\n"
        for f in p.get("always_flags", []):
            md += f"  - {f}\n"
        md += f"- **Blind Spots:** {p.get('blind_spots', '')}\n"
        ledger = p.get("ledger", {})
        md += f"- **Ledger:**\n"
        md += f"  - **Current stance:** {ledger.get('current_stance', '')}\n"
        md += f"  - **Warnings:** {ledger.get('warnings', '')}\n"
        md += f"  - **Open questions:** {ledger.get('open_questions', '')}\n"
        md += f"  - **Last updated:** {ledger.get('last_updated', '')}\n\n"
    
    md += "## Rotation History\n"
    for entry in data.get("rotation_history", []):
        md += f"- {entry}\n"
    md += "\n"
    
    md += "## Open Tensions / Tradeoffs\n"
    for tension in data.get("tensions", []):
        md += f"- Tension: {tension.get('description')}\n"
        md += f"  - Options: {tension.get('options')}\n"
        md += f"  - Current resolution: {tension.get('resolution')}\n"
        md += f"  - Residual risk: {tension.get('residual_risk')}\n"
    
    md += f"\n<!-- ROSTER_JSON:\n{json.dumps(data, indent=2)}\n-->"
    
    with open(ROSTER_PATH, "w") as f:
        f.write(md)

def main():
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command")
    
    subparsers.add_parser("get")
    subparsers.add_parser("validate")
    
    update_persona = subparsers.add_parser("update-persona")
    update_persona.add_argument("--name", required=True)
    update_persona.add_argument("--patch", required=True)
    
    add_persona = subparsers.add_parser("add-persona")
    add_persona.add_argument("--spec", required=True)
    
    update_ledger = subparsers.add_parser("update-ledger")
    update_ledger.add_argument("--name", required=True)
    update_ledger.add_argument("--patch", required=True)
    
    args = parser.parse_args()
    
    data = parse_roster()
    if not data:
        data = {
            "meta": {
                "name": "Roster Steward",
                "mandate": "Govern roster stability, decide when to rotate personas, and enforce protocol quality gates.",
                "rotation_rules": "Max 1 swap per user turn; default is stability; rotate on domain shift or repeated failure modes.",
                "checks": "Calibration (atomic/compound/systemic), utilization (no theater), decision trace required, red-team required when warranted."
            },
            "personas": [],
            "rotation_history": [],
            "tensions": []
        }

    if args.command == "get":
        print(json.dumps(data, indent=2))
    elif args.command == "update-persona":
        patch = json.loads(args.patch)
        for p in data["personas"]:
            if p["name"] == args.name:
                p.update(patch)
                break
        save_roster(data)
    elif args.command == "add-persona":
        spec = json.loads(args.spec)
        data["personas"].append(spec)
        save_roster(data)
    elif args.command == "update-ledger":
        patch = json.loads(args.patch)
        for p in data["personas"]:
            if p["name"] == args.name:
                p.setdefault("ledger", {}).update(patch)
                break
        save_roster(data)
    elif args.command == "validate":
        if len(data.get("personas", [])) < 3:
            print("Validation failed: At least 3 personas required for non-atomic tasks.")
            sys.exit(1)
        print("Validation passed.")

if __name__ == "__main__":
    main()
