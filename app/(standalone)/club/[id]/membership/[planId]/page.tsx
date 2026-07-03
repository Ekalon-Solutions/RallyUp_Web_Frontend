import type { Metadata } from "next"
import Link from "next/link"
import { Search, ArrowLeft, Home, UserCheck } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { currentConfig } from "@/lib/config"
import { CheckoutLanding } from "./CheckoutLanding"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Club {
  _id: string
  name: string
  description?: string
  status?: string
  logo?: string
  settings?: {
    membershipPlans?: string[]
  }
}

interface MembershipPlan {
  _id: string
  name: string
  description: string
  price: number
  currency: string
  isActive: boolean
  /** Stored as a plain club _id string after the backend populates it */
  club: string
}

// ---------------------------------------------------------------------------
// Server-side data helpers
// ---------------------------------------------------------------------------

/** Returns true when `value` looks like a valid 24-character MongoDB ObjectId. */
function isValidObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value)
}

/** Fetches club data from the public (unauthenticated) endpoint. */
async function fetchClub(clubId: string): Promise<Club | null> {
  try {
    const url = `${currentConfig.apiBaseUrl}/clubs/${clubId}/public`
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      // Revalidate every 60 s so stale clubs don't block forever
      next: { revalidate: 60 },
    })

    if (!res.ok) return null

    const json = await res.json()
    // The public endpoint returns the club directly or wrapped in { data: club }
    const club: Club = json?.data ?? json
    return club?._id ? club : null
  } catch {
    return null
  }
}

/**
 * Fetches the membership plan via the authenticated endpoint.
 *
 * The backend route `GET /membership-plans/:id` sits behind `router.use(auth)`,
 * so a server-side call without a token will receive a 401.  We treat:
 *   - invalid ObjectId format → "Plan Not Found" immediately (no network call)
 *   - 404 from the server           → "Plan Not Found"
 *   - 401/403 (auth-gated)          → treat as "plan may exist, let client handle auth"
 *   - network error / 5xx           → treat as "plan may exist, let client handle"
 *
 * This gives a correct error screen for obviously invalid IDs (e.g. "fake-plan")
 * while letting real-looking IDs proceed to the checkout UI where the client
 * will perform the authenticated fetch.
 */
async function fetchPlan(planId: string): Promise<MembershipPlan | null | "auth-required"> {
  try {
    const url = `${currentConfig.apiBaseUrl}/membership-plans/${planId}`
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    if (res.status === 401 || res.status === 403) return "auth-required"
    if (!res.ok) return null

    const json = await res.json()
    const plan: MembershipPlan = json?.data ?? json
    return plan?._id ? plan : null
  } catch {
    return "auth-required"
  }
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; planId: string }>
}): Promise<Metadata> {
  return {
    title: "Membership Checkout",
    description: "Complete your club membership purchase.",
  }
}

// ---------------------------------------------------------------------------
// Shared "not found" card UI
// ---------------------------------------------------------------------------

interface NotFoundCardProps {
  title: string
  description: string
  secondaryAction?: "guest" | "browse_clubs"
  club?: Club
}

