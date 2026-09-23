"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, Loader2, Plus, Search } from "lucide-react"
import { toast } from "sonner"
import { apiClient, type GTSJoinedLeague, type GTSLeagueOption } from "@/lib/api"

export function LeagueCrest({ src, name, size = 36 }: { src?: string; name: string; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} style={{ width: size, height: size }} className="shrink-0 rounded-full object-contain" />
  ) : (
    <span style={{ width: size, height: size }} className="shrink-0 rounded-full border bg-muted" aria-hidden />
  )
}

export function ChooseLeagueModal({ open, onOpenChange, clubId, onJoined }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  clubId: string
  onJoined: (league: GTSJoinedLeague) => void
}) {
  const [query, setQuery] = useState("")
  const [data, setData] = useState<{ popular: GTSLeagueOption[]; results: GTSLeagueOption[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [joining, setJoining] = useState<string | null>(null)

  // Debounced search against SportsDB's league list (cached server-side).
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await apiClient.searchGTSLeagues(query, clubId)
        if (!cancelled && res.success && res.data) setData(res.data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, query ? 300 : 0)
    return () => { cancelled = true; clearTimeout(t) }
  }, [open, query, clubId])

  const join = async (league: GTSLeagueOption) => {
    setJoining(league.idLeague)
    try {
      // First join of a league also pulls its whole season from SportsDB, so this can take a few seconds.
      const res = await apiClient.joinGTSLeague(league.idLeague, clubId)
      if (res.success && res.data?.league) {
        toast.success(`Joined ${res.data.league.name}`)
        onJoined(res.data.league)
        onOpenChange(false)
        setQuery("")
      } else {
        toast.error(res.error || "Couldn't join this league")
      }
    } catch {
      toast.error("Couldn't join this league")
    } finally {
      setJoining(null)
    }
  }

  const list = query.trim() ? data?.results ?? [] : data?.popular ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-5">
        <DialogHeader className="mb-4">
          <DialogTitle>Choose a league</DialogTitle>
          <DialogDescription className="sr-only">Search SportsDB leagues and join one to predict its fixtures.</DialogDescription>
        </DialogHeader>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for your league..."
            className="h-11 w-full rounded-lg border bg-muted/60 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {query.trim() ? "Results" : "Popular leagues"}
        </p>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {loading && !data ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {query.trim() ? "No leagues match that search." : "No leagues available right now."}
            </p>
          ) : (
            list.map((l) => (
              <div key={l.idLeague} className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
                <LeagueCrest src={l.badge} name={l.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l.name}</p>
                  {l.members > 0 && <p className="text-[11px] text-muted-foreground">{l.members} predicting</p>}
                </div>
                {l.joined ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border text-green-600" aria-label="Joined">
                    <Check className="h-4 w-4" />
                  </span>
                ) : (
                  <button
                    type="button"
                    aria-label={`Join ${l.name}`}
                    disabled={!!joining}
                    onClick={() => join(l)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/40 hover:bg-background disabled:opacity-50"
                  >
                    {joining === l.idLeague ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
