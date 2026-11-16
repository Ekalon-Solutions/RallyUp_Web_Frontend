"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type SaveOptions = {
  mode: "draft" | "publish"
  images?: { list400?: File | null; full1080?: File | null }
  /** Editing a live listing that people already entered, with dates/price/location changed. */
  impactsEntries?: boolean
}

/**
 * Create / update / publish for the listing wizards. Shows a confirm before changing
 * core details of a published listing that already has entries.
 */
export function useListingSave({ editId, wasDraft, returnTo }: { editId: string | null; wasDraft: boolean; returnTo: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<{ payload: Record<string, unknown>; options: SaveOptions } | null>(null)

  const run = async (payload: Record<string, unknown>, options: SaveOptions) => {
    setLoading(true)
    try {
      let eventId = editId
      if (editId) {
        const res = await apiClient.updateEvent(editId, payload as any)
        if (!res.success) return void toast.error(res.message || res.error || "Failed to save")
        if (wasDraft && options.mode === "publish") {
          const pub = await apiClient.publishEvent(editId)
          if (!pub.success) return void toast.error(pub.message || pub.error || "Saved, but publishing failed")
        }
      } else {
        const res = await apiClient.createEvent({ ...payload, publishStatus: options.mode === "draft" ? "draft" : "published" } as any)
        if (!res.success) return void toast.error(res.message || res.error || "Failed to create")
        eventId = res.data?.event?._id ?? null
      }

      if (eventId && (options.images?.list400 || options.images?.full1080)) {
        const img = await apiClient.uploadEventImage(eventId, options.images)
        if (!img.success) toast.error("Saved, but the poster failed to upload — edit to try again")
      }

      toast.success(options.mode === "draft" ? "Saved as draft" : editId && !wasDraft ? "Changes saved" : "Published")
      router.push(returnTo)
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  const save = (payload: Record<string, unknown>, options: SaveOptions) => {
    if (options.impactsEntries) {
      setPending({ payload, options })
      return
    }
    void run(payload, options)
  }

  const impactDialog = (
    <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Members have already entered</AlertDialogTitle>
          <AlertDialogDescription>
            You are changing core details (dates, price or location) of a live listing that people have
            already registered for or donated to. Their existing entries are kept, but they may no longer
            match the new details. Let them know about the change.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Go back</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              const p = pending
              setPending(null)
              if (p) void run(p.payload, p.options)
            }}
          >
            Save anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return { loading, save, impactDialog }
}
