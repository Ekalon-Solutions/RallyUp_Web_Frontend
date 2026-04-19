"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, ArrowRight, Calendar, LayoutGrid, BarChart2, Volume2, ShoppingCart, Images, Play, SlidersHorizontal, Music, Video, ShoppingBag, Smartphone, ClipboardList } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"
import { JellyCursor } from "@/components/jelly-cursor"

const LOGO_FRAMES = [
  "/wingmanlogo/Property 1=Default.svg",
  "/wingmanlogo/Property 1=Default (1).svg",
  "/wingmanlogo/Property 1=Default (2).svg",
  "/wingmanlogo/Property 1=Default (3).svg",
  "/wingmanlogo/Property 1=Default (4).svg",
]

function AnimatedLogo() {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % LOGO_FRAMES.length), 400)
    return () => clearInterval(id)
  }, [])

  return (
    <Image
      src={LOGO_FRAMES[frame]}
      alt="Wingman Pro"
      fill
      className="object-contain"
      priority
    />
  )
}

function Hero() {
  return (
    <section className="bg-white relative overflow-hidden" id="home">

      {/* ── Mobile layout ── */}
      <div className="lg:hidden">
        {/* Full-width dark image section with sweeping curved bottom */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: "calc(80vw + 24px)" }}
        >
          {/* Dark layer — stops 24px from bottom so box-shadow is visible at right edge */}
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              bottom: "24px",
              background: "linear-gradient(128deg, #1e1e1e 41.5%, #3a3a3a 98.5%)",
              borderBottomLeftRadius: "100% 75%",
              boxShadow: "0 18px 0 0 #f1441a",
            }}
          />
          {/* Ram illustration — right-aligned */}
          <div className="absolute top-0 right-0 h-[80%] w-[75%] z-10">
            <Image
              src={LOGO_FRAMES[0]}
              alt="Wingman Pro"
              fill
              className="object-contain object-right-top mt-5"
              priority
            />
          </div>
        </div>

        {/* Text content below */}
        <div className="px-5 py-7 space-y-5 bg-white">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-[#e18f67]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#e18f67] flex-shrink-0" />
            <span className="text-[#e18f67] text-[10px] font-medium leading-tight">
              Club Management platform
            </span>
          </div>

          <h1 className="text-3xl font-bold text-background leading-tight">
            Don&apos;t Just Run Your Club.{" "}
            <span className="text-primary">Revolutionize.</span>
          </h1>

          <p className="text-background text-base leading-relaxed">
            One platform for membership, ticketing, payments and fan engagement.
          </p>

          <div className="flex flex-row items-center gap-3 pt-1">
            <Link href="/contact">
              <Button
                variant="default"
                className="px-4 h-8 text-white font-medium text-xs rounded-[5px] uppercase tracking-wider"
              >
                Book a Demo
              </Button>
            </Link>
            <Link href="#features">
              <Button
                variant="outline"
                className="px-4 h-8 border font-medium text-xs rounded-[5px] uppercase tracking-wider flex items-center gap-2"
              >
                Explore Features
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:block">
        <div className="mx-auto py-8 lg:py-15 pl-5">
          <div className="grid lg:grid-cols-[3fr_3fr] gap-0 items-center">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-[#e18f67]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#e18f67] flex-shrink-0" />
                <span className="text-[#e18f67] text-[10px] font-medium leading-tight">
                  The first AI-powered platform for Supporter Groups and Sports Clubs.
                </span>
              </div>

              <h1 className="text-5xl font-bold text-background leading-tight">
                Don&apos;t Just Run Your Club.{" "}
                <span className="text-primary">Revolutionize.</span>
              </h1>

              <p className="text-background text-xl leading-relaxed max-w-lg">
                One platform for membership, ticketing, payments and fan engagement.
              </p>

              <div className="flex flex-row items-center gap-4 pt-2">
                <Link href="/contact">
                  <Button
                    variant="default"
                    className="px-8 h-10 text-white font-medium text-xs rounded-[5px] uppercase tracking-wider"
                  >
                    Book a Demo
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    variant="outline"
                    className="px-8 h-10 border font-medium text-xs rounded-[5px] uppercase tracking-wider flex items-center gap-2"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    Explore Features
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column — decorated image */}
            <div className="relative h-[65vh] xl:h-[70vh]">
              <div className="absolute top-0 right-0 w-[110%] h-[90%] bg-primary rounded-[20px]" />
              <div
                className="absolute top-[6%] right-[0%] w-[105%] h-[92%] rounded-l-[20px]"
                style={{ background: "linear-gradient(128deg, #222 41.5%, #434242 98.5%)" }}
              />
              <div className="absolute top-[8%] right-[4%] w-[100%] h-[88%] z-10">
                <AnimatedLogo />
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}

