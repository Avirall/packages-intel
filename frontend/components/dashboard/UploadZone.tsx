"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"
import { UploadCloud, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import type { Scan } from "@/types/scan"

const ACCEPTED = {
  "application/json":      [".json"],
  "text/plain":            [".txt", ".lock"],
  "application/x-yaml":   [".yaml", ".yml"],
  "application/toml":     [".toml"],
  "text/x-gemfile":       [],
}

const VALID_NAMES = new Set([
  "package.json","pnpm-lock.yaml","yarn.lock",
  "requirements.txt","pyproject.toml","uv.lock",
  "go.mod","Cargo.toml","pom.xml","Gemfile","composer.json",
])

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
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-secondary/30",
          uploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        ) : (
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
        )}
        <div className="text-center">
          <p className="font-medium">
            {isDragActive ? "Drop your file here" : "Drag & drop your dependency file"}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            package.json, requirements.txt, go.mod, Cargo.toml, and more
          </p>
        </div>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  )
}
