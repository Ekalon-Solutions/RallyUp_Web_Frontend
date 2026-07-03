"use client"

/**
 * SystemOwnerClubFilter
 *
 * A self-contained club scope dropdown rendered exclusively for System Owner users.
 * Admins, Financial Admins, and Super Admins never see this component.
 *
 * Behaviour:
 *   - "All Clubs" → selectedClubId = null → backend uses all-clubs scope
 *   - Selecting a club → selectedClubId = "<id>" → backend uses club scope
 *   - Selection is session-persisted via useSystemOwnerReportScope
 *
 * Usage in a report page:
 *   const { selectedClubId, setSelectedClubId, isSystemOwner } = useSystemOwnerReportScope()
 *
 *   {isSystemOwner && (
 *     <SystemOwnerClubFilter
 *       selectedClubId={selectedClubId}
 *       onChange={setSelectedClubId}
 *     />
 *   )}
 */

import { Building2, Globe } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSystemOwnerClubs } from "@/hooks/useSystemOwnerClubs"

interface SystemOwnerClubFilterProps {
  /** Currently selected club ID, or null for "All Clubs" */
  selectedClubId: string | null
  /** Called with the new clubId, or null when "All Clubs" is selected */
  onChange: (clubId: string | null) => void
}

export function SystemOwnerClubFilter({
  selectedClubId,
  onChange,
}: SystemOwnerClubFilterProps) {
  const { clubs, loading } = useSystemOwnerClubs()

  const handleChange = (value: string) => {
    onChange(value === "__all__" ? null : value)
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Globe className="w-3 h-3" />
        Club Scope
      </Label>
      <Select
        value={selectedClubId ?? "__all__"}
        onValueChange={handleChange}
        disabled={loading}
      >
        <SelectTrigger className="w-52 border-primary/30 bg-primary/5">
          <Building2 className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
          <SelectValue placeholder="All Clubs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">
            <span className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              All Clubs
            </span>
          </SelectItem>
          {clubs.map((club) => (
            <SelectItem key={club.id} value={club.id}>
              <span className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                {club.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
