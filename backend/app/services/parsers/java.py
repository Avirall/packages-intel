import xml.etree.ElementTree as ET

_MAVEN_NS = "http://maven.apache.org/POM/4.0.0"


def parse_pom_xml(content: str) -> list[str]:
    try:
        root = ET.fromstring(content)
    except ET.ParseError as exc:
        raise ValueError(f"Invalid XML: {exc}") from exc

    names: set[str] = set()

    # Try namespaced first (most POMs), then fall back to no-namespace
    for ns in (f"{{{_MAVEN_NS}}}", ""):
        for dep in root.iter(f"{ns}dependency"):
            group    = (dep.findtext(f"{ns}groupId")    or "").strip()
            artifact = (dep.findtext(f"{ns}artifactId") or "").strip()
            if group and artifact:
                names.add(f"{group}:{artifact}")
        if names:
            break

    return sorted(names)
