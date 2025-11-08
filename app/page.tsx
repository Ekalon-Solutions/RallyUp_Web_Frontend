"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Users, Trophy, Building2, CalendarDays, MapPin, Ticket } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"

function Hero() {
  const marqueeLogos = [
    { src: "/WingmanPro Logo (White BG).svg", alt: "Wingman Pro" },
    { src: "/WingmanPro Logo (Chalk BG).svg", alt: "Wingman Pro Chalk" },
    { src: "/RallyUpSolutions Logo (WhiteBackground).svg", alt: "RallyUp Solutions" },
    { src: "/RallyUpSolutions Logo (Transparent Background).svg", alt: "RallyUp Solutions Transparent" },
  ]

  return (
    <section className="relative overflow-hidden" id="home">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,#38bdf81f,transparent_35%),radial-gradient(circle_at_80%_20%,#60a5fa1f,transparent_35%),radial-gradient(circle_at_50%_80%,#38bdf81a,transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
                    </div>
      <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative h-12 w-44 sm:h-14 sm:w-56">
                <Image
                  src="/WingmanPro Logo (Chalk BG).svg"
                  alt="Wingman Pro logo"
                  fill
                  sizes="(max-width: 640px) 176px, 224px"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="relative h-10 w-44 sm:h-12 sm:w-52">
                <Image
                  src="/RallyUpSolutions Logo (WhiteBackground).svg"
                  alt="RallyUp Solutions logo"
                  fill
                  sizes="(max-width: 640px) 176px, 208px"
                  className="object-contain"
                />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-sky-200">
              <Sparkles className="h-3.5 w-3.5" />
              Built for Supporter Communities
                          </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Where supporters go<br />to power matchday
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
              100 moving parts. 1 platform. Everything you need to run a football supporters group—so you can have a pint and watch the match.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/clubs">
                <Button size="lg" className="h-12 px-6 bg-sky-400 text-slate-900 hover:bg-sky-300">Get Started</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-12 px-6 border-white/20 bg-white/5 text-white hover:bg-white/10">Log in</Button>
              </Link>
                        </div>
             <div className="flex items-center gap-6 pt-2 text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2"><Users className="h-5 w-5 text-sky-500 dark:text-sky-300" /><span>Community-first</span></div>
              <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-sky-500 dark:text-sky-300" /><span>Gamified</span></div>
              <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-sky-500 dark:text-sky-300" /><span>Club-grade tools</span></div>
                          </div>
                          </div>
          <div className="relative">
            <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white p-6 shadow-2xl dark:bg-gradient-to-br dark:from-slate-900/60 dark:to-blue-900/50 animate-in fade-in-50 slide-in-from-right-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {[{src:"/placeholder.jpg", alt:"Fans cheering"},{src:"/placeholder.jpg", alt:"Club tifo"},{src:"/placeholder.jpg", alt:"Merch table"},{src:"/placeholder.jpg", alt:"Away day bus"}].map((img,idx)=> (
                  <div key={idx} className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5">
                    <img src={img.src} alt={img.alt} className="h-32 w-full object-cover opacity-95 hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 hidden dark:block bg-gradient-to-t from-slate-950/60 to-transparent" />
                        </div>
                ))}
                          </div>
                        </div>
                            </div>
                          </div>
                            </div>
      {/* Marquee */}
      <div className="border-y border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Trusted by spirited clubs</div>
          <div className="overflow-hidden">
            <div className="marquee flex items-center gap-12 opacity-80">
              {Array.from({ length: 4 }).flatMap(() => marqueeLogos).map((logo, index) => (
                <div key={`${logo.alt}-${index}`} className="relative h-8 w-36">
                  <Image
                    src={logo.src}
                    alt={`${logo.alt} partner logo`}
                    fill
                    sizes="144px"
                    className="object-contain opacity-80 hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}
                          </div>
                        </div>
                          </div>
                          </div>
    </section>
  )
}

function Features() {
  const items = [
    { title: "Create and manage clubs", desc: "Launch new supporter clubs with branding, roles, and permissions.", icon: Building2 },
    { title: "Monetize with merch", desc: "Built-in store and checkout to sell official merchandise.", icon: Trophy },
    { title: "Engage with polls", desc: "Run interactive polls and display live results instantly.", icon: Sparkles },
  ]
  return (
    <section className="mx-auto max-w-7xl px-4 py-16" id="platform">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">The Platform</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((it, i) => (
          <Card key={i} className="bg-white border-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 transition-colors animate-in fade-in-50 slide-in-from-bottom-6">
            <CardHeader className="flex flex-row items-center gap-3">
              {React.createElement(it.icon, { className: "h-5 w-5 text-sky-600 dark:text-sky-300" })}
              <CardTitle className="text-slate-900 dark:text-white text-base">{it.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{it.desc}</CardContent>
          </Card>
        ))}
                        </div>
    </section>
  )
}

function Showcase() {
  const tiles = [
    { title: "Matchdays", caption: "Screenings & stadium trips", img: "/placeholder.jpg" },
    { title: "Chants", caption: "Sing it loud together", img: "/placeholder.jpg" },
    { title: "Merch", caption: "Kits, scarves, badges", img: "/placeholder.jpg" },
    { title: "Community", caption: "Volunteer & give back", img: "/placeholder.jpg" },
  ]
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:py-12" id="features">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">100 Moving Parts. 1 Platform.</h2>
      <p className="text-slate-700 dark:text-slate-300 mb-6 max-w-3xl">Everything you need to run a football supporters group. Member management, your website, merch, events, tickets and more—integrated and simplified.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t, i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5">
            <img src={t.img} alt={t.title} className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 hidden dark:block bg-gradient-to-t from-slate-950/70 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <div className="text-slate-900 dark:text-white font-semibold">{t.title}</div>
              <div className="text-slate-700 dark:text-slate-300 text-sm">{t.caption}</div>
                        </div>
                          </div>
        ))}
                          </div>
    </section>
  )
}

