"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, ArrowRight, Calendar } from "lucide-react"
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

function AnimatedLogo({ size = 96 }: { size?: number }) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % LOGO_FRAMES.length), 180)
    return () => clearInterval(id)
  }, [])

  return (
    <Image
      src={LOGO_FRAMES[frame]}
      alt="Wingman Pro"
      width={size}
      height={size}
      className="object-contain"
      priority
    />
  )
}

function Hero() {
  return (
    <section className="bg-white relative overflow-hidden" id="home">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Column */}
          <div className="space-y-6 order-1">
            {/* Animated Logo */}
            <AnimatedLogo size={96} />

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#222] border border-[#e18f67]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#e18f67] flex-shrink-0" />
              <span className="text-[#e18f67] text-[10px] font-medium leading-tight">
                The first AI-powered platform for Supporter Groups and Sports Clubs.
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold text-[#222] leading-tight">
              Don&apos;t Just Run Your Club.{" "}
              <span className="text-[#f1441a]">Revolutionize.</span>
            </h1>

            {/* Sub-description */}
            <p className="text-[#222] text-lg sm:text-xl leading-relaxed max-w-lg">
              One platform for membership, ticketing, payments and fan engagement.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link href="/contact">
                <Button className="w-full sm:w-auto px-8 h-10 bg-[#f1441a] hover:bg-[#d93c16] text-white font-medium text-xs rounded-[5px] uppercase tracking-wider">
                  Book a Demo
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto px-8 h-10 bg-[#222] border border-[#a2a2a2] text-white hover:bg-[#333] hover:text-white font-medium text-xs rounded-[5px] uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Explore Features
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column — decorated image */}
          <div className="relative h-[320px] sm:h-[420px] md:h-[480px] lg:h-[520px] order-2">
            {/* Orange background rect */}
            <div className="absolute top-0 right-0 w-[78%] h-[90%] bg-[#f1441a] rounded-[20px]" />
            {/* Dark gradient rect */}
            <div
              className="absolute top-[6%] right-[2%] w-[74%] h-[92%] rounded-l-[20px]"
              style={{ background: "linear-gradient(128deg, #222 41.5%, #434242 98.5%)" }}
            />
            {/* App illustration */}
            <div className="absolute top-[8%] right-[4%] w-[70%] h-[88%] z-10">
              <Image
                src="/Webpage Assets 01.png"
                alt="Wingman Pro app dashboard"
                fill
                sizes="(max-width: 640px) 70vw, (max-width: 1024px) 55vw, 40vw"
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

type FeatureTab = "feed" | "events" | "leaderboard" | "chants" | "merch" | "gallery"

const tabContent: Record<FeatureTab, Array<{ icon: string; title: string; desc: string; color: string }>> = {
  feed: [
    { icon: "📡", title: "Live Fixtures & League Table", desc: "Stay on top of upcoming matches across all competitions and check your team's standing in real time.", color: "bg-[#69a78a]" },
    { icon: "📅", title: "Events, Polls & Membership", desc: "Join fan screenings, vote on club decisions and manage your membership — all from one place.", color: "bg-[#a291b1]" },
  ],
  events: [
    { icon: "🎟️", title: "Match Day Ticketing", desc: "QR-code ready ticketing for match days, socials and special events with seamless checkout.", color: "bg-[#69a78a]" },
    { icon: "📊", title: "Event Analytics", desc: "Track attendance, revenue and engagement for every event your club hosts.", color: "bg-[#a291b1]" },
  ],
  leaderboard: [
    { icon: "🏆", title: "Fan Leaderboards", desc: "Award points for attendance, purchases and interactions to boost fan loyalty.", color: "bg-[#69a78a]" },
    { icon: "⭐", title: "Member Rewards", desc: "Gamify fan engagement with badges, points and exclusive perks for top supporters.", color: "bg-[#a291b1]" },
  ],
  chants: [
    { icon: "🎵", title: "Club Chant Library", desc: "Build and share your club's chant library, keeping traditions alive for every member.", color: "bg-[#69a78a]" },
    { icon: "🔊", title: "Audio Community", desc: "Record and share chants with fans worldwide, building your club's unique culture.", color: "bg-[#a291b1]" },
  ],
  merch: [
    { icon: "👕", title: "Merchandise Store", desc: "Real-time inventory tracking and seamless checkout for your club's merchandise.", color: "bg-[#69a78a]" },
    { icon: "💳", title: "Integrated Payments", desc: "Secure multi-currency payments with automated financial reporting and reconciliation.", color: "bg-[#a291b1]" },
  ],
  gallery: [
    { icon: "📸", title: "Photo Gallery", desc: "Build a rich visual archive of your club's moments, from match days to away trips.", color: "bg-[#69a78a]" },
    { icon: "🎬", title: "Media Library", desc: "Share highlights and memories with your global fan base across all devices.", color: "bg-[#a291b1]" },
  ],
}

function FeaturesShowcase() {
  const [activeTab, setActiveTab] = useState<FeatureTab>("feed")

  const tabs: { id: FeatureTab; label: string }[] = [
    { id: "feed", label: "Feed" },
    { id: "events", label: "Events" },
    { id: "leaderboard", label: "Leaderboard" },
    { id: "chants", label: "Club Chants" },
    { id: "merch", label: "Merchandise" },
    { id: "gallery", label: "Gallery" },
  ]

  return (
    <section className="bg-[#dcd4e2] py-16 md:py-20 lg:py-24" id="features">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Left — app panel with tabs */}
          <div className="bg-white rounded-[20px] overflow-hidden shadow-lg">
            <div className="flex h-full">
              {/* Sidebar nav */}
              <div className="w-[140px] sm:w-[160px] border-r border-[#b5b5b5] py-4 flex flex-col">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-2.5 text-sm font-bold transition-colors ${
                      activeTab === tab.id
                        ? "bg-[#d4d5fb] text-[#222]"
                        : "text-[#222] hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        activeTab === tab.id ? "bg-[#6668a1]" : "bg-gray-300"
                      }`}
                    />
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* App preview */}
              <div className="flex-1 p-4 flex items-center justify-center min-h-[300px] sm:min-h-[360px]">
                <div className="relative w-full h-52 sm:h-72">
                  <Image
                    src="/Webpage Assets 00.png"
                    alt="Wingman Pro Dashboard"
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 35vw, 22vw"
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right — text + feature cards */}
          <div className="space-y-8 py-4 lg:py-6">
            <div className="flex items-start gap-4">
              <div className="w-[7px] h-24 bg-[#6668a1] rounded-full flex-shrink-0 mt-1" />
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight">
                <span className="text-[#222]">Your Club.</span>
                <br />
                <span className="text-[#f1441a]">All in One Place.</span>
              </h2>
            </div>

            <p className="text-[#646464] text-base sm:text-lg leading-relaxed">
              Track matches, manage members, vote, and stay updated — all in one dashboard.
            </p>

            <div className="space-y-5">
              {tabContent[activeTab].map((card, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div
                    className={`${card.color} w-[72px] h-[70px] rounded-[5px] flex items-center justify-center flex-shrink-0 text-2xl`}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-[#6668a1] text-sm mb-1">{card.title}</p>
                    <p className="text-[#646464] text-xs leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ImageMarquee() {
  const images = [
    "/Ankit.png",
    "/Mihir.png",
    "/Neeta.png",
    "/Sunil.png",
    "/Webpage Assets 06.png",
    "/Webpage Assets 03.png",
    "/Ankit.png",
    "/Mihir.png",
    "/Neeta.png",
    "/Sunil.png",
  ]

  return (
    <section className="bg-[#6668a1] py-8 overflow-hidden">
      <div className="flex gap-6 animate-marquee whitespace-nowrap">
        {[...images, ...images].map((src, i) => (
          <div
            key={i}
            className="border-[6px] border-white rounded-[20px] flex-shrink-0 w-[160px] h-[160px] sm:w-[180px] sm:h-[180px] relative overflow-hidden"
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
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left */}
          <div className="space-y-5">
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight">
              <span className="text-[#222]">Ready to</span>{" "}
              <span className="text-[#f1441a]">Upgrade Your Club?</span>
            </h2>
            <p className="text-[#6668a1] text-lg leading-relaxed max-w-md">
              Book a consultation or join the wait-list. Takes two minutes.
            </p>

            <div className="border-t border-[#888]/30 pt-8 mt-8">
              <p className="text-[#6668a1] font-semibold text-base mb-1">Need urgent help?</p>
              <p className="text-[#888] text-sm">Contact your Sales POC directly for fastest resolution.</p>
            </div>
          </div>

          {/* Right — form */}
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#dcd4e2] flex items-center justify-center text-3xl">✓</div>
              <p className="text-[#222] font-bold text-xl">Thanks! We&apos;ll be in touch shortly.</p>
              <Button
                variant="outline"
                className="border border-[#6668a1] text-[#6668a1] hover:bg-[#6668a1]/10 rounded-[5px] text-xs font-medium uppercase tracking-wide"
                onClick={() => setSubmitted(false)}
              >
                Submit another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[#6668a1] text-xs font-semibold">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#888] rounded-[10px] text-xs text-[#888] placeholder-[#888] focus:outline-none focus:border-[#6668a1] bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[#6668a1] text-xs font-semibold">Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full h-11 px-4 border border-[#888] rounded-[10px] text-xs text-[#888] placeholder-[#888] focus:outline-none focus:border-[#6668a1] bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#6668a1] text-xs font-semibold">Topic</label>
                <select
                  value={form.topic}
                  onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                  className="w-full h-11 px-4 border border-[#888] rounded-[10px] text-xs text-[#888] focus:outline-none focus:border-[#6668a1] appearance-none bg-white"
                >
                  <option>Product Support</option>
                  <option>Sales Inquiry</option>
                  <option>Partnership</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#6668a1] text-xs font-semibold">Message</label>
                <textarea
                  placeholder="Tell us what you need..."
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-[#888] rounded-[10px] text-xs text-[#888] placeholder-[#888] focus:outline-none focus:border-[#6668a1] resize-none bg-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Button
                  type="submit"
                  className="flex-1 h-10 bg-[#6668a1] hover:bg-[#5557a0] text-white font-medium text-xs rounded-[5px] uppercase tracking-wider"
                >
                  Submit
                </Button>
                <Link href="/clubs" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 border border-[#6668a1] text-[#6668a1] hover:bg-[#6668a1]/10 font-medium text-xs rounded-[5px] uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-3.5 h-3.5" />
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
      <div className="absolute inset-0 bg-gradient-to-r from-white to-[#dcd4e2] -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-center mb-12">
          <span className="text-[#222]">Frequently Asked</span>{" "}
          <span className="text-[#f1441a]">Questions</span>
        </h2>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[#dcd4e2] border border-[#6668a1] rounded-[20px] overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
              >
                <span className="text-[#6668a1] font-medium text-sm">{faq.q}</span>
                {open === i ? (
                  <ChevronUp className="w-4 h-4 text-[#6668a1] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#6668a1] flex-shrink-0" />
                )}
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-[#646464] text-sm leading-relaxed">{faq.a}</p>
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
