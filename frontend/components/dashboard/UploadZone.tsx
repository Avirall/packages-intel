"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"
import { UploadCloud, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import type { Scan } from "@/types/scan"

const ACCEPTED = {
  "application/json":    [".json"],
  "text/plain":          [".txt", ".lock"],
  "application/x-yaml": [".yaml", ".yml"],
  "application/toml":   [".toml"],
  "text/x-gemfile":     [],
}

const VALID_NAMES = new Set([
  "package.json", "pnpm-lock.yaml", "yarn.lock",
  "requirements.txt", "pyproject.toml", "uv.lock",
  "go.mod", "Cargo.toml", "pom.xml", "Gemfile", "composer.json",
])

const FORMAT_CHIPS = ["package.json", "requirements.txt", "go.mod", "Cargo.toml", "pyproject.toml"]

export function UploadZone() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    if (!VALID_NAMES.has(file.name)) {
      setError(`"${file.name}" is not a supported dependency file.`)
      return
    }
    setError("")
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const { data } = await api.post<Scan>("/scan/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      router.push(`/scan/${data.id}`)
    } catch {
      setError("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }, [router])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED, maxFiles: 1, disabled: uploading,
  })

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "group relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-5 cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-teal-400 bg-teal-50 scale-[1.005]"
            : "border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/40",
          uploading && "opacity-50 pointer-events-none"
        )}
      >
        <input {...getInputProps()} />

        {/* Icon box */}
        <div className={cn(
          "h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-sm",
          isDragActive
            ? "bg-teal-100 border border-teal-200"
            : "bg-gray-50 border border-gray-200 group-hover:bg-teal-50 group-hover:border-teal-200"
        )}>
          {uploading ? (
            <Loader2 className="h-7 w-7 text-teal-600 animate-spin" />
          ) : (
            <UploadCloud className={cn(
              "h-7 w-7 transition-colors duration-200",
              isDragActive ? "text-teal-600" : "text-gray-400 group-hover:text-teal-500"
            )} />
          )}
        </div>

        {/* Text */}
        <div className="text-center space-y-1">
          <p className="font-semibold text-gray-800 text-sm">
            {isDragActive
              ? "Drop it — we'll take it from here"
              : uploading
              ? "Scanning your dependencies…"
              : "Drop your dependency file here"}
          </p>
          {!isDragActive && !uploading && (
            <p className="text-sm text-gray-500">
              or{" "}
              <span className="text-teal-600 font-medium underline underline-offset-2 decoration-teal-300">
                click to browse
              </span>
            </p>
          )}
        </div>

        {/* Format chips */}
        {!isDragActive && !uploading && (
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {FORMAT_CHIPS.map(f => (
              <span
                key={f}
                className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200"
              >
                {f}
              </span>
            ))}
            <span className="text-[11px] text-gray-400">+6 more</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}
    </div>
  )
}
