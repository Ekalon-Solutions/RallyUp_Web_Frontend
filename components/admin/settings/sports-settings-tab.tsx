"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRequiredClubId } from '@/hooks/useRequiredClubId'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

export default function SportsSettingsTab() {
  const clubId = useRequiredClubId()
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [currentTeam, setCurrentTeam] = useState<any>(null)
  const [fetchingEvents, setFetchingEvents] = useState(false)
  const [refreshingTable, setRefreshingTable] = useState(false)

  useEffect(() => {
    if (clubId) loadCurrent()
  }, [clubId])

  const loadCurrent = async () => {
    try {
      const resp = await apiClient.getClubSettings(clubId)
      if (resp.success && resp.data) {
        const data = resp.data.data || resp.data
        const s = data.sports || {}
        if (s?.teamId || s?.teamName) setCurrentTeam({ teamId: s.teamId, teamName: s.teamName, teamBadge: s.teamBadge, teamLogo: s.teamLogo })
      }
    } catch (e) {
      // ignore
    }
  }

  const handleSearch = async () => {
    if (!query || query.trim().length === 0) return toast.error('Enter a team name to search')
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
          country: team.strCountry
        })))
      } else {
        toast.error('No results')
        setResults([])
      }
    } catch (err) {
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!clubId) return
    if (!selected) return toast.error('Select a team')
    try {
      setLoading(true)
      const resp = await apiClient.updateClubSportsSettings(clubId, {
        teamName: selected.name,
        teamId: String(selected.idTeam),
        teamBadge: selected.badge || '',
        teamLogo: selected.badge || '',
      })
      if (resp.success) {
        toast.success('Team saved')
        setCurrentTeam({ teamName: selected.name, teamId: selected.idTeam, teamBadge: selected.badge })
        setResults([])
        setQuery('')
        setSelected(null)
      } else {
        toast.error('Failed to save')
      }
    } catch (err) {
      toast.error('Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchNextEvents = async () => {
    if (!currentTeam) return toast.error('No team configured')
    try {
      setFetchingEvents(true)
      const resp = await apiClient.proxyInternalNextMatches({ team: currentTeam.teamName, clubId: String(clubId) })
      if (resp.success) {
        toast.success('Next events fetched successfully')
      } else {
        toast.error('Failed to fetch next events')
      }
    } catch (err) {
      toast.error('Failed to fetch next events')
    } finally {
      setFetchingEvents(false)
    }
  }

  const handleRefreshLeagueTable = async () => {
    try {
      setRefreshingTable(true)
      const resp = await apiClient.refreshLeagueTables()
      if (resp.success) {
        toast.success('League table refreshed successfully')
      } else {
        toast.error('Failed to refresh league table')
      }
    } catch (err) {
      toast.error('Failed to refresh league table')
    } finally {
      setRefreshingTable(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sports / Team Integration</CardTitle>
        <CardDescription>Search for a team and persist the selected team for automatic event imports</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Label>Search Team</Label>
            <div className="flex gap-2">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter team name (e.g. Liverpool)" />
              <Button onClick={handleSearch} disabled={loading}>{loading ? 'Searching…' : 'Search'}</Button>
            </div>
          </div>
          <div>
            <Label>Current Team</Label>
            <div className="text-sm text-muted-foreground">
              {currentTeam ? (
                <div className="flex items-center gap-2">
                  {currentTeam.teamBadge ? <img src={currentTeam.teamBadge} alt="badge" className="w-8 h-8 object-contain" /> : null}
                  <div>{currentTeam.teamName}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No team configured</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleFetchNextEvents} disabled={!currentTeam || fetchingEvents}>
            {fetchingEvents ? 'Fetching Events…' : 'Fetch Next Events'}
          </Button>
          <Button onClick={handleRefreshLeagueTable} disabled={refreshingTable}>
            {refreshingTable ? 'Refreshing Table…' : 'Refresh League Table'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <Label>Results</Label>
            <div className="grid gap-2">
              {results.map((r: any) => (
                <div key={r.idTeam} className={`p-2 border rounded flex items-center gap-3 ${selected?.idTeam === r.idTeam ? 'border-primary bg-primary/5' : ''}`} onClick={() => setSelected(r)}>
                  {r.badge ? <img src={r.badge} alt="badge" className="w-10 h-10 object-contain" /> : <div className="w-10 h-10 bg-gray-100" />}
                  <div className="flex-1">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-sm text-muted-foreground">{r.country}</div>
                  </div>
                  {/* team id intentionally hidden from UI */}
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={!selected || loading}>{loading ? 'Saving…' : 'Save selected team'}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
