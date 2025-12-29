"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function RegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const club = searchParams.get("club")
    
    const params = new URLSearchParams()
    if (club) {
      params.set("club", club)
    }
    params.set("tab", "user-register")
    
    router.replace(`/login?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to registration...</p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  )
}
