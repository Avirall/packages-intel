import Link from "next/link"
import { Shield, ExternalLink, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Hero } from "@/components/landing/Hero"
import { ProblemSection } from "@/components/landing/ProblemSection"
import { SupportedFormats } from "@/components/landing/SupportedFormats"

export default function LandingPage() {
  return (
    <div className="min-h-screen">

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-6 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-b from-teal-500 to-teal-600 flex items-center justify-center shadow-sm group-hover:shadow-teal-500/30 transition-shadow">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-gray-900 tracking-tight">OSS Sentinel</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </nav>

      {/* ── Sections ─────────────────────────────────────────────────────── */}
      <main>
        <Hero />
        <ProblemSection />
        <SupportedFormats />
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

            {/* Brand col */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-b from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-gray-900 tracking-tight">OSS Sentinel</span>
              </div>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                Map your dependency tree onto its human maintainers. Catch the next
                Log4Shell before it happens — powered by Neo4j Aura.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 border border-gray-200 rounded-full px-3 py-1 bg-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
                  Neo4j Aura Agent Hackathon 2026
                </span>
              </div>
            </div>

            {/* Links col */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Product</p>
              <ul className="space-y-2.5">
                {[
                  { href: "/register", label: "Get started" },
                  { href: "/login",    label: "Sign in" },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-gray-500 hover:text-teal-600 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
            <span>© 2026 OSS Sentinel. Built for the Neo4j Aura Agent Hackathon.</span>
            <div className="flex items-center gap-4">
              <Link href="/register" className="hover:text-gray-700 transition-colors">Get started</Link>
              <Link href="/login" className="hover:text-gray-700 transition-colors">Sign in</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