function NotFoundCard({ title, description, secondaryAction = "browse_clubs", club }: NotFoundCardProps) {
  if (secondaryAction === "guest" && club) {
    return (
      <CheckoutLanding
        club={club}
        planId=""
        isInvalidPlan={true}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EBF3FF] via-[#F4F8FF] to-white public-theme">
      <SiteNavbar brandName="Wingman Pro" />
      
      {/* Main content area */}
      <div className="relative flex flex-col items-center justify-center px-4 py-16 bg-transparent">
        <Card className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border-none overflow-hidden">
          <CardHeader className="text-center pb-5 bg-secondary px-6 pt-6 text-white rounded-t-[2.5rem]">
            <div className="mx-auto w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-3xl font-black text-white">{title}</CardTitle>
            <CardDescription className="text-white/80 text-sm mt-1">{description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-6 pb-6 bg-white px-6 border-x border-b border-secondary/20 rounded-b-[2.5rem]">
            <div className="grid gap-3">
              {/* Server Component — no useRouter; use Link for navigation */}
              <Link href="/" className="w-full">
                <Button className="w-full bg-primary hover:bg-[#FF7E4A] hover:shadow-[0_8px_20px_#FF5C1A6B] text-white h-12 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 gap-2 active:scale-95">
                  <ArrowLeft className="h-4 w-4" />
                  Go Back to Home
                </Button>
              </Link>

              <Link href="/clubs" className="w-full">
                <Button variant="outline" className="w-full border-2 border-secondary bg-white text-secondary hover:bg-secondary/5 hover:text-secondary h-12 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 gap-2 active:scale-95">
                  <Home className="h-4 w-4" />
                  Browse Clubs
                </Button>
              </Link>
            </div>
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-100 bg-white py-4 border-x border-b border-secondary/20 rounded-b-[2.5rem]">
            <p className="text-xs text-secondary/80 font-medium">
              Need help?{" "}
              <Link
                href="/contact"
                className="text-primary hover:underline font-bold"
              >
                Contact Support
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
      <SiteFooter brandName="Wingman Pro" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function MembershipCheckoutPage({
  params,
}: {
  params: Promise<{ id: string; planId: string }>
}) {
  const { id: clubId, planId } = await params

  // ── 1. Validate club ────────────────────────────────────────────────────

  if (!isValidObjectId(clubId)) {
    return (
      <NotFoundCard
        title="Club Not Found"
        description="The club you're looking for doesn't exist or has been removed. Please check the URL or try searching for another club."
      />
    )
  }

  const club = await fetchClub(clubId)

  if (!club) {
    return (
      <NotFoundCard
        title="Club Not Found"
        description="The club you're looking for doesn't exist or has been removed. Please check the URL or try searching for another club."
      />
    )
  }

  // ── 2. Validate plan — check club's plan list first ─────────────────────
  //
  // The club's settings.membershipPlans array lists all valid plan IDs for
  // this club, so we can reject unknown plans without calling the auth-gated
  // plan endpoint (which returns 401 even for non-existent plans).

  const validPlanIds = club.settings?.membershipPlans ?? []
  if (validPlanIds.length > 0 && !validPlanIds.includes(planId)) {
    return (
      <NotFoundCard
        title="Incorrect Plan"
        description="The membership plan you're looking for doesn't exist or is no longer available."
        secondaryAction="guest"
        club={club}
      />
    )
  }

  if (!isValidObjectId(planId)) {
    return (
      <NotFoundCard
        title="Incorrect Plan"
        description="The membership plan you're looking for doesn't exist or is no longer available."
        secondaryAction="guest"
        club={club}
      />
    )
  }

  const planResult = await fetchPlan(planId)

  if (planResult === null) {
    // Server confirmed 404 — plan genuinely does not exist
    return (
      <NotFoundCard
        title="Incorrect Plan"
        description="The membership plan you're looking for doesn't exist or is no longer available."
        secondaryAction="guest"
        club={club}
      />
    )
  }

  // planResult === "auth-required" means the endpoint exists but needs a token.
  // The authenticated plan fetch will be handled client-side in the checkout UI.
  // If the plan belongs to a different club, the checkout component will catch it.

  if (planResult !== "auth-required") {
    // We got the plan data — verify it belongs to this club
    const planClubId =
      typeof planResult.club === "string"
        ? planResult.club
        : (planResult.club as any)?._id?.toString?.() ?? ""

    if (planClubId && planClubId !== clubId) {
      return (
        <NotFoundCard
          title="Incorrect Plan"
          description="This membership plan doesn't belong to the selected club."
          secondaryAction="guest"
          club={club}
        />
      )
    }
  }

  // ── 3. Render landing screen ─────────────────────────────────────────────

  // When planResult is a full plan object, pass it to the client component so
  // it can render name/price/duration without a second fetch.
  const resolvedPlan =
    planResult !== "auth-required" && planResult !== null
      ? {
          _id: planResult._id,
          name: planResult.name,
          description: planResult.description,
          price: planResult.price,
          currency: planResult.currency,
          isActive: planResult.isActive,
          duration: (planResult as any).duration,
          planStartDate: (planResult as any).planStartDate,
          planEndDate: (planResult as any).planEndDate,
        }
      : undefined

  return (
    <CheckoutLanding
      club={club}
      planId={planId}
      plan={resolvedPlan}
    />
  )
}
