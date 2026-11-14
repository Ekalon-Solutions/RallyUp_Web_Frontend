"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, FileText, Tag } from "lucide-react"
import type { Report, SubTopic, Thread } from "@/types/forum"
import { ago, useForum } from "./forum-store"

type Base = { open: boolean; onOpenChange: (o: boolean) => void }

const Notice = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg border bg-muted/40 p-3 text-sm text-orange-600 dark:text-orange-400">{children}</div>
)
const SwitchRow = ({ title, hint, checked, onChange, disabled }: { title: string; hint: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <div className="flex items-center justify-between gap-4">
    <div><p className="text-sm font-medium">{title}</p><p className="text-xs text-muted-foreground">{hint}</p></div>
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
  </div>
)
const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="space-y-2"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>
)

export const CreateThreadDialog = ({ open, onOpenChange }: Base) => {
  const { subTopics, addThread, pinnedCount, maxPinned } = useForum()
  const active = subTopics.filter((s) => !s.archived)
  const [title, setTitle] = useState(""); const [sub, setSub] = useState(active[0]?.id ?? ""); const [body, setBody] = useState(""); const [pin, setPin] = useState(false)
  const full = pinnedCount >= maxPinned
  const submit = async () => { if (await addThread({ title: title.trim(), body, subTopicId: sub, pinned: pin })) { setTitle(""); setBody(""); setPin(false); onOpenChange(false) } }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Create thread</DialogTitle><DialogDescription>Start a discussion on behalf of the club.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your thread a clear title" /></Field>
          <Field label="Sub-topic">
            <Select value={sub} onValueChange={setSub}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{active.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
          </Field>
          <Field label="Body"><Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share the details..." /></Field>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-medium">Attach</span>
            {/* ponytail: attach buttons are inert until forum media upload exists */}
            <Button type="button" variant="outline" size="sm" disabled><ImageIcon className="mr-1 h-4 w-4" />Image</Button>
            <Button type="button" variant="outline" size="sm" disabled><FileText className="mr-1 h-4 w-4" />Video</Button>
            <Button type="button" variant="outline" size="sm" disabled><Tag className="mr-1 h-4 w-4" />Link</Button>
          </div>
          <SwitchRow title="Pin on publish" hint={`${pinnedCount} of ${maxPinned} pinned slots are in use. Pinned threads stay at the top of the forum.`} checked={pin} onChange={setPin} disabled={full} />
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!title.trim() || !sub} onClick={submit}>Publish thread</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Create (no `topic`) and rename/edit (with `topic`) share one dialog.
export const SubTopicDialog = ({ open, onOpenChange, topic }: Base & { topic?: SubTopic }) => {
  const { saveSubTopic } = useForum()
  const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [flag, setFlag] = useState(true)
  useEffect(() => { if (open) { setName(topic?.name ?? ""); setDesc(topic?.description ?? ""); setFlag(topic ? topic.archived : true) } }, [open, topic])
  const save = async () => { if (await saveSubTopic(topic ? { id: topic.id, name: name.trim(), description: desc, archived: flag } : { name: name.trim(), description: desc, archived: !flag })) onOpenChange(false) }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{topic ? "Rename sub-topic" : "Create sub-topic"}</DialogTitle>
          <DialogDescription>{topic ? "Existing links and bookmarks to threads keep working after a rename." : "Add a new space for members to start threads."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Matchday Chat" /></Field>
          <Field label="Description"><Textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What is this sub-topic about?" /></Field>
          {topic
            ? <SwitchRow title="Archive this sub-topic" hint={`${topic.threads} threads will stay visible as read-only. New threads and replies are blocked.`} checked={flag} onChange={setFlag} />
            : <SwitchRow title="Active" hint="Members can start threads and reply as soon as it is created." checked={flag} onChange={setFlag} />}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!name.trim()} onClick={save}>{topic ? "Save changes" : "Create sub-topic"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const ReviewReportDialog = ({ open, onOpenChange, report }: Base & { report: Report | null }) => {
  const { resolveReport } = useForum()
  const [flag, setFlag] = useState(false); const [note, setNote] = useState("")
  useEffect(() => { if (open) { setFlag(false); setNote("") } }, [open])
  if (!report) return null
  const done = async (remove: boolean) => { if (await resolveReport(report.commentId, remove ? "remove" : "keep", note || undefined)) onOpenChange(false) }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Review reported comment</DialogTitle><DialogDescription>{report.count} report{report.count === 1 ? "" : "s"} · first reported {ago(report.createdAt)}</DialogDescription></DialogHeader>
        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <p className="text-xs text-muted-foreground">in: {report.thread}</p>
          <div className="my-1 flex items-center gap-2 font-semibold">{report.author}<Badge variant="outline" className="font-normal">Member</Badge></div>
          <p>{report.text}</p>
        </div>
        <div>
          <p className="mb-2 font-semibold">Reports</p>
          <div className="divide-y border-y">
            {report.reasons.map((r) => (
              <div key={r.label} className="flex items-center gap-3 py-2 text-sm">
                <Badge variant="outline" className="border-orange-500/50 text-orange-600">{r.label}</Badge>
                <span className="font-medium">{r.members.length || report.count} member{(r.members.length || report.count) === 1 ? "" : "s"}</span>
                <span className="ml-auto text-xs text-muted-foreground">{r.members.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
        <SwitchRow title="Flag reporters for review" hint="Use if you believe these reports are false or abusive. Admins can then review their reporting privileges." checked={flag} onChange={setFlag} />
        <Field label="Internal note (optional)"><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Visible to club admins only" /></Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" onClick={() => done(false)}>Keep comment</Button>
          <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={() => done(true)}>Remove comment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const REASONS = ["Spam", "Abuse or harassment", "Off topic", "Misinformation", "Other"]
export const RemoveThreadDialog = ({ open, onOpenChange, thread, onRemoved }: Base & { thread: Thread | null; onRemoved?: () => void }) => {
  const { removeThread } = useForum()
  const [reason, setReason] = useState(""); const [note, setNote] = useState(""); const [notify, setNotify] = useState(true)
  useEffect(() => { if (open) { setReason(""); setNote(""); setNotify(true) } }, [open])
  if (!thread) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Remove thread?</DialogTitle><DialogDescription>“{thread.title}” by {thread.author}</DialogDescription></DialogHeader>
        <Notice>The thread, {thread.comments} comments and {thread.likes} reactions will be hidden from all members, including the author. This cannot be undone.</Notice>
        <Field label="Reason">
          <Select value={reason} onValueChange={setReason}><SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
            <SelectContent>{REASONS.map((r: string) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
        </Field>
        <Field label="Note to author (optional)"><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add context that will be sent with the notification" /></Field>
        <SwitchRow title="Notify the author" hint="Send a message explaining why the thread was removed." checked={notify} onChange={setNotify} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!reason} className="bg-orange-600 text-white hover:bg-orange-700" onClick={async () => { if (await removeThread(thread.id)) { onOpenChange(false); onRemoved?.() } }}>Remove thread</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const LockThreadDialog = ({ open, onOpenChange, thread }: Base & { thread: Thread | null }) => {
  const { patchThread } = useForum()
  const [msg, setMsg] = useState(""); const [auto, setAuto] = useState(false); const [date, setDate] = useState("")
  useEffect(() => { if (open) { setMsg(""); setAuto(false); setDate("") } }, [open])
  if (!thread) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Lock thread?</DialogTitle><DialogDescription>“{thread.title}” stays visible but closes to new replies.</DialogDescription></DialogHeader>
        <Notice>Members who try to reply will see a “Thread locked” message. Existing comments stay readable. Replies being drafted will not be submitted.</Notice>
        <Field label="Message shown to members (optional)"><Textarea rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="This thread has been locked by the club admin." /></Field>
        <SwitchRow title="Unlock automatically" hint="Re-open the thread on a set date." checked={auto} onChange={setAuto} />
        {auto && <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={auto && !date} onClick={async () => { if (await patchThread(thread.id, { locked: true, lockMessage: msg || undefined, unlockAt: auto ? date : undefined })) onOpenChange(false) }}>Lock thread</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
