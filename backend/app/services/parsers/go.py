import re


def parse_go_mod(content: str) -> list[str]:
    names: set[str] = set()
    in_require = False

    for line in content.splitlines():
        stripped = line.strip()

        if stripped.startswith("require ("):
            in_require = True
            continue
        if in_require and stripped == ")":
            in_require = False
            continue

        if in_require:
            # "github.com/some/pkg v1.2.3"
            m = re.match(r"^([\w.\-/]+)\s+v[\w.\-+]+", stripped)
            if m:
                names.add(m.group(1))
        elif stripped.startswith("require "):
            # single-line: require github.com/some/pkg v1.2.3
            m = re.match(r"^require\s+([\w.\-/]+)\s+v[\w.\-+]+", stripped)
            if m:
                names.add(m.group(1))

    return sorted(names)
