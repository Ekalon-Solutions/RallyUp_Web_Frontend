"use client"

import { Globe } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCurrency } from "@/contexts/currency-context"

const AUTO = "AUTO"

export function CurrencyPreferenceCard() {
  const { session, preferredCurrency, locked, supported, setPreferredCurrency, source } = useCurrency()
  const value = preferredCurrency || AUTO
  const sourceLabel =
    source === "override"
      ? "your saved preference"
      : source === "profile"
        ? "your profile country"
        : source === "ip"
          ? "your current location"
          : source === "phone"
            ? "your phone country"
            : source === "timezone" || source === "locale"
              ? "your device locale"
              : "the platform default (INR)"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Display currency
        </CardTitle>
        <CardDescription>
          Prices and fees are shown in this currency. Checkout collects USD, EUR, or GBP when
          Razorpay international payments are enabled; other currencies fall back to INR. Auto uses{" "}
          {sourceLabel}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="display-currency">Currency</Label>
        <Select
          value={value}
          onValueChange={(next) => {
            void setPreferredCurrency(next === AUTO ? null : next)
          }}
          disabled={locked}
        >
          <SelectTrigger id="display-currency">
            <SelectValue placeholder="Auto-detect" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AUTO}>
              Auto — {session.currency} ({session.locale})
            </SelectItem>
            {supported.map((option) => (
              <SelectItem key={option.code} value={option.code}>
                {option.code} — {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {locked ? (
          <p className="text-sm text-muted-foreground">
            Currency is locked while a cart or checkout is in progress so totals do not jump if your
            location changes.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Showing amounts as {session.currency}.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
