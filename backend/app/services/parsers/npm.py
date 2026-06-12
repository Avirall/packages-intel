import json
import re


def parse_package_json(content: str) -> list[str]:
    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON: {exc}") from exc

    if not isinstance(data, dict):
        raise ValueError("package.json must be a JSON object")

    names: set[str] = set()
    for section in ("dependencies", "devDependencies", "peerDependencies"):
        section_data = data.get(section)
        if isinstance(section_data, dict):
            names.update(k for k in section_data if k and not k.startswith("//"))
    return sorted(names)


def parse_pnpm_lock(content: str) -> list[str]:
    # pnpm-lock.yaml v6+: package entries look like:
    #   /express@4.18.0:  or  express@4.18.0:
    names: set[str] = set()
    for line in content.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        m = re.match(r"^/?(@?[a-zA-Z0-9][\w.\-/@]*)@[\d^~]", stripped)
        if m:
            names.add(m.group(1).lstrip("/"))
    return sorted(names)


def parse_yarn_lock(content: str) -> list[str]:
    # yarn.lock: entries start with  "name@version":  or  name@version:
    names: set[str] = set()
    for line in content.splitlines():
        if not line or line.startswith(" ") or line.startswith("#"):
            continue
        raw = line.rstrip(":")
        for entry in raw.split(","):
            entry = entry.strip().strip('"')
            m = re.match(r"^(@?[a-zA-Z0-9][\w.\-/@]*)@", entry)
            if m:
                names.add(m.group(1))
    return sorted(names)
