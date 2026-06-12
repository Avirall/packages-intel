import Link from "next/link"
import { Shield, AlertTriangle, ChevronDown, GitBranch, Activity, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

/* ── Knowledge-graph data ─────────────────────────────────────────────────
   Positions are in the SVG viewBox (0 0 540 400).
   The panel is rendered dark so the graph pops on the light page.
─────────────────────────────────────────────────────────────────────────── */
type Risk = "app" | "low" | "med" | "high"

const PKGS: { id: string; x: number; y: number; r: number; risk: Risk }[] = [
  { id: "your-project", x: 270, y: 54,  r: 27, risk: "app"  },
  { id: "react",        x: 138, y: 142, r: 22, risk: "low"  },
  { id: "axios",        x: 380, y: 126, r: 20, risk: "low"  },
  { id: "express",      x: 68,  y: 228, r: 20, risk: "low"  },
  { id: "lodash",       x: 402, y: 238, r: 22, risk: "med"  },
  { id: "webpack",      x: 154, y: 293, r: 18, risk: "low"  },
  { id: "babel",        x: 263, y: 293, r: 18, risk: "low"  },
  { id: "debug",        x: 74,  y: 313, r: 14, risk: "med"  },
  { id: "ms",           x: 38,  y: 368, r: 12, risk: "high" },
  { id: "chalk",        x: 192, y: 360, r: 13, risk: "low"  },
  { id: "semver",       x: 324, y: 278, r: 15, risk: "low"  },
  { id: "minimatch",    x: 374, y: 340, r: 12, risk: "high" },
  { id: "node-fetch",   x: 452, y: 285, r: 14, risk: "low"  },
  { id: "mime",         x: 478, y: 192, r: 12, risk: "low"  },
]

const MAINTS: { id: string; x: number; y: number; r: number; label: string }[] = [
  { id: "sindresorhus", x: 454, y: 358, r: 15, label: "@sindre"  },
  { id: "nicolo",       x: 296, y: 360, r: 13, label: "@nicolo"  },
  { id: "jdalton",      x: 460, y: 148, r: 13, label: "@jdalton" },
]

const PKG_EDGES: [string, string][] = [
  ["your-project", "react"],   ["your-project", "axios"],
  ["your-project", "express"], ["your-project", "lodash"],
  ["react",  "semver"],        ["react",   "debug"],
  ["express","debug"],         ["express", "ms"],
  ["webpack","babel"],         ["webpack", "minimatch"],
  ["webpack","semver"],        ["axios",   "node-fetch"],
  ["axios",  "mime"],          ["babel",   "chalk"],
  ["lodash", "semver"],        ["debug",   "ms"],
]

const MAINT_EDGES: [string, string][] = [
  ["sindresorhus", "chalk"],
  ["sindresorhus", "semver"],
  ["nicolo",  "babel"],
  ["jdalton", "lodash"],
]

const nodeMap = Object.fromEntries([
  ...PKGS.map(n => [n.id, n]),
  ...MAINTS.map(n => [n.id, { ...n, risk: "maint" as const }]),
])

/* Risk visual tokens (inside the dark SVG canvas) */
const RISK = {
  app:   { stroke: "#2dd4bf", fill: "rgba(20,184,166,0.30)", text: "#ccfbf1" },
  low:   { stroke: "#14b8a6", fill: "rgba(20,184,166,0.18)", text: "#99f6e4" },
  med:   { stroke: "#fbbf24", fill: "rgba(251,191,36,0.18)",  text: "#fef3c7" },
  high:  { stroke: "#f87171", fill: "rgba(248,113,113,0.22)", text: "#fee2e2" },
  maint: { stroke: "#818cf8", fill: "rgba(129,140,248,0.18)", text: "#e0e7ff" },
}

/* ─────────────────────────────────────────────────────────────────────────── */
export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-14">

      {/* ── Page background ──────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/70 via-white to-sky-50/60 pointer-events-none" />
      <div className="dot-grid absolute inset-0 pointer-events-none opacity-70" />

      {/* Large decorative blobs */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-teal-200/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-sky-200/20 blur-3xl pointer-events-none" />

      {/* Top / bottom edge fades */}
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

      {/* ── Split layout ─────────────────────────────────────────────────── */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-10 lg:gap-16 py-16">

        {/* ── Left: copy ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center lg:items-start gap-8 text-center lg:text-left">

          {/* Split-pill announcement badge */}
          <div className="inline-flex items-center rounded-full bg-white border border-gray-200 shadow-sm overflow-hidden text-xs select-none">
            <span className="flex items-center gap-1.5 bg-amber-500 text-white font-bold px-3 py-1.5 shrink-0">
              <AlertTriangle className="h-3 w-3" />
              RISK
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 text-gray-600">
              <span className="font-semibold text-gray-900">xz-utils</span>
              <span className="text-gray-300">·</span>
              <span className="font-semibold text-gray-900">Log4Shell</span>
              <span className="text-gray-300">·</span>
              <span>The next one is in your stack.</span>
            </span>
            <span className="pr-3 text-amber-400">
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-5">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-gray-900">
              Which dependency is{" "}
              <span className="text-primary text-glow">one resignation</span>
              <br className="hidden sm:block" />
              {" "}away from collapse?
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-lg leading-relaxed">
              OSS Sentinel maps your dependency tree onto its human maintainers
              and scores each package by abandonment risk — using a live
              knowledge graph, not stale CVE databases.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-start">
            <Button asChild size="lg" className="px-7 shadow-lg shadow-teal-500/25">
              <Link href="/register">
                <Shield className="h-4 w-4" />
                Scan your project
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-7">
              <Link href="/login">
                Sign in
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-5 sm:gap-8 text-sm pt-1 flex-wrap justify-center lg:justify-start">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GitBranch className="h-3.5 w-3.5 text-primary/70" />
              <span><strong className="text-foreground">7</strong> ecosystems</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-primary/70" />
              <span><strong className="text-foreground">Live</strong> GitHub data</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary/70" />
              <span>Powered by <strong className="text-foreground">Neo4j Aura</strong></span>
            </div>
          </div>
        </div>

        {/* ── Right: knowledge graph panel ─────────────────────────────── */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none panel-float">
          <div className="rounded-2xl border border-gray-200 shadow-2xl shadow-teal-900/10 overflow-hidden bg-white">

            {/* Window chrome */}
            <div className="h-9 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-3 select-none">
              {/* Dots */}
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              {/* Fake tabs */}
              <div className="flex items-stretch h-full ml-3 gap-0 text-[11px]">
                <div className="px-3 flex items-center font-medium text-teal-700 border-b-2 border-teal-500">
                  Graph View
                </div>
                <div className="px-3 flex items-center text-gray-400">Risk Matrix</div>
                <div className="px-3 flex items-center text-gray-400">Maintainers</div>
              </div>
              {/* Status */}
              <div className="ml-auto flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 inline-block" />
                <span>14 nodes · 2 critical</span>
              </div>
            </div>

            {/* Graph canvas — dark, like Neo4j Browser */}
            <div className="relative bg-[#0d1117]">
              <svg
                viewBox="0 0 540 400"
                className="w-full"
                aria-label="Dependency knowledge graph"
              >
                <defs>
                  {/* Soft glow filters */}
                  <filter id="glow-teal" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="3" result="b" />
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="glow-red" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="5" result="b" />
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="glow-amber" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="3" result="b" />
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>

                  {/* Node gradients */}
                  <radialGradient id="g-app" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#5eead4" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </radialGradient>
                  <radialGradient id="g-low" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#1f3d3a" />
                    <stop offset="100%" stopColor="#134e4a" />
                  </radialGradient>
                  <radialGradient id="g-med" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#3d2e0d" />
                    <stop offset="100%" stopColor="#451a03" />
                  </radialGradient>
                  <radialGradient id="g-high" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#3d1212" />
                    <stop offset="100%" stopColor="#450a0a" />
                  </radialGradient>
                  <radialGradient id="g-maint" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#1e1b4b" />
                    <stop offset="100%" stopColor="#1e1b4b" />
                  </radialGradient>
                </defs>

                {/* ── Package-to-package edges ──────────────────────────── */}
                {PKG_EDGES.map(([a, b]) => {
                  const na = nodeMap[a]
                  const nb = nodeMap[b]
                  if (!na || !nb) return null
                  const isRisk = nb.risk === "high" || na.risk === "high"
                  return (
                    <line
                      key={`${a}-${b}`}
                      x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                      stroke={isRisk ? "#f87171" : "#14b8a6"}
                      strokeOpacity={isRisk ? 0.3 : 0.2}
                      strokeWidth={isRisk ? 1.2 : 1}
                      strokeDasharray={isRisk ? "4 4" : "5 5"}
                      className="graph-edge"
                    />
                  )
                })}

                {/* ── Maintainer edges (dashed indigo) ─────────────────── */}
                {MAINT_EDGES.map(([m, p]) => {
                  const nm = nodeMap[m]
                  const np = nodeMap[p]
                  if (!nm || !np) return null
                  return (
                    <line
                      key={`m-${m}-${p}`}
                      x1={nm.x} y1={nm.y} x2={np.x} y2={np.y}
                      stroke="#818cf8"
                      strokeOpacity={0.3}
                      strokeWidth={1}
                      strokeDasharray="3 4"
                    />
                  )
                })}

                {/* ── Package nodes ────────────────────────────────────── */}
                {PKGS.map(({ id, x, y, r, risk }, i) => {
                  const c = RISK[risk]
                  const delay = `${(i * 0.41) % 3.5}s`
                  const glowFilter =
                    risk === "high"  ? "url(#glow-red)"   :
                    risk === "med"   ? "url(#glow-amber)" :
                    risk === "app"   ? "url(#glow-teal)"  : undefined
                  const gradId = `g-${risk}`
                  const isLarge = r >= 18
                  const showBadge = risk === "high"

                  return (
                    <g key={id} filter={glowFilter}>
                      {/* Outer pulse ring for high-risk */}
                      {showBadge && (
                        <circle
                          cx={x} cy={y} r={r + 6}
                          fill="none"
                          stroke="#f87171"
                          strokeWidth="1"
                          strokeOpacity="0.25"
                          className="graph-node"
                          style={{ animationDelay: delay }}
                        />
                      )}

                      {/* Main circle */}
                      <circle
                        cx={x} cy={y} r={r}
                        fill={`url(#${gradId})`}
                        stroke={c.stroke}
                        strokeWidth={risk === "high" ? 1.8 : risk === "app" ? 2.2 : 1.5}
                        className="graph-node"
                        style={{ animationDelay: delay }}
                      />

                      {/* Label — inside for large nodes, below for small */}
                      {isLarge ? (
                        <text
                          x={x} y={y + (risk === "app" ? 1 : 1)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={risk === "app" ? 8 : 7}
                          fontFamily="monospace"
                          fill={c.text}
                          fontWeight={risk === "app" ? "700" : "400"}
                          style={{ opacity: 0.9 }}
                        >
                          {id === "your-project" ? "your-project" : id}
                        </text>
                      ) : (
                        <text
                          x={x} y={y + r + 9}
                          textAnchor="middle"
                          fontSize="7.5"
                          fontFamily="monospace"
                          fill={c.text}
                          style={{ opacity: 0.65 }}
                        >
                          {id}
                        </text>
                      )}

                      {/* ⚠ badge for high risk */}
                      {showBadge && (
                        <text
                          x={x + r - 1} y={y - r + 4}
                          textAnchor="middle"
                          fontSize="8"
                          fill="#fca5a5"
                          style={{ opacity: 0.9 }}
                        >
                          ⚠
                        </text>
                      )}
                    </g>
                  )
                })}

                {/* ── Maintainer nodes ─────────────────────────────────── */}
                {MAINTS.map(({ id, x, y, r, label }, i) => {
                  const delay = `${(i * 0.7 + 1.2) % 3.5}s`
                  return (
                    <g key={id}>
                      {/* Diamond / rotated square */}
                      <rect
                        x={x - r * 0.82} y={y - r * 0.82}
                        width={r * 1.64} height={r * 1.64}
                        rx="3"
                        transform={`rotate(45 ${x} ${y})`}
                        fill="url(#g-maint)"
                        stroke="#818cf8"
                        strokeWidth="1.2"
                        strokeOpacity="0.7"
                        className="graph-node"
                        style={{ animationDelay: delay }}
                      />
                      <text
                        x={x} y={y + r + 9}
                        textAnchor="middle"
                        fontSize="7"
                        fontFamily="monospace"
                        fill="#a5b4fc"
                        style={{ opacity: 0.7 }}
                      >
                        {label}
                      </text>
                    </g>
                  )
                })}

                {/* ── Floating tooltip: "ms" high-risk node ────────────── */}
                <g>
                  {/* Connector line to ms node */}
                  <line
                    x1={38} y1={368} x2={82} y2={330}
                    stroke="#f87171" strokeWidth="1" strokeOpacity="0.4"
                    strokeDasharray="3 2"
                  />
                  {/* Card background */}
                  <rect x={80} y={316} width={148} height={68} rx="6"
                    fill="#1a0a0a" stroke="#f87171" strokeWidth="1" strokeOpacity="0.5"
                  />
                  {/* Top accent bar */}
                  <rect x={80} y={316} width={148} height={2.5} rx="1"
                    fill="#f87171" fillOpacity="0.8"
                  />
                  {/* Title row */}
                  <text x={91} y={331} fontSize="9" fontFamily="monospace" fontWeight="700" fill="#f87171">
                    ms  ·  HIGH RISK
                  </text>
                  {/* Stats */}
                  <text x={91} y={346} fontSize="7.5" fontFamily="monospace" fill="#fca5a5" fillOpacity="0.75">
                    Bus factor: 1 maintainer
                  </text>
                  <text x={91} y={358} fontSize="7.5" fontFamily="monospace" fill="#fca5a5" fillOpacity="0.75">
                    Last commit: 847 days ago
                  </text>
                  <text x={91} y={370} fontSize="7.5" fontFamily="monospace" fill="#fca5a5" fillOpacity="0.75">
                    Weekly downloads: 2.1M
                  </text>
                </g>

                {/* ── Legend ───────────────────────────────────────────── */}
                <g>
                  {[
                    { cx: 14,  label: "low risk",    stroke: "#14b8a6" },
                    { cx: 72,  label: "medium",       stroke: "#fbbf24" },
                    { cx: 120, label: "high risk",    stroke: "#f87171" },
                    { cx: 176, label: "maintainer",   stroke: "#818cf8" },
                  ].map(({ cx, label, stroke }) => (
                    <g key={label}>
                      <circle cx={cx + 5} cy={393} r="4" fill="none" stroke={stroke} strokeWidth="1.5" />
                      <text
                        x={cx + 12} y={396.5}
                        fontSize="7.5" fontFamily="monospace"
                        fill={stroke} fillOpacity="0.75"
                      >
                        {label}
                      </text>
                    </g>
                  ))}
                </g>

              </svg>

              {/* Scan label overlay */}
              <div className="absolute top-2 right-3 flex items-center gap-1.5 text-[10px] font-mono text-teal-400/70">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                live graph
              </div>
            </div>

            {/* Panel footer */}
            <div className="h-8 bg-gray-50 border-t border-gray-100 flex items-center px-4 gap-4 text-[11px] text-gray-500 select-none">
              <span>React 18.3.1</span>
              <span className="text-gray-300">·</span>
              <span className="text-red-500 font-medium">2 critical</span>
              <span className="text-gray-300">·</span>
              <span className="text-amber-500 font-medium">3 medium</span>
              <span className="text-gray-300">·</span>
              <span className="text-teal-600 font-medium">9 healthy</span>
              <span className="ml-auto text-gray-400">OSS Sentinel v1.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <ChevronDown className="scroll-bounce h-4 w-4 text-muted-foreground/50" />
      </div>
    </section>
  )
}
