"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function MembershipPlanCheckoutRedirect() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const planId = params.planId as string

  useEffect(() => {
    if (slug && planId) {
      router.replace(`/clubs/${slug}/membership/checkout?planId=${planId}`)
    }
  }, [slug, planId, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black" />
    </div>
  )
}
