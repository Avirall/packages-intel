import Link from "next/link"
import { Shield, ArrowLeft } from "lucide-react"
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <div className="dot-grid min-h-screen flex items-center justify-center px-4">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-br from-teal-50/60 via-white to-sky-50/50" />

      <div className="relative w-full max-w-[400px] flex flex-col gap-4">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>

        {/* Card */}
        <div className="top-glow-line relative rounded-2xl border border-gray-200 bg-white shadow-xl shadow-teal-900/5 overflow-hidden">
          <div className="p-8 space-y-7">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
                <Shield className="h-5 w-5 text-teal-600" />
              </div>
              <div className="text-center">
                <h1 className="text-lg font-semibold tracking-tight text-gray-900">Welcome back</h1>
                <p className="text-gray-500 text-sm mt-0.5">Sign in to OSS Sentinel</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100" />

            {/* Form */}
            <LoginForm />

            {/* Footer link */}
            <p className="text-center text-sm text-gray-500">
              No account?{" "}
              <Link href="/register" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
