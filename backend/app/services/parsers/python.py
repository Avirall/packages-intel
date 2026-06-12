import re
import sys

if sys.version_info >= (3, 11):
    import tomllib
else:
    import tomli as tomllib  # type: ignore[no-redef]


def parse_requirements_txt(content: str) -> list[str]:
    names: list[str] = []
    for raw in content.splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or line.startswith("-"):
            continue
        # strip extras [security], version specifiers, env markers
        name = re.split(r"[>=<!;\[\s]", line)[0].strip()
        if name:
            names.append(name)
    return sorted(set(names))


def parse_pyproject_toml(content: str) -> list[str]:
    try:
        data = tomllib.loads(content)
    except Exception as exc:
        raise ValueError(f"Invalid TOML: {exc}") from exc

    raw: list[str] = []

    # PEP 621 [project.dependencies]
    project_deps = data.get("project", {}).get("dependencies")
    if isinstance(project_deps, list):
        raw.extend(project_deps)

    # poetry [tool.poetry.dependencies]
    poetry_deps = data.get("tool", {}).get("poetry", {}).get("dependencies", {})
    if isinstance(poetry_deps, dict):
        raw.extend(k for k in poetry_deps if k.lower() != "python")

    names: set[str] = set()
    for dep in raw:
        if isinstance(dep, str):
            name = re.split(r"[>=<!;\[\s@]", dep)[0].strip()
            if name:
                names.add(name)
    return sorted(names)


def parse_uv_lock(content: str) -> list[str]:
    try:
        data = tomllib.loads(content)
    except Exception as exc:
        raise ValueError(f"Invalid TOML: {exc}") from exc

    packages = data.get("package")
    if not isinstance(packages, list):
        return []
    return sorted({p["name"] for p in packages if isinstance(p, dict) and "name" in p})
