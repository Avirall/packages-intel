import re


def parse_gemfile(content: str) -> list[str]:
    names: set[str] = set()
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("#"):
            continue
        # gem 'name'  or  gem "name"  or  gem "name", "~> 1.0"
        m = re.match(r"""^gem\s+['"]([^'"]+)['"]""", stripped)
        if m:
            names.add(m.group(1))
    return sorted(names)
