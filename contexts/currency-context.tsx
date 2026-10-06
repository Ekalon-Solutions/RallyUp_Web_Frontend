"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { apiClient } from "@/lib/api"
import {
  applyCheckoutLockToSession,
  DEFAULT_DISPLAY_SESSION,
  formatMoney as formatMoneyRaw,
  getDisplayCurrencySession,
  readCheckoutCurrencyLock,
  readGuestPreferredCurrency,
  setDisplayCurrencySession,
  snapshotCheckoutLock,
  subscribeDisplayCurrency,
  writeCheckoutCurrencyLock,
  writeGuestPreferredCurrency,
  type DisplayCurrencySession,
  type SupportedCurrencyOption,
} from "@/lib/display-currency"

type CurrencyContextValue = {
  session: DisplayCurrencySession
  currency: string
  locale: string
  source: DisplayCurrencySession["source"]
  locked: boolean
  supported: SupportedCurrencyOption[]
  preferredCurrency: string | null
  formatMoney: (amount: number, sourceCurrency?: string) => string
  setPreferredCurrency: (code: string | null) => Promise<void>
  acquireCheckoutLock: () => void
  releaseCheckoutLock: () => void
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined)

function clientHints() {
  if (typeof window === "undefined") {
    return { timezone: undefined as string | undefined, locale: undefined as string | undefined }
  }
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language,
  }
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const { items } = useCart()
  const [session, setSession] = useState<DisplayCurrencySession>(DEFAULT_DISPLAY_SESSION)
  const checkoutHoldCount = useRef(0)
  const [checkoutHeld, setCheckoutHeld] = useState(false)
  const merchCartActive = items.length > 0
  const lockActive = merchCartActive || checkoutHeld

  const publish = useCallback((next: DisplayCurrencySession) => {
    setDisplayCurrencySession(next)
    setSession(next)
  }, [])

  const refresh = useCallback(async () => {
    const hints = clientHints()
    const guestPref = isAuthenticated ? null : readGuestPreferredCurrency()
    const accountPref = isAuthenticated
      ? ((user as { preferredCurrency?: string | null } | null)?.preferredCurrency ?? null)
      : guestPref
    const detected = await apiClient.getCurrencySession({
      timezone: hints.timezone,
      locale: hints.locale,
      preferred: guestPref || undefined,
    })
    const existingLock = readCheckoutCurrencyLock()
    if (existingLock) {
      publish(applyCheckoutLockToSession({ ...detected, preferredCurrency: accountPref }, existingLock))
      return
    }
    publish({ ...detected, preferredCurrency: accountPref, locked: false })
  }, [isAuthenticated, publish, user])

  useEffect(() => {
    void refresh()
  }, [refresh, user?._id])

  useEffect(() => {
    return subscribeDisplayCurrency(() => {
      setSession(getDisplayCurrencySession())
    })
  }, [])

  useEffect(() => {
    if (lockActive) {
      const current = getDisplayCurrencySession()
      if (!readCheckoutCurrencyLock()) {
        writeCheckoutCurrencyLock(snapshotCheckoutLock(current))
      }
      if (!current.locked) {
        publish(applyCheckoutLockToSession(current, readCheckoutCurrencyLock()))
      }
      return
    }
    if (readCheckoutCurrencyLock()) {
      writeCheckoutCurrencyLock(null)
      void refresh()
    }
  }, [lockActive, publish, refresh])

  const acquireCheckoutLock = useCallback(() => {
    checkoutHoldCount.current += 1
    setCheckoutHeld(true)
    const current = getDisplayCurrencySession()
    if (!readCheckoutCurrencyLock()) {
      writeCheckoutCurrencyLock(snapshotCheckoutLock(current))
    }
    publish(applyCheckoutLockToSession(current, readCheckoutCurrencyLock()))
  }, [publish])

  const releaseCheckoutLock = useCallback(() => {
    checkoutHoldCount.current = Math.max(0, checkoutHoldCount.current - 1)
    if (checkoutHoldCount.current === 0) {
      setCheckoutHeld(false)
    }
  }, [])

  const setPreferredCurrency = useCallback(
    async (code: string | null) => {
      if (getDisplayCurrencySession().locked) return
      writeGuestPreferredCurrency(code)
      if (isAuthenticated) {
        await apiClient.setCurrencyPreference(code)
      }
      await refresh()
    },
    [isAuthenticated, refresh]
  )

  const formatMoney = useCallback(
    (amount: number, sourceCurrency?: string) => formatMoneyRaw(amount, sourceCurrency, { session }),
    [session]
  )

  const value = useMemo<CurrencyContextValue>(
    () => ({
      session,
      currency: session.currency,
      locale: session.locale,
      source: session.source,
      locked: session.locked,
      supported: session.supported,
      preferredCurrency: session.preferredCurrency,
      formatMoney,
      setPreferredCurrency,
      acquireCheckoutLock,
      releaseCheckoutLock,
    }),
    [acquireCheckoutLock, formatMoney, releaseCheckoutLock, session, setPreferredCurrency]
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    return {
      session: getDisplayCurrencySession(),
      currency: getDisplayCurrencySession().currency,
      locale: getDisplayCurrencySession().locale,
      source: getDisplayCurrencySession().source,
      locked: getDisplayCurrencySession().locked,
      supported: getDisplayCurrencySession().supported,
      preferredCurrency: getDisplayCurrencySession().preferredCurrency,
      formatMoney: (amount: number, sourceCurrency?: string) => formatMoneyRaw(amount, sourceCurrency),
      setPreferredCurrency: async () => undefined,
      acquireCheckoutLock: () => undefined,
      releaseCheckoutLock: () => undefined,
    } satisfies CurrencyContextValue
  }
  return ctx
}

/** Hold the display currency while a ticket/membership checkout UI is open. */
export function useCheckoutCurrencyLock(active: boolean) {
  const { acquireCheckoutLock, releaseCheckoutLock } = useCurrency()
  useEffect(() => {
    if (!active) return
    acquireCheckoutLock()
    return () => releaseCheckoutLock()
  }, [active, acquireCheckoutLock, releaseCheckoutLock])
}