function EventsPreview() {
  const events = [
    { title: "Derby Day Screening", date: "Nov 12", where: "City Arena", cta: "Get Tickets" },
    { title: "Away Day: Bengaluru", date: "Dec 03", where: "Departure: 6 AM", cta: "Reserve Seat" },
    { title: "Annual Fan Meet", date: "Jan 18", where: "Clubhouse", cta: "RSVP" },
  ]
  return (
    <section className="mx-auto max-w-7xl px-4 py-12" id="groups">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Upcoming Highlights</h2>
        <Link href="/events" className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200 text-sm">View all</Link>
                        </div>
      <div className="grid md:grid-cols-3 gap-6">
        {events.map((e, i) => (
          <Card key={i} className="bg-white border-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 transition-colors animate-in fade-in-50 slide-in-from-bottom-6">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300 text-sm">
                <CalendarDays className="h-4 w-4" />
                <span>{e.date}</span>
                          </div>
              <CardTitle className="text-slate-900 dark:text-white text-lg">{e.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-sm">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400" />{e.where}</div>
              <Button size="sm" className="bg-sky-600 text-white hover:bg-sky-500 dark:bg-sky-400 dark:text-slate-900 dark:hover:bg-sky-300">
                <Ticket className="h-4 w-4 mr-1" /> {e.cta}
                        </Button>
            </CardContent>
          </Card>
        ))}
                      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-sky-500/10 p-8 md:p-10 text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Ready to rally your supporters?</h3>
        <p className="text-slate-700 dark:text-slate-300 mt-2">Launch your fan club hub in minutes and start your next matchday right.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/clubs"><Button className="bg-sky-600 text-white hover:bg-sky-500 dark:bg-sky-400 dark:text-slate-900 dark:hover:bg-sky-300">Create a Club</Button></Link>
          <Link href="/login"><Button variant="outline" className="border-slate-300 dark:border-white/20 bg-white text-slate-900 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">Sign in</Button></Link>
                    </div>
                      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white">
      <SiteNavbar brandName="Wingman Pro" />
      <FadeIn>
        <Hero />
      </FadeIn>
      <FadeIn>
        <Features />
      </FadeIn>
      <FadeIn>
        <Showcase />
      </FadeIn>
      <FadeIn>
        <EventsPreview />
      </FadeIn>
      
      <FadeIn>
        <CTA />
      </FadeIn>
      <SiteFooter brandName="Wingman Pro" />
      <ScrollToTop />
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee {
          width: max-content;
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  )
}
