import sys

if sys.version_info >= (3, 11):
    import tomllib
else:
    import tomli as tomllib  # type: ignore[no-redef]


def parse_cargo_toml(content: str) -> list[str]:
    data = tomllib.loads(content)
    names: set[str] = set()

    for section in ("dependencies", "dev-dependencies", "build-dependencies"):
        for name, spec in data.get(section, {}).items():
            # skip path-only local crates
            if isinstance(spec, dict) and "path" in spec and "version" not in spec:
                continue
            names.add(name)

    return sorted(names)
