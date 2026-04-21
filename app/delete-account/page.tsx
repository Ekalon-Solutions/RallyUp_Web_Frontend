import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { DataDeletionRequestForm } from "./data-deletion-request-form"

export const metadata = {
    title: "Data Deletion & Privacy Request",
    description:
        "Request permanent deletion of your Wingman Pro account and data, or request a copy of your data. Public form; no login required.",
}

export default function DeleteAccountPage(): React.JSX.Element {
    return (
        <main className="min-h-screen bg-white text-background relative overflow-x-hidden">
            <SiteNavbar />
            <div className="bg-secondary-purple/40 px-4 py-16 relative z-10">
                <div className="max-w-xl mx-auto">
                    <div className="absolute inset-0 -z-10" />
                    <div className="absolute -bottom-8 -left-10 w-80 h-80 opacity-60 pointer-events-none select-none">
                        <Image src="/Vector.svg" alt="" fill className="object-contain" />
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-primary/20 mb-6 animate-scale-in">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                        <span className="text-[10px] font-medium leading-[14px] text-primary uppercase tracking-normal">Data Deletion</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold z-10 relative mb-4">Data Deletion &amp; Privacy Request</h1>
                    <p className="text-secondary leading-relaxed mb-10">
                        At Wingman Pro, you are in control of your data. Use this form to request the permanent deletion of your
                        account and personal information from our systems. Once processed, this action cannot be undone.
                    </p>

                    <div className="border rounded-[20px] border-border bg-white/80 shadow-sm /10 /30">
                        <DataDeletionRequestForm />
                    </div>

                    <p className="mt-8 text-sm text-secondary leading-relaxed">
                        No phone call or postal mail is required. If you need help, you can still reach us at{""}
                        <a className="underline text-primary" href="mailto:support@wingmanpro.tech">
                            support@wingmanpro.tech
                        </a>
                        .
                    </p>

                    <div className="mt-8">
                        <Link href="/privacy" className="text-primary hover:text-primary">
                            Privacy Policy
                        </Link>
                    </div>
                </div>
            </div>
            <SiteFooter />
            <ScrollToTop />
        </main>
    )
}
