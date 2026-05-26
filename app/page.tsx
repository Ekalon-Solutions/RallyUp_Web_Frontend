"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, ChevronRight, ArrowRight, Calendar, LayoutGrid, BarChart2, Volume2, ShoppingCart, Images, Play, SlidersHorizontal, Music, Video, ShoppingBag, Smartphone, ClipboardList } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"
import { ContactForm } from "@/components/contact-form"

const LOGO_FRAMES = [
  "/wingmanlogo/Property 1=Default (4).svg",
  "/wingmanlogo/Property 1=Default (3).svg",
  "/wingmanlogo/Property 1=Default (2).svg",
  "/wingmanlogo/Property 1=Default (1).svg",
  "/wingmanlogo/Property 1=Default.svg",
]

function AnimatedLogo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const totalSteps = LOGO_FRAMES.length + 2; 

    const id = setInterval(() => {
      setStep((s) => (s + 1) % totalSteps);
    }, 600);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full h-full">
      {LOGO_FRAMES.map((src, i) => {
        const isVisible = step < LOGO_FRAMES.length + 1 && step >= i;

        return (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-300 ease-in ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={src}
              alt="Wingman Pro Logo Layer"
              fill
              className="object-contain"
              priority={i === 0}
            />
          </div>
        );
      })}
    </div>
  );
}
function Hero() {
  return (
    <section className="bg-white relative overflow-hidden" id="home">

      {/* ── Mobile layout ── */}
      <div className="md:hidden">
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
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, #727274 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #727274 40px), linear-gradient(128deg, #1e1e1e 41.5%, #3a3a3a 98.5%)`,
              backgroundSize: "100% 40px, 40px 100%, 100% 100%",
              borderBottomLeftRadius: "100% 75%",
              boxShadow: "5px 24px 0px -2px #f1441a",
            }}
          />
          {/* Ram illustration — right-aligned */}
          <div className="absolute top-0 right-0 h-[80%] w-[75%]">
            <Image
              src='Logo.svg'
              alt="Wingman Pro"
              fill
              className="object-contain object-right-top mt-5"
              priority
            />
          </div>
        </div>

        {/* Text content below */}
        <div className="relative isolate px-6 sm:px-8 py-7 space-y-5 bg-white overflow-hidden">
          {/* Decorative Vector — top-right corner */}
          <div className="absolute -bottom-8 -left-10 w-80 h-80 opacity-60 pointer-events-none select-none z-[-5]">
            <Image src="/Vector.svg" alt="" fill className="object-contain" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#E18F67]">
            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            <span className="text-[#E18F67] text-[10px] font-medium leading-tight">
              The first AI-powered platform for Supporter Groups and Sports Clubs.
            </span>
          </div>

          <h1 className="text-4xl font-bold text-background leading-[1.1] tracking-tight">
            Don&apos;t Just Run Your Club.<br />
            <span className="text-primary">Revolutionize.</span>
          </h1>

          <p className="text-background text-base leading-relaxed">
            One platform for membership, ticketing,<br />payments and fan engagement.
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
                className="h-8 px-4 border border-[#727274] text-sm uppercase tracking-wide active:scale-95 !text-white"
              >
                Explore Features
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden md:block relative w-full overflow-hidden">
        <div className="grid md:grid-cols-2 items-center">
          {/* Left Column */}
          <div className="w-full flex justify-end">
            <div className="w-full max-w-[768px] py-8 md:py-16 pl-6 sm:pl-8 lg:pl-12 xl:pl-16 pr-4 lg:pr-8 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#E18F67]">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <span className="text-[#E18F67] text-[10px] font-medium leading-tight tracking-wide">
                  The first AI-powered platform for Supporter Groups and Sports Clubs.
                </span>
              </div>

              <h1 className="text-[2rem] xl:text-[2.5rem] font-bold text-background">
                <span className="lg:whitespace-nowrap">
                  Don&apos;t Just Run Your Club.
                </span>
                {/* <br className="hidden md:block" /> */}
                <br />
                <span className="text-primary">Revolutionize.</span>
              </h1>

              <p className="text-background text-lg lg:text-xl leading-relaxed max-w-lg mt-4">
                One platform for membership, ticketing,<br className="hidden lg:block" />payments and fan engagement.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-6">
                <Link href="/contact">
                  <Button
                    variant="default"
                    className="px-4 lg:px-8 h-12 text-white font-bold text-xs rounded-lg uppercase tracking-wider bg-primary hover:bg-primary/90"
                  >
                    Book a Demo
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    variant="outline"
                    className="px-4 lg:px-8 h-12 border-transparent bg-[#1A1A1A] font-bold text-white text-xs rounded-lg uppercase hover:bg-[#2A2A2A] transition-colors tracking-wider flex items-center gap-2"
                  >
                    Explore Features
                    <ArrowRight className="w-4 h-4 text-white" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column — decorated image */}
          <div className="relative h-[65vh] xl:h-[75vh] w-full pt-8 md:pt-16">
            <div className="absolute top-8 right-0 w-full lg:w-[110%] h-[90%] bg-primary rounded-l-[40px]" />
            <div
              className="absolute top-[calc(2rem+5%)] right-[0%] w-full lg:w-[105%] h-[92%] rounded-l-[40px]"
              style={{ background: "linear-gradient(128deg, #222 41.5%, #434242 98.5%)" }}
            />
            <div className="absolute top-[calc(2rem+10%)] right-[5%] w-[90%] h-[80%] lg:right-[4%] lg:w-[100%] lg:h-[85%] z-10">
              <AnimatedLogo />
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
  imageIcon?: string
  headline: [string, string]
  sub: string
  cards: Array<{ Icon: React.ComponentType<{ className?: string }>; title: string; desc: string; accent: string }>
}> = [
    {
      id: "feed",
      label: "Feed",
      Icon: LayoutGrid,
      imageIcon: "/Feed.svg",
      headline: ["Your Club.", "All in One Place."],
      sub: "Track matches, manage members, vote, and stay updated — all in one dashboard.",
      cards: [
        { Icon: Play, title: "Live Fixtures & League Table", desc: "Stay on top of upcoming matches across all competitions and check your team's standing in real time.", accent: "bg-[#71AA8A]" },
        { Icon: Calendar, title: "Events, Polls & Membership", desc: "Join fan screenings, vote on club decisions and manage your membership — all from one place.", accent: "bg-[#AB9EBB]" },
      ],
    },
    {
      id: "events",
      label: "Events",
      Icon: Calendar,
      imageIcon: "/Events.svg",
      headline: ["Don't Miss", "A Single Moment."],
      sub: "Browse screenings, CSR drives, and meetups — search, register, and relive events in one place.",
      cards: [
        { Icon: SlidersHorizontal, title: "Search & Filter Events", desc: "Find exactly what you're looking for — filter by category, date or type and register in seconds.", accent: "bg-[#71AA8A]" },
        { Icon: Calendar, title: "Ongoing, Upcoming & Past", desc: "See what's live right now, what's coming up next and revisit every event your club has hosted.", accent: "bg-[#AB9EBB]" },
      ],
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      Icon: BarChart2,
      imageIcon: "/Leaderboard.svg",
      headline: ["Compete.", "Climb the Ranks."],
      sub: "Attend more events, climb the ranks, and earn points with every show of loyalty.",
      cards: [
        { Icon: BarChart2, title: "Personal Ranking", desc: "Instantly see your current position, events attended and total points — all in one snapshot.", accent: "bg-[#71AA8A]" },
        { Icon: ClipboardList, title: "Top Performers Board", desc: "See who's leading the pack across the club and fuel your drive to show up more.", accent: "bg-[#AB9EBB]" },
      ],
    },
    {
      id: "chants",
      label: "Club Chants",
      Icon: Volume2,
      imageIcon: "/ClubChants.svg",
      headline: ["Sing Loud.", "Know Every Word."],
      sub: "Songs, chants, and traditions — all in one place. Learn them and never stay silent again.",
      cards: [
        { Icon: Music, title: "Lyrics & Chant Library", desc: "Search and read the full text of every club chant — from match day anthems to terrace classics.", accent: "bg-[#71AA8A]" },
        { Icon: Video, title: "Videos & Visual Guides", desc: "Watch embedded videos of chants in action so you can learn the rhythm, words and passion behind each one.", accent: "bg-[#AB9EBB]" },
      ],
    },
    {
      id: "merch",
      label: "Merchandise",
      Icon: ShoppingCart,
      imageIcon: "/Merchandise.svg",
      headline: ["Gear Up.", "Stand Out."],
      sub: "Official merch — scarves, bottles, collectibles, and more. Show the world where your heart belongs.",
      cards: [
        { Icon: ShoppingBag, title: "Apparel & Collectibles", desc: "From match day scarves and water bottles to limited-edition collectibles — gear for every kind of fan.", accent: "bg-[#71AA8A]" },
        { Icon: SlidersHorizontal, title: "Search, Filter & Shop", desc: "Sort, filter, and spot featured items — find what you want fast before it's gone.", accent: "bg-[#AB9EBB]" },
      ],
    },
    {
      id: "gallery",
      label: "Gallery",
      Icon: Images,
      headline: ["Every Moment.", "Saved Forever."],
      sub: "Relive your club's best moments — from matchdays to fan meetups, all in one place.",
      cards: [
        { Icon: Images, title: "Event Albums", desc: "All your club's media organised into albums — one folder per event, easy to find and browse.", accent: "bg-[#71AA8A]" },
        { Icon: Smartphone, title: "Full Screen Viewing", desc: "Open any photo or media in full screen and relive the atmosphere like you were right there.", accent: "bg-[#AB9EBB]" },
      ],
    },
  ]

