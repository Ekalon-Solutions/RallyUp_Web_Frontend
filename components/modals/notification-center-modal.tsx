"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Bell, CheckCheck, ExternalLink, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { apiClient, type InAppNotification } from "@/lib/api"
import { cn } from "@/lib/utils"

type NotificationsResponse = {
  notifications: InAppNotification[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export function NotificationCenterModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingCount, setLoadingCount] = useState(false)
  const [items, setItems] = useState<InAppNotification[]>([])

  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoadingCount(true)
      const res = await apiClient.getUnreadNotificationsCount()
      if (res.success && res.data) {
        setUnreadCount(res.data.unreadCount || 0)
      }
    } finally {
      setLoadingCount(false)
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingList(true)
      const res = await apiClient.getMyNotifications({ page: 1, limit: 30 })
      const data = (res.success ? res.data : null) as unknown as NotificationsResponse | null
      if (data?.notifications) {
        setItems(data.notifications)
      } else {
        setItems([])
      }
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    const t = setInterval(fetchUnreadCount, 30_000)
    return () => clearInterval(t)
  }, [fetchUnreadCount])

  useEffect(() => {
    if (open) {
      fetchNotifications()
      fetchUnreadCount()
    }
  }, [open, fetchNotifications, fetchUnreadCount])

  const markAllRead = useCallback(async () => {
    const res = await apiClient.markAllInAppNotificationsRead()
    if (res.success) {
      setUnreadCount(0)
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })))
    }
  }, [])

  const onClickNotification = useCallback(
    async (n: InAppNotification) => {
      if (!n.readAt) {
        await apiClient.markInAppNotificationRead(n._id)
        setUnreadCount((c) => Math.max(0, c - 1))
        setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, readAt: new Date().toISOString() } : x)))
      }

      if (n.cta?.url) {
        setOpen(false)
        router.push(n.cta.url)
      }
    },
    [router]
  )

  const headerRight = useMemo(() => {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => router.push("/dashboard/user-settings")}
          title="Manage notification preferences"
        >
          <Settings className="h-4 w-4 mr-2" />
          Preferences
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          title="Mark all notifications as read"
        >
          <CheckCheck className="h-4 w-4 mr-2" />
          Mark all read
        </Button>
      </div>
    )
  }, [markAllRead, router, unreadCount])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-background hover:bg-muted/40 transition-colors"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-extrabold flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px] p-0">
        <div className="p-6 pb-4">
          <SheetHeader className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <SheetTitle className="text-xl font-black tracking-tight">Notifications</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {loadingCount ? "Checking…" : unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                </p>
              </div>
              {headerRight}
            </div>
          </SheetHeader>
        </div>

        <Separator />

        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="p-4 space-y-2">
            {loadingList ? (
              <div className="p-6 text-sm text-muted-foreground">Loading notifications…</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No notifications yet.</div>
            ) : (
              items.map((n) => {
                const created = n.createdAt ? new Date(n.createdAt) : null
                const age = created ? formatDistanceToNow(created, { addSuffix: true }) : ""
                const isUnread = !n.readAt

                return (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => onClickNotification(n)}
                    className={cn(
                      "w-full text-left rounded-2xl border p-4 hover:bg-muted/40 transition-colors",
                      isUnread ? "border-primary/30 bg-primary/5" : "border-border bg-background"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <div className={cn("h-2.5 w-2.5 rounded-full", isUnread ? "bg-red-600" : "bg-muted")} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold leading-snug truncate">{n.title}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{age}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.message}</p>

                        {n.cta?.url && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs font-bold text-primary">
                              {n.cta.label || "Open"}
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 text-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

