import json


def parse_composer_json(content: str) -> list[str]:
    data = json.loads(content)
    names: set[str] = set()
    for section in ("require", "require-dev"):
        for name in data.get(section, {}):
            if name.lower() == "php" or name.startswith("ext-"):
                continue
            names.add(name)
    return sorted(names)