function FeaturesShowcase() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const tabsRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (paused) return
    const delay = 1500 // Reduced from 3000ms to 1500ms for faster animation
    const id = setInterval(() => {
      setActiveIdx((i) => {
        if (i < 2) return i + 1;
        return 0;
      })
    }, delay)
    return () => clearInterval(id)
  }, [paused])

  useEffect(() => {
    if (!tabsRef.current) return
    const activeBtn = tabsRef.current.children[activeIdx] as HTMLElement
    if (activeBtn) {
      const container = tabsRef.current
      const scrollLeft = activeBtn.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2)
      container.scrollTo({ left: scrollLeft, behavior: "smooth" })
    }
  }, [activeIdx])

  const active = tabConfig[activeIdx]

  const scrollNext = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: 120, behavior: "smooth" })
    }
  }

  return (
    <section
      className="bg-white md:bg-secondary-purple py-16 md:py-20 lg:py-24"
      id="features"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-8xl px-6 sm:px-8 lg:px-12 xl:px-16">

        {/* ── Mobile layout ── */}
        <div className="md:hidden space-y-6 mt-2">
          <div className="px-1">
            {/* Headline */}
            <h2 className="text-4xl font-bold font-black leading-[1.05] tracking-tight">
              <span className="text-[#1E1E2C]">Your Club.</span>
              <br />
              <span className="text-primary">All in One Place.</span>
            </h2>
          </div>

          <div className="px-1 relative">
            {/* Horizontal scrollable tab pills */}
            <div className="flex items-center gap-1">
              <div ref={tabsRef} className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar flex-1 snap-x scroll-smooth">
                {tabConfig.map((tab, i) => {
                  const Icon = tab.Icon
                  const isActive = i === activeIdx
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveIdx(i)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] text-[13px] font-medium whitespace-nowrap transition-all flex-shrink-0 border snap-start ${isActive
                        ? "bg-[#DDE0FF] text-[#5C608A] border-transparent shadow-sm"
                        : "bg-transparent text-[#61628E] border-[#8C8DAB] hover:bg-gray-50"
                        }`}
                    >
                      {tab.imageIcon ? (
                        <div className="relative w-[15px] h-[15px] flex-shrink-0">
                          <Image src={tab.imageIcon} alt={tab.label} fill className="object-contain" />
                        </div>
                      ) : (
                        <Icon className="w-[15px] h-[15px]" />
                      )}
                      {tab.label}
                    </button>
                  )
                })}
              </div>
              <button onClick={scrollNext} className="flex-shrink-0 p-1 bg-transparent border-none">
                <ChevronRight className="w-5 h-5 text-[#888]" />
              </button>
            </div>
          </div>

          {/* Content card */}
          <div className="relative bg-gradient-to-b from-[#BCBEDD] to-[#5B5D98] rounded-[28px] p-6 shadow-md mt-6 mx-1 min-h-[432px]">
            {/* Red dot */}
            <div className="absolute top-6 right-6 z-10">
              <div className="w-2.5 h-2.5 bg-primary rounded-full ring-[4px] ring-primary/20" />
            </div>

            <div>
              {/* Inner Top text */}
              <div className="space-y-1.5 pr-8 mt-2">
                <p className="text-primary font-bold text-[22px] leading-tight tracking-tight">{active.headline[0].replace('.', ',')}</p>
                <p className="text-[#1A1A24] font-black text-[24px] leading-tight tracking-tight">{active.headline[1].toLowerCase()}</p>
                <p className="text-white text-[15px] pt-1 leading-snug pr-4">{active.sub}</p>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-[#7D7F9B]/40 my-6" />

              {/* Inner Cards */}
              <div className="space-y-3.5">
                {active.cards.map((card, i) => {
                  const CardIcon = card.Icon
                  return (
                    <div key={i} className="bg-[#E5E4FA] rounded-[20px] border border-[#A5A6C4] flex items-center gap-4 p-4 shadow-sm">
                      <div className={`${card.accent} w-[52px] h-[52px] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <CardIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 flex flex-col pt-0.5">
                        <p className="font-bold text-[#595A8D] text-[15px] mb-[2px] leading-snug">{card.title}</p>
                        <p className="text-[#8487A4] text-[13px] leading-snug line-clamp-2 pr-1">{card.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Desktop layout ── */}
        <div className="hidden bg-white md:grid md:grid-cols-[minmax(250px,25%)_1fr] items-center border-t rounded-r-[32px] border-gray-100">

          {/* Left — vertical sidebar */}
          <div className="relative rounded-l-[32px] rounded-b-[32px] flex flex-col justify-center h-full">

            <div className="w-full">
              <hr className="border-gray-200 border-t-2 mb-4 mt-4" />
            </div>

            <div className="relative pl-8 pt-6 pb-6 mr-4">
              <div className="flex flex-col space-y-2 relative h-[272px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-6 border-r-2 border-gray-100">
                {/* Active Indicator Line Track */}
                <div className="absolute right-[-2px] w-[4px] bg-gray-200 rounded-full h-[328px] top-0">
                  {/* Active Indicator Line */}
                  <div
                    className={`absolute right-0 w-[4px] bg-gray-400 rounded-full transition-all duration-300 ease-in-out h-12 ${[
                      "top-0",
                      "top-[56px]",
                      "top-[112px]",
                      "top-[168px]",
                      "top-[224px]",
                      "top-[280px]"
                    ][activeIdx] || "top-0"
                      }`}
                  />
                </div>

                {tabConfig.map((tab, i) => {
                  const Icon = tab.Icon
                  const isActive = i === activeIdx
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveIdx(i)}
                      className={`group flex items-center justify-between w-full px-5 h-12 rounded-[14px] transition-all duration-200 flex-shrink-0 ${isActive
                        ? "bg-secondary text-black"
                        : "text-[#666] hover:text-black"
                        }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {tab.imageIcon ? (
                          <div className="relative w-[18px] h-[18px] flex-shrink-0">
                            <Image src={tab.imageIcon} alt={tab.label} fill className="object-contain" />
                          </div>
                        ) : (
                          <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-black" : "text-[#888] group-hover:text-black"}`} />
                        )}
                        <span className="text-md  text-black md:text-lg">{tab.label}</span>
                      </div>
                      {isActive && <ArrowRight className="w-4 h-4 text-black" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="w-full">
              <hr className="border-gray-200 border-t-2 mt-4 mb-4" />
            </div>

          </div>

          {/* Right — content panel */}
          <div className="bg-gradient-to-b from-secondary/30 via-secondary/60 to-secondary/90 
            rounded-[32px] p-4 pr-8 md:pr-10 xl:pr-12 
            pb-8 md:pb-12 xl:pb-16 
            relative overflow-hidden flex items-stretch shadow-md">
            <div className="bg-gradient-to-b from-white to-secondary-purple rounded-[24px] w-full p-10 xl:p-12 shadow-sm relative z-10 flex flex-col justify-center min-h-[460px]">
              <div className="space-y-8">
                {/* Headline & Sub */}
                <div className="flex flex-row h-content gap-4">
                  <div className="w-1.5 bg-secondary flex-shrink-0" />
                  <div className="space-y-5">
                    <div className="flex items-stretch gap-4">
                      <h2 className="text-4xl font-bold font-weight-700 xl:text-[42px] font-black flex flex-col leading-[1.1] gap-1">
                        <span className="text-background">{active.headline[0]}</span>
                        <span className="text-primary">{active.headline[1]}</span>
                      </h2>
                    </div>
                    <p className="text-[#666] text-[17px] font-regular font-weight-400 leading-relaxed max-w-xl">{active.sub}</p>
                  </div>

                </div>



                {/* Cards */}
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
                  {active.cards.map((card, i) => {
                    const CardIcon = card.Icon
                    return (
                      <div key={i} className="flex gap-4">
                        <div className={`${card.accent} w-[60px] h-[60px] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <CardIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col pt-1">
                          <p className="font-bold text-[#6D71AA] text-[15px] mb-1.5">{card.title}</p>
                          <p className="text-[#888] text-[13px] leading-relaxed max-w-[220px]">{card.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Logo in bottom right */}
            <div className="absolute bottom-6 right-6 md:bottom-2 md:right-2 w-14 h-14 bg-background rounded-full flex items-center justify-center shadow-xl z-20 rotate-[45deg]">
              <div className="w-9 h-9 relative">
                <Image src="Logo.svg" alt="Wingman" fill className="object-contain" />
              </div>
            </div>
          </div>

        </div>

      </div>
    </section >
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
      <div className="flex gap-4 animate-marquee whitespace-nowrap">
        {[...images, ...images].map((src, i) => (
          <div
            key={i}
            className="border-[6px] border-white rounded-[25px] flex-shrink-0 w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48 relative overflow-hidden transition-transform duration-300"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="(max-width: 640px) 144px, (max-width: 768px) 160px, 192px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function ContactCTA() {
  return (
    <section className="bg-white py-16 md:py-20 lg:py-24" id="contact">
      <div className="mx-auto max-w-8xl px-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">
          {/* Left */}
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold font-black flex flex-wrap gap-x-2 gap-y-1 leading-[1.1] mb-4">
                <span className="text-[#1E1E2C]">Ready to</span>
                <span className="text-primary">Upgrade Your Club?</span>
              </h2>
              <p className="text-[#595A8D] text-lg leading-relaxed max-w-md">
                Book a consultation or join the wait-list. Takes two minutes.
              </p>
            </div>

            <div className="mt-auto border-t border-border/30 pt-8">
              <p className="text-secondary font-semibold text-base mb-1">Need urgent help?</p>
              <p className="text-[#888] text-sm">Contact your Sales POC directly for fastest resolution.</p>
            </div>
          </div>

          {/* Right — form */}
          <ContactForm />
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
    <section
      className="py-16 md:py-20 lg:py-24 relative isolate overflow-hidden"
      id="faqs"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-secondary-purple/40 -z-20" />

      {/* SVG Background Lines */}
      <svg
        className="hidden md:block absolute inset-0 w-full h-full -z-10 pointer-events-none"
        viewBox="0 0 1440 500"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* LEFT TRIANGLE */}
        <line
          x1="0"
          y1="500"
          x2="380"
          y2="0"
          stroke="#C9C1CF"
          strokeWidth="0.8"
        />
        <line
          x1="380"
          y1="0"
          x2="770"
          y2="500"
          stroke="#C9C1CF"
          strokeWidth="0.8"
        />

        {/* CENTER INTERSECTING TRIANGLE */}
        <line
          x1="530"
          y1="500"
          x2="905"
          y2="0"
          stroke="#A291B178"
          strokeWidth="0.8"
        />
        <line
          x1="905"
          y1="0"
          x2="1245"
          y2="500"
          stroke="#F1441A1F"
          strokeWidth="0.8"
        />

        {/* PARALLEL INNER RIGHT LINE */}
        <line
          x1="880"
          y1="0"
          x2="1215"
          y2="500"
          stroke="#8598C7AB"
          strokeWidth="0.8"
        />
      </svg>

      {/* Decorative Vector */}
      <div className="absolute -bottom-32 -left-10 w-[45vw] h-[45vw] max-w-[22rem] max-h-[22rem] opacity-60 pointer-events-none select-none -z-10">
        <Image
          src="/Vector.svg"
          alt=""
          fill
          className="object-contain"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-8xl px-6 sm:px-8 lg:px-12 xl:px-16">
        <h2 className="flex flex-col items-start gap-2 md:items-center text-4xl lg:text-5xl font-bold text-center mb-12">
          <span className="text-background">
            Frequently Asked
          </span>

          <span className="text-primary">
            Questions
          </span>
        </h2>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`border rounded-[20px] overflow-hidden transition-all duration-300 ${
                open === i
                  ? "bg-secondary/30 border-primary"
                  : "bg-[#DCD4E2] border-[#6668A1]"
              }`}
            >
              <button
                onClick={() =>
                  setOpen(open === i ? null : i)
                }
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
              >
                {open === i ? (
                  <span className="text-primary font-medium text-sm">
                    {faq.q}
                  </span>
                ) : (
                  <span className="text-secondary font-medium text-sm">
                    {faq.q}
                  </span>
                )}

                {open === i ? (
                  <ChevronUp className="w-4 h-4 text-secondary flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-secondary flex-shrink-0" />
                )}
              </button>

              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-secondary text-sm leading-relaxed">
                    {faq.a}
                  </p>
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
    <div className="min-h-screen bg-white text-slate-900 relative overflow-x-clip public-theme">
      {/* <JellyCursor /> */}
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
