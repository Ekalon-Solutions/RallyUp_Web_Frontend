// components/LoginModal.tsx
"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Mail, Phone, X } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
}

const labelClass =
  "font-['SF_Compact',_sans-serif] text-[0.75rem] font-[556] uppercase leading-[1rem] tracking-[0.06em] text-[#E5E2E1]"

const fieldClass =
  "flex h-[3.375rem] items-center gap-[0.75rem] rounded-[0.75rem] border border-white/15 bg-transparent px-[1rem] " +
  "transition-colors duration-300 ease-in-out focus-within:border-[#A8E8FF] hover:border-[#A8E8FF]/60"

const inputClass =
  "w-full min-w-0 bg-transparent font-['SF_Compact',_sans-serif] text-[0.875rem] font-[457] text-white " +
  "placeholder:text-[#859398] focus:outline-none"

export default function LoginModal({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => setMounted(true), [])

  // Close on Escape + lock background scroll while open
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-[1rem] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Login or sign up"
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto w-full max-w-[27.375rem] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#050505] shadow-[0_0_2.5rem_0_#00D4FF1A]"
      >
        {/* Header */}
        <div className="relative flex flex-col items-center border-b border-white/10 bg-[#0A0A0A] px-[1.5rem] pb-[1rem] pt-[1.25rem]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute left-[1.25rem] top-[1.25rem] flex h-[1.5rem] w-[1.5rem] items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:bg-white/10"
          >
            <X className="h-[0.75rem] w-[0.75rem]" />
          </button>

          <div className="flex items-center gap-[0.375rem] self-end">
            <span className="font-['SF_Compact',_sans-serif] text-[0.625rem] font-[556] text-white">
              Powered By
            </span>
            {/* Replace with your "powered by" icon */}
            <img src="/new-wingman/icons/powered-by.svg" alt="" className="h-[1rem] w-[1rem]" />
          </div>

          <div className="mt-[0.25rem] flex items-center gap-[0.5rem]">
            {/* Replace with your lion logo */}
            <img src="/new-wingman/icons/lion.svg" alt="" className="h-[2rem] w-[2rem]" />
            <span className="bg-gradient-to-r from-[#A8E8FF] to-[#DFB7FF] bg-clip-text font-sf text-[1.5rem] font-[700] leading-[2rem] text-transparent">
              Wingman Pro
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col px-[1.5rem] pb-[2rem] pt-[1.5rem]">
          <h2 className="bg-gradient-to-r from-[#A8E8FF] to-[#DFB7FF] bg-clip-text font-sf text-[1.5rem] font-[700] leading-[2rem] text-transparent self-start">
            Welcome, Champ!
          </h2>
          <p className="mt-[0.5rem] font-['SF_Compact',_sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-[#E5E2E1]">
            Login made easy! Enter your details and we&apos;ll send you a secure OTP.
          </p>

          {/* Email */}
          <label className={`${labelClass} mt-[1.5rem]`} htmlFor="login-email">
            Email
          </label>
          <div className={`${fieldClass} mt-[0.5rem]`}>
            <Mail className="h-[1.25rem] w-[1.25rem] shrink-0 text-[#859398]" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={inputClass}
            />
          </div>

          {/* OR divider */}
          <div className="my-[1.5rem] flex items-center gap-[0.75rem]">
            <div className="h-px flex-1 bg-[#6CABDD]/40" />
            <span className="font-['SF_Compact',_sans-serif] text-[0.75rem] font-[556] text-white">OR</span>
            <div className="h-px flex-1 bg-[#6CABDD]/40" />
          </div>

          {/* Phone */}
          <div className="flex gap-[0.75rem]">
            <div className="flex flex-col">
              <span className={labelClass}>Country code</span>
              <div className={`${fieldClass} mt-[0.5rem] w-[6.25rem] justify-center px-[0.75rem]`}>
                <Phone className="h-[1.125rem] w-[1.125rem] shrink-0 text-[#BBC9CF]" />
                <span className="font-['SF_Compact',_sans-serif] text-[0.875rem] font-[457] text-white">+91</span>
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <label className={labelClass} htmlFor="login-phone">
                Phone number
              </label>
              <div className={`${fieldClass} mt-[0.5rem]`}>
                <Phone className="h-[1.125rem] w-[1.125rem] shrink-0 text-[#859398]" />
                <input
                  id="login-phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter your phone number"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Send OTP */}
          <button
            type="button"
            className="relative isolate mt-[2rem] flex h-[3.25rem] w-full items-center justify-center gap-[0.5rem] rounded-[0.75rem] bg-[linear-gradient(90deg,#00D4FF_0%,#9D05FF_100%)] font-sf-compact text-[0.875rem] font-[700] text-white before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[linear-gradient(90deg,#85B7F6_0%,#BE73FF_100%)] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100"
          >
            Send OTP
            <Phone className="h-[1rem] w-[1rem]" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}