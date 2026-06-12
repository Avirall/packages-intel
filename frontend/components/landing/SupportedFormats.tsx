const ECOSYSTEMS = [
  {
    lang: "JavaScript / TypeScript",
    dot: "bg-yellow-400",
    pill: "bg-yellow-50 text-yellow-800 border-yellow-200",
    accent: "border-l-yellow-400",
    files: ["package.json", "pnpm-lock.yaml", "yarn.lock"],
  },
  {
    lang: "Python",
    dot: "bg-blue-400",
    pill: "bg-blue-50 text-blue-800 border-blue-200",
    accent: "border-l-blue-400",
    files: ["requirements.txt", "pyproject.toml", "uv.lock"],
  },
  {
    lang: "Go",
    dot: "bg-cyan-400",
    pill: "bg-cyan-50 text-cyan-800 border-cyan-200",
    accent: "border-l-cyan-400",
    files: ["go.mod"],
  },
  {
    lang: "Rust",
    dot: "bg-orange-400",
    pill: "bg-orange-50 text-orange-800 border-orange-200",
    accent: "border-l-orange-400",
    files: ["Cargo.toml"],
  },
  {
    lang: "Java",
    dot: "bg-red-400",
    pill: "bg-red-50 text-red-800 border-red-200",
    accent: "border-l-red-400",
    files: ["pom.xml"],
  },
  {
    lang: "Ruby",
    dot: "bg-pink-400",
    pill: "bg-pink-50 text-pink-800 border-pink-200",
    accent: "border-l-pink-400",
    files: ["Gemfile"],
  },
  {
    lang: "PHP",
    dot: "bg-purple-400",
    pill: "bg-purple-50 text-purple-800 border-purple-200",
    accent: "border-l-purple-400",
    files: ["composer.json"],
  },
]

export function SupportedFormats() {
  return (
    <section className="px-6 py-24 max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-xs font-mono font-medium text-teal-600 tracking-widest uppercase">
          Supported formats
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
          Works with your stack
        </h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Drop in any of these files and get risk results in seconds.
        </p>
      </div>

      {/* Ecosystem grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ECOSYSTEMS.map(({ lang, dot, pill, accent, files }) => (
          <div
            key={lang}
            className={`group rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 ${accent}`}
          >
            {/* Language header */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${dot}`} />
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${pill}`}>
                {lang}
              </span>
            </div>

            {/* Files */}
            <div className="space-y-2">
              {files.map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <div className="h-px w-3 bg-gray-200 shrink-0" />
                  <span className="font-mono text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    {f}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom note */}
      <p className="text-center text-sm text-gray-400">
        More ecosystems coming soon. Built for the{" "}
        <span className="text-teal-600 font-medium">Neo4j Aura Agent Hackathon 2026</span>.
      </p>
    </section>
  )
}
