import Link from "next/link"
import { Shield, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-6 py-32 gap-8">
      <div className="flex items-center gap-2 text-muted-foreground text-sm border border-border rounded-full px-4 py-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
        xz-utils. Log4Shell. The next one is already in your dependencies.
      </div>

      <div className="space-y-4 max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight">
          Which of your dependencies is{" "}
          <span className="text-primary">one resignation</span> away from collapse?
        </h1>
        <p className="text-muted-foreground text-lg">
          OSS Sentinel maps your dependency tree onto its human maintainers and
          scores each package by abandonment risk — using a live graph, not stale
          CVE databases.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button asChild size="lg">
          <Link href="/register">
            <Shield className="h-4 w-4 mr-2" />
            Scan your project
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </section>
  )
}
