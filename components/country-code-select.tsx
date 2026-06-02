"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { COUNTRY_DIAL_CODES, countryCodeLabel } from "@/lib/countryCodes"

type CountryCodeSelectProps = {
  id?: string
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  /** Dark glass styling for public login pages */
  variant?: "default" | "login"
  className?: string
}

export function CountryCodeSelect({
  id,
  value,
  onValueChange,
  disabled,
  variant = "default",
  className,
}: CountryCodeSelectProps) {
  const resolved = (COUNTRY_DIAL_CODES as readonly string[]).includes(value) ? value : "+91"

  return (
    <Select value={resolved} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        className={cn(
          variant === "login" &&
            "h-10 bg-white/10 border-white/20 text-white focus:ring-2 focus:ring-sky-400 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed [&>span]:text-white",
          className
        )}
      >
        <SelectValue placeholder="+91" />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {COUNTRY_DIAL_CODES.map((code) => (
          <SelectItem key={code} value={code}>
            {countryCodeLabel(code)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
