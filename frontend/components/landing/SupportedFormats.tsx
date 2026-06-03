const formats = [
  { label: "package.json",     lang: "JavaScript / TypeScript" },
  { label: "pnpm-lock.yaml",   lang: "JavaScript / TypeScript" },
  { label: "yarn.lock",        lang: "JavaScript / TypeScript" },
  { label: "requirements.txt", lang: "Python" },
  { label: "pyproject.toml",   lang: "Python" },
  { label: "uv.lock",          lang: "Python" },
  { label: "go.mod",           lang: "Go" },
  { label: "Cargo.toml",       lang: "Rust" },
  { label: "pom.xml",          lang: "Java" },
  { label: "Gemfile",          lang: "Ruby" },
  { label: "composer.json",    lang: "PHP" },
]

export function SupportedFormats() {
  return (
    <section className="px-6 py-20 max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Works with your stack</h2>
        <p className="text-muted-foreground">Drop in any of these files and get results in seconds.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {formats.map(({ label, lang }) => (
          <div
            key={label}
            className="border border-border rounded-lg px-4 py-2 text-sm space-y-0.5"
          >
            <p className="font-mono font-medium">{label}</p>
            <p className="text-muted-foreground text-xs">{lang}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
