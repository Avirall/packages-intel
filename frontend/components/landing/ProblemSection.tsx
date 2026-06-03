import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, TrendingDown } from "lucide-react"

const cases = [
  {
    icon: Users,
    title: "xz-utils (2024)",
    description:
      "A backdoor slipped in because a single exhausted maintainer was manipulated after years of solo work. 5.6.0 shipped to millions before anyone noticed.",
  },
  {
    icon: Clock,
    title: "Log4Shell (2021)",
    description:
      "Log4j was downloaded 10M+ times per week and maintained by 2 volunteers. The patch was written over a weekend by people who weren't paid.",
  },
  {
    icon: TrendingDown,
    title: "The pattern",
    description:
      "CVE scanners catch vulnerabilities after they're found. OSS Sentinel catches the conditions that make future incidents inevitable.",
  },
]

export function ProblemSection() {
  return (
    <section className="px-6 py-20 max-w-5xl mx-auto space-y-10">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">The human layer no one is scanning</h2>
        <p className="text-muted-foreground">
          Security tools scan for CVEs. Nothing scans for the maintainer who hasn&apos;t
          committed in 14 months.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cases.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="bg-card border-border">
            <CardHeader className="pb-2">
              <Icon className="h-5 w-5 text-primary mb-2" />
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
