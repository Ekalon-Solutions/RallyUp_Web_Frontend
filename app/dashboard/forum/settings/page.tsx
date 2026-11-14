"use client"

import { useState, type KeyboardEvent } from "react"
import { Plus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { useForum } from "@/components/forum/forum-store"

const DEFAULTS = {
  limit: 10, per: "1 minute", cooldown: 60, pinned: 3, favs: 3, editWindow: 60, maxLen: 15000, depth: "5",
  profanity: true, blocked: ["idiot", "scum", "*****", "trash", "moron"], allow: ["Scunthorpe", "Arsenal", "Class of 92"],
  reporting: true, falseReporters: true, falseAfter: 5,
}

const Num = ({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) => (
  <div className="space-y-2"><Label className="text-xs text-muted-foreground">{label}</Label><Input type="number" min={0} value={value} onChange={(e) => onChange(Number(e.target.value))} /></div>
)
const Toggle = ({ title, hint, checked, onChange }: { title: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{title}</p><p className="text-xs text-muted-foreground">{hint}</p></div><Switch checked={checked} onCheckedChange={onChange} /></div>
)
const Chips = ({ items, onRemove }: { items: string[]; onRemove: (s: string) => void }) => (
  <div className="flex flex-wrap gap-2">{items.map((w) => <Badge key={w} variant="secondary" className="gap-1 font-normal">{w}<button aria-label={`Remove ${w}`} onClick={() => onRemove(w)}><X className="h-3 w-3" /></button></Badge>)}</div>
)

export default function ForumSettingsPage() {
  const { rules: savedRules, config, saveSettings } = useForum()
  const [s, setS] = useState<typeof DEFAULTS>({ ...DEFAULTS, ...config } as typeof DEFAULTS)
  const [rules, setRules] = useState(savedRules); const [newRule, setNewRule] = useState("")
  const set = <K extends keyof typeof DEFAULTS>(k: K, v: (typeof DEFAULTS)[K]) => setS((p) => ({ ...p, [k]: v }))
  const addWord = (k: "blocked" | "allow") => (e: KeyboardEvent<HTMLInputElement>) => {
    const v = e.currentTarget.value.trim()
    if (e.key !== "Enter" || !v) return
    set(k, Array.from(new Set([...s[k], v]))); e.currentTarget.value = ""
  }
  const save = async () => { if (await saveSettings({ rules, config: s })) toast({ title: "Forum settings saved" }) }
  const discard = () => { setS({ ...DEFAULTS, ...config } as typeof DEFAULTS); setRules(savedRules) }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold sm:text-3xl">Forum Settings</h1><p className="text-muted-foreground">Configure posting limits, abuse controls, reporting and community rules.</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={discard}>Discard</Button><Button onClick={save}>Save changes</Button></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Posting limits</CardTitle><CardDescription>Applies per member (not per device or IP) to comments and replies combined.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Num label="Max comments & replies" value={s.limit} onChange={(n) => set("limit", n)} />
                <div className="space-y-2"><Label className="text-xs text-muted-foreground">Per</Label>
                  <Select value={s.per} onValueChange={(v) => set("per", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["1 minute", "5 minutes", "1 hour"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <Num label="Cooldown after limit is hit (seconds)" value={s.cooldown} onChange={(n) => set("cooldown", n)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Threads & comments</CardTitle><CardDescription>Platform defaults for thread behaviour.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Num label="Pinned threads (max)" value={s.pinned} onChange={(n) => set("pinned", n)} />
                <Num label="Favourite threads per member" value={s.favs} onChange={(n) => set("favs", n)} />
                <Num label="Comment edit window (minutes)" value={s.editWindow} onChange={(n) => set("editWindow", n)} />
                <Num label="Max comment length (characters)" value={s.maxLen} onChange={(n) => set("maxLen", n)} />
              </div>
              <div className="space-y-2"><Label className="text-xs text-muted-foreground">Reply nesting depth</Label>
                <Select value={s.depth} onValueChange={(v) => set("depth", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n} level{n > 1 ? "s" : ""}</SelectItem>)}</SelectContent></Select></div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Profanity filter</CardTitle><CardDescription>Matches are redacted in the comment and sent to the Moderation Queue, never silently blocked.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <Toggle title="Enable profanity filter" hint="Flag matching words in comments and replies." checked={s.profanity} onChange={(v) => set("profanity", v)} />
              <Label className="text-sm font-medium">Blocked words</Label><Chips items={s.blocked} onRemove={(w) => set("blocked", s.blocked.filter((x) => x !== w))} />
              <div className="space-y-2"><Label className="text-xs text-muted-foreground">Add a word</Label><Input placeholder="Type a word and press Enter" onKeyDown={addWord("blocked")} /></div>
              <Label className="text-sm font-medium">Allowlist (club names, player names)</Label><Chips items={s.allow} onRemove={(w) => set("allow", s.allow.filter((x) => x !== w))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Reporting</CardTitle><CardDescription>Reasons members can choose when reporting a comment.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <Toggle title="Allow members to report comments" hint="Reports land in the Moderation Queue with a cumulative count." checked={s.reporting} onChange={(v) => set("reporting", v)} />
              <div className="flex flex-wrap gap-2">{["Spam", "Abuse", "Harassment", "Hate speech", "Misinformation", "Other"].map((r) => <Badge key={r} variant="secondary" className="font-normal">{r}</Badge>)}</div>
              <Toggle title="Flag repeat false reporters" hint="Prompt admins to review reporting privileges after repeated rejected reports." checked={s.falseReporters} onChange={(v) => set("falseReporters", v)} />
              <Num label="Flag after this many rejected reports (30 days)" value={s.falseAfter} onChange={(n) => set("falseAfter", n)} />
            </CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div><CardTitle>Community rules</CardTitle><CardDescription>Shown in the right panel of the forum for every member.</CardDescription></div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2"><Input value={newRule} onChange={(e) => setNewRule(e.target.value)} placeholder="Add a rule" /><Button variant="outline" disabled={!newRule.trim()} onClick={() => { setRules([...rules, newRule.trim()]); setNewRule("") }}><Plus className="mr-1 h-4 w-4" />Add rule</Button></div>
          <div className="divide-y">
            {rules.map((r, i) => (
              <div key={`${r}-${i}`} className="flex items-center gap-3 py-3 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs">{i + 1}</span>
                <Input className="h-8 flex-1 border-0 bg-transparent px-1 shadow-none" value={r} onChange={(e) => setRules(rules.map((x, j) => (j === i ? e.target.value : x)))} />
                <button className="text-xs text-orange-600" onClick={() => setRules(rules.filter((_, j) => j !== i))}>Remove</button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
