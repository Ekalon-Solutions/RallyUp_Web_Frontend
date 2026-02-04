"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Building2, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api"

interface Club {
  _id: string
  name: string
  logo?: string
  description?: string
  settingsLogo?: string
}

export default function SplashPage() {
  const { user, activeClubId, setActiveClubId } = useAuth()
  const router = useRouter()
  const [clubs, setClubs] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSelecting, setIsSelecting] = useState(false)

  useEffect(() => {
    if (!user) return

    const loadClubs = async () => {
      try {
        setIsLoading(true)
        const userAny = user as any
        const memberships = userAny.memberships || []
        const isAdmin = userAny.role === 'admin' || userAny.role === 'super_admin'

        const activeMemberships = memberships.filter((m: any) => m.status === 'active')
        const uniqueClubIds = new Set<string>()
        const clubsList: Club[] = []

        activeMemberships.forEach((membership: any) => {
          const clubId = membership.club_id?._id || membership.club_id
          if (clubId && !uniqueClubIds.has(clubId)) {
            uniqueClubIds.add(clubId)
            clubsList.push({
              _id: clubId,
              name: membership.club_id?.name || 'Unknown Club',
              logo: membership.club_id?.logo,
              description: membership.club_id?.description,
              settingsLogo: undefined
            })
          }
        })

        if (clubsList.length === 0 && isAdmin && (userAny.club?._id || userAny.club)) {
          const club = userAny.club
          const clubId = club._id || club
          if (clubId && !uniqueClubIds.has(clubId)) {
            uniqueClubIds.add(clubId)
            clubsList.push({
              _id: clubId,
              name: typeof club === 'object' ? (club.name || 'Unknown Club') : 'Unknown Club',
              logo: typeof club === 'object' ? club.logo : undefined,
              description: typeof club === 'object' ? club.description : undefined,
              settingsLogo: undefined
            })
          }
        }

        const clubsWithSettings = await Promise.all(
          clubsList.map(async (club) => {
            try {
              const settingsResponse = await apiClient.getClubSettings(club._id)
              if (settingsResponse.success && settingsResponse.data) {
                const actualData = settingsResponse.data.data || settingsResponse.data
                const designSettings = actualData.designSettings
                if (designSettings?.logo) {
                  return { ...club, settingsLogo: designSettings.logo }
                }
              }
            } catch (error) {
            }
            return club
          })
        )

        setClubs(clubsWithSettings)

        if (clubsList.length === 0) {
          router.push('/dashboard')
          return
        }

        if (clubsList.length === 1 && !activeClubId && !isAdmin) {
          setActiveClubId(clubsList[0]._id)
          router.push('/dashboard')
          return
        }

        if (clubsList.length === 1 && isAdmin) {
          if (!activeClubId) setActiveClubId(clubsList[0]._id)
          return
        }

        if (clubsList.length > 1) {
          return
        }

        if (activeClubId && clubsList.some(c => c._id === activeClubId)) {
          router.push('/dashboard')
          return
        }
      } catch (error) {
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    loadClubs()
  }, [user, activeClubId, setActiveClubId, router])

  const handleClubSelect = async (clubId: string) => {
    setIsSelecting(true)
    setActiveClubId(clubId)
    setTimeout(() => {
      router.push('/dashboard')
    }, 300)
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your clubs...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 px-4 py-8">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 relative w-20 h-20 md:w-24 md:h-24">
              {(() => {
                const selectedClubForLogo = activeClubId
                  ? clubs.find((c) => c._id === activeClubId)
                  : clubs.length >= 1
                    ? clubs[0]
                    : null
                const clubLogo = selectedClubForLogo?.settingsLogo || selectedClubForLogo?.logo
                const logoToUse = clubLogo ?? "/WingmanPro Logo (White BG).svg"
                const altText = selectedClubForLogo?.name
                  ? `${selectedClubForLogo.name} logo`
                  : "Wingman Pro logo"
                return (
                  <Image
                    src={logoToUse}
                    alt={altText}
                    fill
                    sizes="96px"
                    className="object-contain"
                    priority
                  />
                )
              })()}
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
              Select Your Club
            </h1>
            <p className="text-muted-foreground text-lg">
              Choose which dashboard you'd like to enter
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {clubs.map((club) => (
              <Card
                key={club._id}
                className="group cursor-pointer border-2 hover:border-primary transition-all duration-300 hover:shadow-xl rounded-2xl overflow-hidden bg-card"
                onClick={() => !isSelecting && handleClubSelect(club._id)}
              >
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-border group-hover:border-primary transition-all duration-300 group-hover:scale-105">
                    {club.settingsLogo || club.logo ? (
                      <Image
                        src={club.settingsLogo || club.logo || ""}
                        alt={club.name}
                        fill
                        sizes="112px"
                        className="object-contain p-2"
                      />
                    ) : (
                      <Building2 className="h-12 w-12 md:h-14 md:w-14 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-xl md:text-2xl font-bold group-hover:text-primary transition-colors">
                      {club.name}
                    </h3>
                    {club.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {club.description}
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full mt-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClubSelect(club._id)
                    }}
                    disabled={isSelecting}
                  >
                    {isSelecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Enter Dashboard"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
