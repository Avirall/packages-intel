"use client"

import { useEffect, useState } from "react"
import { Loader2, Shield, Package, GitBranch, BarChart3 } from "lucide-react"

const STEPS = [
  { icon: Package,    label: "Parsing dependency manifest" },
  { icon: GitBranch,  label: "Fetching maintainer data from GitHub" },
  { icon: BarChart3,  label: "Calculating risk scores" },
  { icon: Shield,     label: "Writing results to Neo4j Aura" },
]

export function ScanPending({ filename }: { filename?: string }) {
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setStepIdx((i) => (i < STEPS.length - 1 ? i + 1 : i))
    }, 2800)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8 px-6 py-16">
      {/* Spinner */}
      <div className="relative">
        <div className="h-20 w-20 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
          <Shield className="h-9 w-9 text-teal-600" />
        </div>
        <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
          <Loader2 className="h-4 w-4 text-teal-600 animate-spin" />
        </div>
      </div>

      {/* Text */}
      <div className="text-center space-y-1.5">
        <h2 className="text-lg font-semibold text-gray-900">Analyzing dependencies…</h2>
        {filename && (
          <p className="text-sm text-gray-500">
            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{filename}</span>
          </p>
        )}
        <p className="text-sm text-gray-400 mt-1">This usually takes 10–30 seconds</p>
      </div>

      {/* Steps */}
      <div className="w-full max-w-xs space-y-2">
        {STEPS.map(({ icon: Icon, label }, i) => (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-500 ${
              i < stepIdx
                ? "bg-teal-50 border border-teal-100 text-teal-700"
                : i === stepIdx
                ? "bg-white border border-gray-200 shadow-sm text-gray-800"
                : "text-gray-300 border border-transparent"
            }`}
          >
            <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${
              i < stepIdx ? "bg-teal-100" : i === stepIdx ? "bg-gray-100" : "bg-gray-50"
            }`}>
              {i < stepIdx ? (
                <svg className="h-3.5 w-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <Icon className={`h-3.5 w-3.5 ${i === stepIdx ? "text-gray-600" : "text-gray-300"}`} />
              )}
            </div>
            <span className="text-xs font-medium">{label}</span>
            {i === stepIdx && (
              <Loader2 className="h-3 w-3 text-teal-500 animate-spin ml-auto shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