type FeatureTab = "feed" | "events" | "leaderboard" | "chants" | "merch" | "gallery"

const tabConfig: Array<{
  id: FeatureTab
  label: string
  Icon: React.ComponentType<{ className?: string }>
  headline: [string, string]
  sub: string
  cards: Array<{ Icon: React.ComponentType<{ className?: string }>; title: string; desc: string; accent: string }>
}> = [
    {
      id: "feed",
      label: "Feed",
      Icon: LayoutGrid,
      headline: ["Your Club.", "All in One Place."],
      sub: "Track matches, manage members, vote, and stay updated — all in one dashboard.",
      cards: [
        { Icon: Play, title: "Live Fixtures & League Table", desc: "Stay on top of upcoming matches across all competitions and check your team's standing in real time.", accent: "bg-[hsl(var(--wingman-green))]" },
        { Icon: Calendar, title: "Events, Polls & Membership", desc: "Join fan screenings, vote on club decisions and manage your membership — all from one place.", accent: "bg-[hsl(var(--wingman-purple-light))]" },
      ],
    },
    {
      id: "events",
      label: "Events",
      Icon: Calendar,
      headline: ["Don't Miss", "A Single Moment."],
      sub: "Browse screenings, CSR drives, and meetups — search, register, and relive events in one place.",
      cards: [
        { Icon: SlidersHorizontal, title: "Search & Filter Events", desc: "Find exactly what you're looking for — filter by category, date or type and register in seconds.", accent: "bg-[hsl(var(--wingman-green))]" },
        { Icon: Calendar, title: "Ongoing, Upcoming & Past", desc: "See what's live right now, what's coming up next and revisit every event your club has hosted.", accent: "bg-[hsl(var(--wingman-purple-light))]" },
      ],
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      Icon: BarChart2,
      headline: ["Compete.", "Climb the Ranks."],
      sub: "Attend more events, climb the ranks, and earn points with every show of loyalty.",
      cards: [
        { Icon: BarChart2, title: "Personal Ranking", desc: "Instantly see your current position, events attended and total points — all in one snapshot.", accent: "bg-[hsl(var(--wingman-green))]" },
        { Icon: ClipboardList, title: "Top Performers Board", desc: "See who's leading the pack across the club and fuel your drive to show up more.", accent: "bg-[hsl(var(--wingman-purple-light))]" },
      ],
    },
    {
      id: "chants",
      label: "Club Chants",
      Icon: Volume2,
      headline: ["Sing Loud.", "Know Every Word."],
      sub: "Songs, chants, and traditions — all in one place. Learn them and never stay silent again.",
      cards: [
        { Icon: Music, title: "Lyrics & Chant Library", desc: "Search and read the full text of every club chant — from match day anthems to terrace classics.", accent: "bg-[hsl(var(--wingman-green))]" },
        { Icon: Video, title: "Videos & Visual Guides", desc: "Watch embedded videos of chants in action so you can learn the rhythm, words and passion behind each one.", accent: "bg-[hsl(var(--wingman-purple-light))]" },
      ],
    },
    {
      id: "merch",
      label: "Merchandise",
      Icon: ShoppingCart,
      headline: ["Gear Up.", "Stand Out."],
      sub: "Official merch — scarves, bottles, collectibles, and more. Show the world where your heart belongs.",
      cards: [
        { Icon: ShoppingBag, title: "Apparel & Collectibles", desc: "From match day scarves and water bottles to limited-edition collectibles — gear for every kind of fan.", accent: "bg-[hsl(var(--wingman-green))]" },
        { Icon: SlidersHorizontal, title: "Search, Filter & Shop", desc: "Sort, filter, and spot featured items — find what you want fast before it's gone.", accent: "bg-[hsl(var(--wingman-purple-light))]" },
      ],
    },
    {
      id: "gallery",
      label: "Gallery",
      Icon: Images,
      headline: ["Every Moment.", "Saved Forever."],
      sub: "Relive your club's best moments — from matchdays to fan meetups, all in one place.",
      cards: [
        { Icon: Images, title: "Event Albums", desc: "All your club's media organised into albums — one folder per event, easy to find and browse.", accent: "bg-[hsl(var(--wingman-green))]" },
        { Icon: Smartphone, title: "Full Screen Viewing", desc: "Open any photo or media in full screen and relive the atmosphere like you were right there.", accent: "bg-[hsl(var(--wingman-purple-light))]" },
      ],
    },
  ]

