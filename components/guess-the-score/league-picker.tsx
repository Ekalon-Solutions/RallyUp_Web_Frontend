"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown, ChevronUp, LogOut, PlusCircle, RotateCcw, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GTSJoinedLeague } from "@/lib/api"

/** The league switcher from the design: joined leagues, left ones (history), and "Join another league". */
export function LeaguePicker({ leagues, selectedId, onSelect, onJoinAnother, onLeave, onRejoin }: {
  leagues: GTSJoinedLeague[]
  selectedId: string | null
  onSelect: (competitionId: string) => void
  onJoinAnother: () => void
  onLeave: (league: GTSJoinedLeague) => void
  onRejoin: (league: GTSJoinedLeague) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = leagues.find((l) => l.competitionId === selectedId)
  const active = leagues.filter((l) => l.status === "active")
  const left = leagues.filter((l) => l.status === "left")

  const pick = (id: string) => { onSelect(id); setOpen(false) }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-full min-w-[220px] items-center gap-2 rounded-md bg-muted px-3 text-sm font-semibold sm:w-64"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate text-left">{selected?.name ?? "Choose a league"}</span>
          {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[var(--radix-popover-trigger-width)] min-w-64 space-y-1.5 bg-muted p-2">
        {active.map((l) => (
          <div
            key={l.competitionId}
            className={cn(
              "group flex items-center rounded-md bg-background text-xs font-medium",
              l.competitionId === selectedId && "ring-1 ring-primary"
            )}
          >
            <button type="button" className="flex-1 truncate px-3 py-2 text-left" onClick={() => pick(l.competitionId)}>
              {l.name}
            </button>
            <button
              type="button"
              aria-label={`Leave ${l.name}`}
              title="Leave league"
              onClick={() => { setOpen(false); onLeave(l) }}
              className="mr-1 rounded p-1.5 text-muted-foreground opacity-60 hover:bg-muted hover:text-destructive group-hover:opacity-100"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {left.length > 0 && (
          <>
            <p className="px-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Left · past picks only</p>
            {left.map((l) => (
              <div key={l.competitionId} className="flex items-center rounded-md bg-background/60 text-xs text-muted-foreground">
                <button type="button" className="flex-1 truncate px-3 py-2 text-left" onClick={() => pick(l.competitionId)}>
                  {l.name}
                </button>
                <button
                  type="button"
                  aria-label={`Re-join ${l.name}`}
                  title="Re-join league"
                  onClick={() => { setOpen(false); onRejoin(l) }}
                  className="mr-1 rounded p-1.5 hover:bg-muted hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </>
        )}

        <button
          type="button"
          onClick={() => { setOpen(false); onJoinAnother() }}
          className="flex w-full items-center justify-between rounded-md bg-background px-3 py-2 text-xs font-medium"
        >
          Join Another League
          <PlusCircle className="h-4 w-4" />
        </button>
      </PopoverContent>
    </Popover>
  )
}
