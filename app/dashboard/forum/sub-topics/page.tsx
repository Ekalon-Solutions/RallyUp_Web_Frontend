"use client"

import { useState } from "react"
import { Pencil, Plus, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SubTopicDialog } from "@/components/forum/forum-dialogs"
import { ago, useForum } from "@/components/forum/forum-store"
import type { SubTopic } from "@/types/forum"

export default function SubTopicsPage() {
  const { subTopics, saveSubTopic } = useForum()
  const [archived, setArchived] = useState(false); const [q, setQ] = useState("")
  const [dlg, setDlg] = useState<{ open: boolean; topic?: SubTopic }>({ open: false })
  const rows = subTopics.filter((s) => s.archived === archived && s.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold sm:text-3xl">Sub-topics</h1><p className="text-muted-foreground">Organise the forum into sub-topics such as Matchday Chat and Transfer Talk.</p></div>
        <Button onClick={() => setDlg({ open: true })}><Plus className="mr-1 h-4 w-4" />Create sub-topic</Button>
      </div>
      <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">Archiving a sub-topic keeps its threads visible as read-only. Renaming never breaks existing links or bookmarks.</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="rounded-full" variant={archived ? "outline" : "default"} onClick={() => setArchived(false)}>Active ({subTopics.filter((s) => !s.archived).length})</Button>
        <Button size="sm" className="rounded-full" variant={archived ? "default" : "outline"} onClick={() => setArchived(true)}>Archived ({subTopics.filter((s) => s.archived).length})</Button>
        <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search sub-topics..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Sub-topic</TableHead><TableHead>Threads</TableHead><TableHead>Comments</TableHead><TableHead>Last activity</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.map((s) => (
            <TableRow key={s.id}>
              <TableCell><p className="font-semibold">{s.name}</p><p className="text-xs text-muted-foreground">{s.description}</p></TableCell>
              <TableCell>{s.threads}</TableCell><TableCell>{s.comments.toLocaleString()}</TableCell><TableCell className="text-muted-foreground">{ago(s.lastActivity)}</TableCell>
              <TableCell><Badge variant="outline" className={s.archived ? "" : "border-green-500/50 text-green-600"}>{s.archived ? "Archived" : "Active"}</Badge></TableCell>
              <TableCell className="space-x-2 text-right">
                <Button size="sm" variant="outline" onClick={() => setDlg({ open: true, topic: s })}><Pencil className="mr-1 h-3.5 w-3.5" />Rename</Button>
                <Button size="sm" variant="outline" onClick={() => saveSubTopic({ id: s.id, name: s.name, archived: !s.archived })}>{s.archived ? "Restore" : "Archive"}</Button>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No sub-topics.</TableCell></TableRow>}
        </TableBody>
      </Table>
      <SubTopicDialog open={dlg.open} onOpenChange={(o) => setDlg((d) => ({ ...d, open: o }))} topic={dlg.topic} />
    </div>
  )
}
