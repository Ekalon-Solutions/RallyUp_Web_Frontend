"use client"

import { useEffect, useState } from "react"
import { Heart, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { apiClient } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { ReactionRow, ReactionType, Reactions } from "@/types/forum"

export const EMOJI: Record<ReactionType, string> = { like: "👍", love: "❤️", laugh: "😆", sad: "😢" }
const TYPES = Object.keys(EMOJI) as ReactionType[]
const initials = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()

type Props = { clubId: string; targetType: "thread" | "comment"; targetId: string; reactions?: Reactions; disabled?: boolean; onChange: () => void }

/** Like toggle + emoji picker + the emoji cluster that opens the "who reacted" modal. */
export const ReactionBar = ({ clubId, targetType, targetId, reactions, disabled, onChange }: Props) => {
  const [open, setOpen] = useState(false)
  const [picker, setPicker] = useState(false)
  const total = reactions?.total ?? 0
  const top = TYPES.filter((t) => reactions?.counts[t]).sort((a, b) => (reactions?.counts[b] ?? 0) - (reactions?.counts[a] ?? 0))
  const react = async (type: ReactionType) => { setPicker(false); await apiClient.reactForum(clubId, targetType, targetId, type); onChange() }

  return (
    <div className="flex items-center gap-2">
      <Popover open={picker} onOpenChange={setPicker}>
        <PopoverTrigger asChild>
          <Button type="button" size="sm" variant="outline" disabled={disabled} className={cn("h-7 gap-1 rounded-full px-3", reactions?.mine && "border-primary text-primary")}
            onClick={(e) => { e.preventDefault(); void react("like") }} onContextMenu={(e) => { e.preventDefault(); setPicker(true) }}>
            {reactions?.mine === "love" ? <Heart className="h-4 w-4" /> : <ThumbsUp className="h-4 w-4" />}{total}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-auto gap-1 p-1" align="start">
          {TYPES.map((t) => <button key={t} type="button" className="rounded p-1.5 text-xl hover:bg-muted" onClick={() => react(t)} aria-label={t}>{EMOJI[t]}</button>)}
        </PopoverContent>
      </Popover>
      <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setPicker(true)} disabled={disabled}>React</button>
      {top.length > 0 && <button type="button" className="ml-auto flex" aria-label="See reactions" onClick={() => setOpen(true)}>{top.map((t) => <span key={t} className="-ml-1 text-base first:ml-0">{EMOJI[t]}</span>)}</button>}
      {open && <ReactionsModal clubId={clubId} targetId={targetId} onClose={() => setOpen(false)} />}
    </div>
  )
}

const ReactionsModal = ({ clubId, targetId, onClose }: { clubId: string; targetId: string; onClose: () => void }) => {
  const [rows, setRows] = useState<ReactionRow[] | null>(null)
  const [tab, setTab] = useState<ReactionType | "all">("all")
  useEffect(() => { void apiClient.getForumReactions(clubId, targetId).then((r) => setRows(r.data?.reactions ?? [])) }, [clubId, targetId])
  const shown = (rows ?? []).filter((r) => tab === "all" || r.type === tab)
  const count = (t: ReactionType) => (rows ?? []).filter((r) => r.type === t).length
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Reactions</DialogTitle></DialogHeader>
        <div className="flex gap-1 border-b">
          {(["all", ...TYPES] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("border-b-2 px-3 py-2 text-sm", tab === t ? "border-primary font-semibold" : "border-transparent text-muted-foreground")}>
              {t === "all" ? `All ${rows?.length ?? 0}` : `${EMOJI[t]} ${count(t)}`}
            </button>
          ))}
        </div>
        <div className="max-h-80 divide-y overflow-y-auto">
          {rows === null && <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>}
          {shown.map((r) => (
            <div key={r.userId} className="flex items-center gap-3 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">{initials(r.userName || "?")}</span>
              <span className="font-medium">{r.userName}</span><span className="ml-auto">{EMOJI[r.type]}</span>
            </div>
          ))}
          {rows && shown.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No reactions yet.</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
