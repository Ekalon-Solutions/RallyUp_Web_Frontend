// components/LoginModal.tsx
"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Mail, Phone, X } from "lucide-react"
import Button from "@/components/ui/button"
import Image from "next/image"
import SvgIcon from "../svg-icon"

type Props = {
    open: boolean
    onClose: () => void
}

const labelClass =
    "font-['Poppins',_sans-serif] text-[0.75rem] font-[600] uppercase leading-none tracking-normal text-[#E5E7EB]"

const fieldClass =
    "flex h-[3rem] sm:h-[3.375rem] items-center gap-[0.625rem] rounded-[0.75rem] border-[0.5px] border-[#4B5563] bg-[#000000] px-[0.875rem] sm:px-[1rem] " +
    "transition-colors duration-300 ease-in-out focus-within:border-[#A8E8FF] hover:border-[#A8E8FF]/60"

const inputClass =
    "w-full min-w-0 bg-transparent font-['Poppins',_sans-serif] text-[0.75rem] font-[500] leading-none text-white " +
    "placeholder:font-['Poppins',_sans-serif] placeholder:text-[0.75rem] placeholder:font-[500] placeholder:text-[#9CA3AF] focus:outline-none"

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
                className="relative my-auto w-full max-w-[27.375rem] overflow-hidden rounded-[0.9375rem] border border-[#FFFFFF1F] bg-[#050505] shadow-[0_0_2.5rem_0_#00D4FF1A]"
            >
                {/* Header: 438x96 -> max-w-[27.375rem] min-h-[6rem] */}
                <div className="relative flex min-h-[6rem] flex-col items-center justify-end rounded-t-[0.9375rem] border-b border-[#FFFFFF1F] bg-[#050505CC] px-[1.25rem] pb-[0.625rem] pt-[2rem] shadow-[0_0.0625rem_0.125rem_0_#0000000A] backdrop-blur-[1.5rem]">
                    {/* Close button: 24x24, top 11px, left 20px, radius 12px */}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute left-[1.25rem] top-[0.6875rem] flex h-[1.5rem] w-[1.5rem] items-center justify-center rounded-[0.75rem] border border-[#3D3D3D] transition-colors hover:bg-white/10"
                    >
                        <SvgIcon
                            src="/new-wingman/icons/close.svg"
                            className="h-[0.75rem] w-[0.75rem] bg-white"
                        />
                    </button>

                    {/* Powered By: top right, 10px Poppins Medium, 15x15 icon */}

                    <div className="absolute right-[1.25rem] top-[0.875rem] flex items-center gap-[0.375rem]">
                        <span className="font-['Poppins',_sans-serif] text-[0.625rem] font-[500] leading-none text-[#E5E7EB]">
                            Powered By
                        </span>
                        <div className="relative h-[0.9375rem] w-[0.9375rem] shrink-0">
                            <Image
                                src="/new-wingman/icons/login-icon-1.png"
                                alt="Powered by"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>

                    {/* Brand Logo + Title: 54x54 icon + 20px SF Pro Bold */}
                    <div className="flex items-center gap-[0.25rem]">
                        <div className="relative h-[3.375rem] w-[3.375rem] shrink-0">
                            <Image
                                src="/new-wingman/icons/logo.svg"
                                alt="Wingman Pro logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className="align-middle font-['SF_Pro',_sans-serif] text-[1.25rem] font-[700] leading-[2.5rem] tracking-[-0.1rem] text-[#A8E8FF]">
                            Wingman Pro
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div className="relative flex flex-col px-[1.25rem] pb-[1.75rem] pt-[1.5rem] sm:px-[1.5rem] sm:pb-[2rem]">

                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -left-[5.0625rem] top-[0.375rem] h-[11.4375rem] w-[12.25rem] rounded-[7rem] bg-[#A8E8FF33] blur-[3.75rem]"
                    />
                    <h2 className="self-start bg-gradient-to-r from-[#A8E8FF] to-[#DFB7FF] bg-clip-text font-['Poppins',_sans-serif] text-[1.25rem] font-[700] leading-none text-transparent">
                        Welcome, Champ!
                    </h2>
                    <p className="mt-[0.5rem] font-['Poppins',_sans-serif] text-[0.75rem] font-[500] leading-[1.35] text-[#E5E7EB]">
                        Login made easy! Enter your details and we&apos;ll send you a secure OTP.
                    </p>

                    {/* Email */}
                    <label className={`${labelClass} mt-[1.5rem]`} htmlFor="login-email">
                        EMAIL
                    </label>
                    <div className={`${fieldClass} mt-[0.5rem]`}>
                        <SvgIcon
                            src="/new-wingman/icons/mail.svg"
                            className="h-[0.7625rem] w-[0.96875rem] shrink-0 bg-[#9CA3AF]"
                        />
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
                    <div className="my-[1.25rem] sm:my-[1.5rem] flex items-center gap-[0.75rem]">
                        <div className="h-px flex-1 bg-[#4B5563]" />
                        <span className="font-['Poppins',_sans-serif] text-[0.75rem] font-[600] leading-none text-[#E5E7EB]">
                            OR
                        </span>
                        <div className="h-px flex-1 bg-[#4B5563]" />
                    </div>

                    {/* Phone */}
                    <div className="flex gap-[0.625rem] sm:gap-[0.75rem]">
                        <div className="flex shrink-0 flex-col">
                            <span className={labelClass}>COUNTRY CODE</span>
                            <div className={`${fieldClass} mt-[0.5rem] w-[5.75rem] sm:w-[6.25rem] justify-center px-[0.625rem] sm:px-[0.75rem]`}>
                                <SvgIcon
                                    src="/new-wingman/icons/phone.svg"
                                    className="h-[0.875rem] w-[0.875rem] shrink-0 bg-[#9CA3AF]"
                                />
                                <span className="font-['Poppins',_sans-serif] text-[0.75rem] font-[500] leading-none text-white">
                                    +91
                                </span>
                            </div>
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                            <label className={labelClass} htmlFor="login-phone">
                                PHONE NUMBER
                            </label>
                            <div className={`${fieldClass} mt-[0.5rem]`}>
                                <SvgIcon
                                    src="/new-wingman/icons/phone.svg"
                                    className="h-[0.9375rem] w-[0.9375rem] shrink-0 bg-white"
                                />
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

                    {/* Send OTP (Primary Button) */}
                    <Button
                        type="button"
                        variant="primary"
                        className="mt-[1.75rem] sm:mt-[2rem] h-[3rem] sm:h-[3.25rem] w-full gap-[0.5rem] !font-['Poppins',_sans-serif] !text-[0.875rem] !font-[600]"
                    >
                        Send OTP
                        {/* <Phone className="h-[0.9375rem] w-[0.9375rem]" /> */}
                        <SvgIcon
                            src="/new-wingman/icons/phone.svg"
                            className="h-[0.9375rem] w-[0.9375rem] shrink-0 bg-white"
                        />
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    )
}