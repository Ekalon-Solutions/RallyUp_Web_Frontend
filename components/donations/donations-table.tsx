"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient, DonationRecord, Event } from "@/lib/api"
import { WEEKDAYS } from "@/lib/listings"
import { formatDisplayDate } from "@/lib/utils"
import { money } from "@/components/listings/listing-preview"

const HANDOVER: Record<string, string> = { location: "Drop-off", next_event: "At next event", pickup: "Pickup" }

/** Every donation type (monetary and item pledges) across a club's donation drives. */
export function DonationsTable({ clubId, initialFilter = "all" }: { clubId: string; initialFilter?: string }) {
  const [filter, setFilter] = useState(initialFilter)
  const [drives, setDrives] = useState<Event[]>([])
  const [data, setData] = useState<{ donations: DonationRecord[]; totalRaised: number; count: number } | null>(null)

  useEffect(() => setFilter(initialFilter), [initialFilter])

  useEffect(() => {
    apiClient.getEventsByClub(clubId).then((res) => setDrives((res.data ?? []).filter((e) => e.listingType === "donation")))
  }, [clubId])

  useEffect(() => {
    setData(null)
    apiClient.getClubDonations(clubId, filter === "all" ? undefined : filter).then((res) => {
      if (!res.success) toast.error(res.message || "Failed to load donations")
      setData(res.data ?? { donations: [], totalRaised: 0, count: 0 })
    })
  }, [clubId, filter])

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Donations & pledges</CardTitle>
          <CardDescription>{data ? `${data.count} entries · ${money(data.totalRaised)} raised` : "Loading…"}</CardDescription>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All donations</SelectItem>
              {drives.map((d) => <SelectItem key={d._id} value={d._id}>{d.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>For</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Gift</TableHead>
                <TableHead>Hand-over</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.donations.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No donations yet</TableCell></TableRow>
              )}
              {data?.donations.map((d) => (
                <TableRow key={d._id}>
                  <TableCell className="whitespace-nowrap">{formatDisplayDate(d.createdAt)}</TableCell>
                  <TableCell>
                    <p className="font-medium">{d.donor.name} {d.isGuest && <Badge variant="outline" className="ml-1 text-[10px]">Guest</Badge>}</p>
                    <p className="text-xs text-muted-foreground">{[d.donor.email, d.donor.phone].filter(Boolean).join(" · ")}</p>
                  </TableCell>
                  <TableCell>{d.eventId?.title ?? "Club donation"}</TableCell>
                  <TableCell><Badge variant="secondary">{d.kind === "monetary" ? "Money · Paid" : "Items · Pledged"}</Badge></TableCell>
                  <TableCell>
                    {d.kind === "monetary"
                      ? <span className="font-medium">{money(d.amount ?? 0, d.currency)}</span>
                      : d.items?.map((i) => `${i.quantity} × ${i.name}`).join(", ")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {d.dropOffMethod ? HANDOVER[d.dropOffMethod] : "—"}
                    {d.pickupAddress && <p className="text-xs text-muted-foreground">{d.pickupAddress}</p>}
                    {d.preferredSlot && <p className="text-xs text-muted-foreground">{WEEKDAYS[d.preferredSlot.day]} {d.preferredSlot.time}</p>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
