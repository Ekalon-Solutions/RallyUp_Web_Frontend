"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { formatDistanceToNowStrict } from "date-fns"
import { apiClient, type ApiResponse } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import type { ForumSettings, Report, SubTopic, Thread, ThreadPatch } from "@/types/forum"

export const DEFAULT_MAX_PINNED = 3
export const ago = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "" : `${formatDistanceToNowStrict(d)} ago`
}

type Ctx = ReturnType<typeof useForumState>
const useForumState = (clubId: string) => {
  const [subTopics, setSubTopics] = useState<SubTopic[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [settings, setSettings] = useState<ForumSettings>({ rules: [], config: {} })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [s, t, r, c] = await Promise.all([apiClient.getForumSubTopics(clubId), apiClient.getForumThreads(clubId), apiClient.getForumReports(clubId), apiClient.getForumSettings(clubId)])
    if (s.data) setSubTopics(s.data.subTopics)
    if (t.data) setThreads(t.data.threads)
    if (r.data) setReports(r.data.reports)
    if (c.data) setSettings(c.data)
    const failed = [s, t, r, c].find((x) => !x.success)
    if (failed) toast({ title: "Could not load forum", description: failed.error || failed.message, variant: "destructive" })
    setLoading(false)
  }, [clubId])
  useEffect(() => { void refresh() }, [refresh])

  // Runs a mutation, toasts on failure, refreshes lists on success. Returns success.
  const run = useCallback(async (p: Promise<ApiResponse<any>>) => {
    const res = await p
    if (!res.success) { toast({ title: "Action failed", description: res.error || res.message, variant: "destructive" }); return false }
    await refresh()
    return true
  }, [refresh])

  const maxPinned = Number(settings.config.pinned) > 0 ? Number(settings.config.pinned) : DEFAULT_MAX_PINNED
  return {
    clubId, loading, subTopics, threads, reports, rules: settings.rules, config: settings.config, maxPinned,
    pinnedCount: threads.filter((t) => t.pinned && !t.archived).length,
    refresh,
    addThread: (d: { title: string; body: string; subTopicId: string; pinned: boolean }) => run(apiClient.createForumThread(clubId, d)),
    patchThread: (id: string, d: ThreadPatch) => run(apiClient.updateForumThread(clubId, id, d)),
    removeThread: (id: string) => run(apiClient.deleteForumThread(clubId, id)),
    saveSubTopic: (d: { id?: string; name: string; description?: string; archived?: boolean }) =>
      run(d.id ? apiClient.updateForumSubTopic(clubId, d.id, d) : apiClient.createForumSubTopic(clubId, d)),
    resolveReport: (commentId: string, action: "keep" | "remove", note?: string) => run(apiClient.resolveForumReport(clubId, commentId, { action, note })),
    saveSettings: (d: Partial<ForumSettings>) => run(apiClient.saveForumSettings(clubId, d)),
  }
}

const ForumCtx = createContext<Ctx | null>(null)
export const ForumProvider = ({ clubId, children }: { clubId: string; children: ReactNode }) => (
  <ForumCtx.Provider value={useForumState(clubId)}>{children}</ForumCtx.Provider>
)
export const useForum = () => {
  const c = useContext(ForumCtx)
  if (!c) throw new Error("useForum must be used inside ForumProvider")
  return c
}
