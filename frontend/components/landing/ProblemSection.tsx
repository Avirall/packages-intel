import { Users, Clock, Zap } from "lucide-react"

const cases = [
  {
    num: "01",
    icon: Users,
    title: "xz-utils (2024)",
    tag: "Supply chain",
    tagColor: "text-red-600 bg-red-50 border-red-200",
    accentFrom: "from-red-400",
    accentTo: "to-rose-500",
    iconBg: "bg-red-50 text-red-500",
    description:
      "A backdoor slipped in because a single exhausted maintainer was manipulated after years of solo work. 5.6.0 shipped to millions before anyone noticed.",
  },
  {
    num: "02",
    icon: Clock,
    title: "Log4Shell (2021)",
    tag: "Underresourced",
    tagColor: "text-amber-700 bg-amber-50 border-amber-200",
    accentFrom: "from-amber-400",
    accentTo: "to-orange-500",
    iconBg: "bg-amber-50 text-amber-500",
    description:
      "Log4j was downloaded 10M+ times per week, maintained by 2 volunteers. The emergency patch was written over a weekend by people who weren't paid.",
  },
  {
    num: "03",
    icon: Zap,
    title: "The pattern",
    tag: "Preventable",
    tagColor: "text-teal-700 bg-teal-50 border-teal-200",
    accentFrom: "from-teal-400",
    accentTo: "to-cyan-500",
    iconBg: "bg-teal-50 text-teal-600",
    description:
      "CVE scanners catch vulnerabilities after they're found. OSS Sentinel catches the conditions that make future incidents inevitable — before they happen.",
  },
]

export function ProblemSection() {
  return (
    <section className="px-6 py-24 max-w-5xl mx-auto space-y-14">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-xs font-mono font-medium text-teal-600 tracking-widest uppercase">
          Why it matters
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
          The human layer no one is scanning
        </h2>
        <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
          Security tools scan for CVEs. Nothing scans for the maintainer who
          hasn&apos;t committed in 14 months.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cases.map(({ num, icon: Icon, title, tag, tagColor, accentFrom, accentTo, iconBg, description }) => (
          <div
            key={title}
            className="group relative rounded-2xl border border-gray-100 bg-white p-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
          >
            {/* Top gradient accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${accentFrom} ${accentTo} rounded-t-2xl`} />

            {/* Number + icon */}
            <div className="flex items-start justify-between pt-1">
              <span className="font-mono text-xs text-gray-300 select-none">{num}</span>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconBg}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            {/* Title + tag */}
            <div className="space-y-2">
              <h3 className="font-semibold text-base text-gray-900 tracking-tight">{title}</h3>
              <span className={`inline-flex text-[11px] font-medium border rounded-full px-2.5 py-0.5 ${tagColor}`}>
                {tag}
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
