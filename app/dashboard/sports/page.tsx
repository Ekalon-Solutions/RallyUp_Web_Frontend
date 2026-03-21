"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

export default function SportsPage() {
  const [clubs, setClubs] = useState<any[]>([])
  const [selectedClubId, setSelectedClubId] = useState<string>("")
  const [loadingClubs, setLoadingClubs] = useState(true)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [currentTeam, setCurrentTeam] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [fetchingEvents, setFetchingEvents] = useState(false)
  const [refreshingTable, setRefreshingTable] = useState(false)

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const resp = await apiClient.getClubs({ page: 1, limit: 200 })
        if (resp.success && resp.data) {
          const list = (resp.data as any).clubs ?? (Array.isArray(resp.data) ? resp.data : [])
          setClubs(list)
        }
      } catch {
        toast.error("Failed to load clubs")
      } finally {
        setLoadingClubs(false)
      }
    }
    fetchClubs()
  }, [])

  useEffect(() => {
    if (selectedClubId) loadCurrentTeam(selectedClubId)
    else setCurrentTeam(null)
  }, [selectedClubId])

  const loadCurrentTeam = async (clubId: string) => {
    try {
      const resp = await apiClient.getClubSettings(clubId)
      if (resp.success && resp.data) {
        const data = (resp.data as any).data || resp.data
        const s = data.sports || {}
        if (s?.teamId || s?.teamName) {
          setCurrentTeam({ teamId: s.teamId, teamName: s.teamName, teamBadge: s.teamBadge, teamLogo: s.teamLogo })
        } else {
          setCurrentTeam(null)
        }
      }
    } catch {
      // ignore
    }
  }

  const handleSearch = async () => {
    if (!query || query.trim().length === 0) return toast.error("Enter a team name to search")
    try {
      setLoading(true)
      const response = await fetch(`https://www.thesportsdb.com/api/v1/json/104775/searchteams.php?t=${encodeURIComponent(query.trim())}`)
      const data = await response.json()
      if (data.teams) {
        setResults(data.teams.map((team: any) => ({
          idTeam: team.idTeam,
          name: team.strTeam,
          badge: team.strBadge,
          logo: team.strLogo,
          league: team.strLeague,
          country: team.strCountry,
        })))
      } else {
        toast.error("No results")
        setResults([])
      }
    } catch {
      toast.error("Search failed")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedClubId) return toast.error("Select a club first")
    if (!selected) return toast.error("Select a team")
    try {
      setLoading(true)
      const resp = await apiClient.updateClubSportsSettings(selectedClubId, {
        teamName: selected.name,
        teamId: String(selected.idTeam),
        teamBadge: selected.badge || "",
        teamLogo: selected.badge || "",
      })
      if (resp.success) {
        toast.success("Team saved")
        setCurrentTeam({ teamName: selected.name, teamId: selected.idTeam, teamBadge: selected.badge })
        setResults([])
        setQuery("")
        setSelected(null)
      } else {
        toast.error("Failed to save")
      }
    } catch {
      toast.error("Failed to save")
    } finally {
      setLoading(false)
    }
  }

  const handleFetchNextEvents = async () => {
    if (!currentTeam) return toast.error("No team configured")
    try {
      setFetchingEvents(true)
      const resp = await apiClient.proxyInternalNextMatches({ team: currentTeam.teamName, clubId: selectedClubId })
      if (resp.success) {
        toast.success("Next events fetched successfully")
      } else {
        toast.error("Failed to fetch next events")
      }
    } catch {
      toast.error("Failed to fetch next events")
    } finally {
      setFetchingEvents(false)
    }
  }

  const handleRefreshLeagueTable = async () => {
    try {
      setRefreshingTable(true)
      const resp = await apiClient.refreshLeagueTables()
      if (resp.success) {
        toast.success("League table refreshed successfully")
      } else {
        toast.error("Failed to refresh league table")
      }
    } catch {
      toast.error("Failed to refresh league table")
    } finally {
      setRefreshingTable(false)
    }
  }

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8" />
              Sports
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage sports team integrations for clubs
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sports / Team Integration</CardTitle>
              <CardDescription>Select a club, then search and assign a team for automatic event imports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Club</Label>
                <Select value={selectedClubId} onValueChange={setSelectedClubId} disabled={loadingClubs}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingClubs ? "Loading clubs…" : "Select a club"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map((club: any) => (
                      <SelectItem key={club._id} value={club._id}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClubId && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <Label>Search Team</Label>
                      <div className="flex gap-2">
                        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter team name (e.g. Liverpool)" />
                        <Button onClick={handleSearch} disabled={loading}>{loading ? "Searching…" : "Search"}</Button>
                      </div>
                    </div>
                    <div>
                      <Label>Current Team</Label>
                      <div className="text-sm text-muted-foreground">
                        {currentTeam ? (
                          <div className="flex items-center gap-2">
                            {currentTeam.teamBadge ? <img src={currentTeam.teamBadge} alt="badge" className="w-8 h-8 object-contain" /> : null}
                            <div>{currentTeam.teamName} {currentTeam.teamId ? `(${currentTeam.teamId})` : ""}</div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No team configured</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleFetchNextEvents} disabled={!currentTeam || fetchingEvents}>
                      {fetchingEvents ? "Fetching Events…" : "Fetch Next Events"}
                    </Button>
                    <Button onClick={handleRefreshLeagueTable} disabled={refreshingTable}>
                      {refreshingTable ? "Refreshing Table…" : "Refresh League Table"}
                    </Button>
                  </div>

                  {results.length > 0 && (
                    <div className="space-y-2">
                      <Label>Results</Label>
                      <div className="grid gap-2">
                        {results.map((r: any) => (
                          <div
                            key={r.idTeam}
                            className={`p-2 border rounded flex items-center gap-3 cursor-pointer ${selected?.idTeam === r.idTeam ? "border-primary bg-primary/5" : ""}`}
                            onClick={() => setSelected(r)}
                          >
                            {r.badge ? <img src={r.badge} alt="badge" className="w-10 h-10 object-contain" /> : <div className="w-10 h-10 bg-gray-100" />}
                            <div className="flex-1">
                              <div className="font-medium">{r.name}</div>
                              <div className="text-sm text-muted-foreground">{r.country}</div>
                            </div>
                            <div className="text-sm text-muted-foreground">{r.idTeam}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={!selected || loading}>{loading ? "Saving…" : "Save selected team"}</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