function FeaturesShowcase() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setActiveIdx((i) => (i + 1) % tabConfig.length), 3000)
    return () => clearInterval(id)
  }, [paused])

  const active = tabConfig[activeIdx]

  return (
    <section
      className="bg-[hsl(var(--wingman-lavender))] py-14 md:py-20 lg:py-24"
      id="features"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Mobile layout ── */}
        <div className="lg:hidden space-y-5">
          {/* Headline */}
          <h2 className="text-4xl font-black leading-tight">
            <span className="text-[hsl(var(--wingman-navy))]">{active.headline[0]}</span>
            <br />
            <span className="text-primary">{active.headline[1]}</span>
          </h2>

          {/* Horizontal scrollable tab pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {tabConfig.map((tab, i) => {
              const Icon = tab.Icon
              const isActive = i === activeIdx
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveIdx(i)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex-shrink-0 ${isActive
                    ? "bg-secondary text-white border-secondary"
                    : "bg-white text-[#555] border-gray-200 hover:border-secondary"
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Content card */}
          <div className="bg-[hsl(var(--wingman-purple-muted))] rounded-[20px] p-4">
            <div className="bg-white/95 rounded-[14px] p-5 space-y-4">
              <div>
                <p className="text-primary font-bold text-base">{active.headline[0]}</p>
                <p className="text-[hsl(var(--wingman-navy))] font-black text-xl">{active.headline[1].toLowerCase()}</p>
                <p className="text-[#666] text-sm mt-1">{active.sub}</p>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-3">
                {active.cards.map((card, i) => {
                  const CardIcon = card.Icon
                  return (
                    <div key={i} className="bg-[hsl(var(--wingman-purple-wash))] rounded-xl flex items-center gap-3 px-4 py-3">
                      <div className={`${card.accent} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <CardIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-[hsl(var(--wingman-navy))] text-sm">{card.title}</p>
                        <p className="text-[#888] text-xs">{card.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Desktop layout ── */}
        <div className="hidden lg:grid lg:grid-cols-[260px_1fr] gap-8 items-stretch">
          {/* Left — vertical sidebar */}
          <div className="bg-white rounded-[20px] shadow-md overflow-hidden flex flex-col py-3">
            {tabConfig.map((tab, i) => {
              const Icon = tab.Icon
              const isActive = i === activeIdx
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveIdx(i)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold transition-all ${isActive ? "bg-[hsl(var(--wingman-purple-wash))] text-[hsl(var(--wingman-navy))]" : "text-[#444] hover:bg-gray-50"
                    }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-secondary" : "text-[#999]"}`} />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {isActive && <ArrowRight className="w-3.5 h-3.5 text-secondary" />}
                </button>
              )
            })}
          </div>

          {/* Right — content panel */}
          <div className="bg-[hsl(var(--wingman-purple-muted))] rounded-[24px] p-6 flex items-center">
            <div className="bg-white/95 rounded-[16px] w-full p-8 space-y-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-1 h-20 bg-secondary rounded-full flex-shrink-0 mt-1" />
                <h2 className="text-4xl font-black leading-tight">
                  <span className="text-[hsl(var(--wingman-navy))]">{active.headline[0]}</span>
                  <br />
                  <span className="text-primary">{active.headline[1]}</span>
                </h2>
              </div>
              <p className="text-[#555] text-base leading-relaxed">{active.sub}</p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                {active.cards.map((card, i) => {
                  const CardIcon = card.Icon
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`${card.accent} w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <CardIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-secondary text-sm mb-1">{card.title}</p>
                        <p className="text-[#777] text-xs leading-relaxed">{card.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

function ImageMarquee() {
  const images = [
    "courselclubslogo/afcb.svg",
    "courselclubslogo/cvflogo.svg",
    "courselclubslogo/evertonindia.svg",
    "courselclubslogo/juventusclub.svg",
    "courselclubslogo/nufc.svg",
  ]

  return (
    <section className="bg-secondary py-8 overflow-hidden">
      <div className="flex gap-6 animate-marquee whitespace-nowrap">
        {[...images, ...images].map((src, i) => (
          <div
            key={i}
            className="border-[6px] border-white rounded-[25px] flex-shrink-0 w-[180px] h-[180px] sm:w-[180px] sm:h-[180px] relative overflow-hidden"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="180px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function ContactCTA() {
  const [form, setForm] = useState({ name: "", email: "", topic: "Product Support", message: "" })
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section className="bg-white py-16 md:py-20 lg:py-24" id="contact">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">
          {/* Left */}
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight mb-3">
                <span className="text-background">Ready to</span>{" "}
                <span className="text-primary">Upgrade Your Club?</span>
              </h2>
              <p className="text-secondary text-lg leading-relaxed max-w-md">
                Book a consultation or join the wait-list. Takes two minutes.
              </p>
            </div>

            <div className="mt-auto border-t border-border/30 pt-8">
              <p className="text-secondary font-semibold text-base mb-1">Need urgent help?</p>
              <p className="text-[#888] text-sm">Contact your Sales POC directly for fastest resolution.</p>
            </div>
          </div>

          {/* Right — form */}
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl">✓</div>
              <p className="text-background font-bold text-xl">Thanks! We&apos;ll be in touch shortly.</p>
              <Button
                variant="outline"
                className="border border-secondary text-secondary hover:bg-secondary/10 rounded-[5px] text-xs font-medium uppercase tracking-wide"
                onClick={() => setSubmitted(false)}
              >
                Submit another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 bg-secondary/40 p-4 rounded-[10px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-secondary text-xs font-semibold">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full h-11 px-4 border rounded-[10px] text-xs placeholder-[#888] focus:outline-none focus:border-secondary bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-secondary text-xs font-semibold">Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full h-11 px-4 border rounded-[10px] text-xs placeholder-[#888] focus:outline-none focus:border-secondary bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-secondary text-xs font-semibold">Topic</label>
                <select
                  value={form.topic}
                  onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                  className="w-full h-11 px-4 border rounded-[10px] text-xs text-[#888] focus:outline-none focus:border-secondary appearance-none bg-white"
                >
                  <option>Product Support</option>
                  <option>Sales Inquiry</option>
                  <option>Partnership</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-secondary text-xs font-semibold">Message</label>
                <textarea
                  placeholder="Tell us what you need..."
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border rounded-[10px] text-xs text-[#888] placeholder-[#888] focus:outline-none focus:border-secondary resize-none bg-white"
                />
              </div>

              <div className="flex flex-col gap-3 pt-1">
                <Button
                  type="submit"
                  variant="secondary"
                  className="bg-secondary/50"
                >
                  Submit
                </Button>
                <Link href="/clubs" className="flex-1">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                  >
                    Join Waiting List
                  </Button>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

const faqs = [
  {
    q: "What is Wingman Pro?",
    a: "Wingman Pro is the world's first AI-enhanced platform built exclusively for Supporter Groups and Sports Clubs. It replaces spreadsheets, payment links, and chat groups with one powerful, secure operating system for membership management, ticketing, and fan engagement.",
  },
  {
    q: "Who is Wingman Pro designed for?",
    a: "Wingman Pro is built for supporter groups, fan clubs, and sports clubs of all sizes — from small local clubs to large national supporter networks.",
  },
  {
    q: "How do we get our current member data onto Wingman Pro?",
    a: "Our onboarding team will assist you in migrating existing member data securely. We support CSV imports and can guide you through the entire transition process.",
  },
  {
    q: "Can Wingman Pro handle our merchandise sales and ticketing?",
    a: "Yes! Wingman Pro includes a fully integrated commerce engine with real-time inventory, QR-code ready event ticketing, and one-click financial reporting.",
  },
  {
    q: "Is there an extra fee for payment processing?",
    a: "We offer transparent pricing with no hidden fees. Payment processing rates are competitive with no surprise charges. Contact us for a detailed breakdown.",
  },
  {
    q: "How is your club's data protected?",
    a: "We take data privacy seriously. Wingman Pro is built with GDPR and DPDPA compliance, bank-level encryption, and OTP-only secure login infrastructure.",
  },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-16 md:py-20 lg:py-24 relative overflow-hidden" id="faqs">
      <div className="absolute inset-0 bg-gradient-to-r from-white to-secondary/40 -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-center mb-12">
          <span className="text-background">Frequently Asked</span>{" "}
          <span className="text-primary">Questions</span>
        </h2>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className={`bg-gradient-to-r from-white to-secondary/60 border rounded-[20px] overflow-hidden ${open === i ? "bg-secondary/60 border-primary" : "border-secondary"}`}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
              >
                {open === i ? (<span className="text-primary font-medium text-sm">{faq.q}</span>)
                  : (<span className="text-secondary font-medium text-sm">{faq.q}</span>)}
                {open === i ? (
                  <ChevronUp className="w-4 h-4 text-secondary flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-secondary flex-shrink-0" />
                )}
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-secondary text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 relative overflow-x-hidden">
      <JellyCursor />
      <SiteNavbar brandName="Wingman Pro" />
      <FadeIn>
        <Hero />
      </FadeIn>
      <FadeIn>
        <FeaturesShowcase />
      </FadeIn>
      <ImageMarquee />
      <FadeIn>
        <ContactCTA />
      </FadeIn>
      <FadeIn>
        <FAQ />
      </FadeIn>
      <SiteFooter brandName="Wingman Pro" />
      <ScrollToTop />
    </div>
  )
}
