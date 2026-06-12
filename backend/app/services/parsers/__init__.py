from typing import Callable

from .npm import parse_package_json, parse_pnpm_lock, parse_yarn_lock
from .python import parse_requirements_txt, parse_pyproject_toml, parse_uv_lock
from .go import parse_go_mod
from .rust import parse_cargo_toml
from .java import parse_pom_xml
from .ruby import parse_gemfile
from .php import parse_composer_json

# Maps filename → (ecosystem, parser_fn)
_REGISTRY: dict[str, tuple[str, Callable[[str], list[str]]]] = {
    "package.json":     ("npm",    parse_package_json),
    "pnpm-lock.yaml":   ("npm",    parse_pnpm_lock),
    "yarn.lock":        ("npm",    parse_yarn_lock),
    "requirements.txt": ("python", parse_requirements_txt),
    "pyproject.toml":   ("python", parse_pyproject_toml),
    "uv.lock":          ("python", parse_uv_lock),
    "go.mod":           ("go",     parse_go_mod),
    "Cargo.toml":       ("rust",   parse_cargo_toml),
    "pom.xml":          ("java",   parse_pom_xml),
    "Gemfile":          ("ruby",   parse_gemfile),
    "composer.json":    ("php",    parse_composer_json),
}

SUPPORTED_FILENAMES = set(_REGISTRY.keys())


def detect_and_parse(filename: str, content: str) -> tuple[str, list[str]]:
    """
    Returns (ecosystem, package_names).
    Raises ValueError for unsupported filenames or malformed content.
    """
    entry = _REGISTRY.get(filename)
    if not entry:
        raise ValueError(
            f"Unsupported file '{filename}'. "
            f"Supported: {', '.join(sorted(SUPPORTED_FILENAMES))}"
        )
    ecosystem, parser = entry
    try:
        packages = parser(content)
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f"Failed to parse '{filename}': {exc}") from exc
    return ecosystem, packages
