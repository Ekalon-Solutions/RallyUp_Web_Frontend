"use client"

import { useRef, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api"

type Base = { clubId: string; open: boolean; onOpenChange: (o: boolean) => void }
const MAX_FILES = 10, MAX_MB = 50

export const MemberCreateThreadDialog = ({ clubId, open, onOpenChange, onCreated }: Base & { onCreated: () => void }) => {
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [files, setFiles] = useState<File[]>([]); const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const addFiles = (list: FileList | null) => {
    const ok = Array.from(list ?? []).filter((f) => /^(image|video)\//.test(f.type) && f.size <= MAX_MB * 1024 * 1024)
    if (ok.length < (list?.length ?? 0)) toast({ title: "Some files skipped", description: `Images and videos up to ${MAX_MB} MB only.`, variant: "destructive" })
    setFiles((p) => [...p, ...ok].slice(0, MAX_FILES))
  }
  const submit = async () => {
    setBusy(true)
    const r = await apiClient.createMemberForumThread(clubId, { title: title.trim(), body, files })
    setBusy(false)
    if (!r.success) return toast({ title: "Could not post thread", description: r.error || r.message, variant: "destructive" })
    setTitle(""); setBody(""); setFiles([]); onOpenChange(false); onCreated()
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create thread</DialogTitle><DialogDescription className="sr-only">Start a new discussion</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Title</Label><Input maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's this thread about?" /><p className="text-right text-xs text-muted-foreground">{title.length}/120</p></div>
          <div className="space-y-2"><Label>Description <span className="text-muted-foreground">(optional)</span></Label><Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write something for the club..." /></div>
          <div className="space-y-2"><Label>Images & video <span className="text-muted-foreground">(optional)</span></Label>
            <div role="button" tabIndex={0} onClick={() => input.current?.click()} onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
              className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed text-center text-sm">
              <p><strong>Click to upload</strong> or drag and drop</p><p className="text-xs text-muted-foreground">Images and videos, up to {MAX_FILES} files, {MAX_MB} MB each</p>
            </div>
            <input ref={input} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = "" }} />
            {files.length > 0 && <ul className="space-y-1 text-xs">{files.map((f, i) => <li key={i} className="flex justify-between"><span className="truncate">{f.name}</span><button className="text-orange-600" onClick={() => setFiles(files.filter((_, j) => j !== i))}>Remove</button></li>)}</ul>}
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!title.trim() || busy} onClick={submit}>{busy ? "Posting…" : "Post thread"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const ReportCommentDialog = ({ clubId, open, onOpenChange, commentId }: Base & { commentId: string | null }) => {
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false)
  const submit = async () => {
    if (!commentId) return
    setBusy(true)
    const r = await apiClient.reportForumComment(clubId, commentId, text.trim())
    setBusy(false)
    if (!r.success) return toast({ title: "Could not submit report", description: r.error || r.message, variant: "destructive" })
    toast({ title: "Report submitted", description: "Thanks. The club admins will review it." }); setText(""); onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Report comment</DialogTitle></DialogHeader>
        <p className="font-semibold">What's wrong with this comment?</p>
        <p className="text-sm text-muted-foreground">Describe the problem in your own words. The more detail you give, the easier it is for us to review.</p>
        <Textarea rows={5} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Tell us what's wrong..." />
        <p className="text-right text-xs text-muted-foreground">{text.length} / 500</p>
        <DialogFooter className="grid grid-cols-2 gap-3 sm:space-x-0"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!text.trim() || busy} onClick={submit}>Submit report</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
