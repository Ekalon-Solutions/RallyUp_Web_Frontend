"use client"

import React from "react"
import Image from "next/image"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"
import { JellyCursor } from "@/components/jelly-cursor"
import { ParticleBackground } from "@/components/particle-background"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Building2,
  Rocket,
  Sparkles,
  Target,
  Users,
  Trophy,
  Globe,
  Shield,
  Zap,
} from "lucide-react"

export default function AboutPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white relative overflow-x-hidden">
      <JellyCursor />
      <ParticleBackground />
      <SiteNavbar />
      
      <div className="mx-auto max-w-7xl px-4 py-16 relative z-10">
        {/* Hero Section with Image */}
        <FadeIn>
          <div className="relative mb-16">
            {/* Background Image - Celebrating Group */}
            <div className="absolute right-0 top-0 w-1/2 max-w-2xl opacity-15 dark:opacity-8 -z-0 hidden lg:block">
              <div className="relative h-[500px] w-full animate-float">
                <Image
                  src="/Webpage Assets 01.png"
                  alt="Global sports community"
                  fill
                  sizes="(max-width: 1024px) 0px, 800px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="max-w-3xl relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 mb-6 animate-scale-in">
                <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400 animate-pulse" />
                <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">About RallyUp Solutions</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-sky-800 to-blue-900 dark:from-white dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent">
                About Us: RallyUp Solutions & Wingman Pro
              </h1>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                RallyUp Solutions Private Limited was founded to match the passion of sports communities with seamless, modern operations.
                Our flagship platform, Wingman Pro, transforms supporter group and club management into a unified, intelligent digital experience.
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeIn>
          <section className="mt-12 grid gap-6 md:grid-cols-2">
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-2 border-slate-200 dark:border-white/10 hover:shadow-2xl hover:scale-105 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <CardHeader className="flex flex-row items-start gap-4 relative z-10">
                <div className="rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 p-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-slate-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-sky-600 group-hover:to-blue-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                    RallyUp Solutions Private Limited
                  </CardTitle>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">
                    We engineer robust, scalable, and intelligent software for the global sports ecosystem, eliminating fragmentation and administrative overload that hinder growth and engagement.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="text-slate-600 dark:text-slate-300 space-y-3 relative z-10">
                <p>
                  From grassroots groups to professional bodies, we empower organizations to operate with the efficiency and insight required in the digital age.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 border-2 border-slate-200 dark:border-white/10 hover:shadow-2xl hover:scale-105 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <CardHeader className="flex flex-row items-start gap-4 relative z-10">
                <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <Rocket className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-slate-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-sky-600 group-hover:to-blue-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                    Wingman Pro
                  </CardTitle>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">
                    The realization of our mission: a single, secure platform integrating membership management, payments, communications, and events into one cohesive system.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="text-slate-600 dark:text-slate-300 space-y-3 relative z-10">
                <p>
                  Wingman Pro replaces the complexity of juggling multiple tools with an intuitive experience, giving managers and volunteers more time to grow communities and deliver exceptional matchday moments.
                </p>
              </CardContent>
            </Card>
          </section>
        </FadeIn>

        <FadeIn>
          <section className="mt-16 space-y-10 relative">
            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-sky-200/20 dark:bg-sky-900/10 rounded-full blur-3xl animate-float" />
            </div>

            <div className="grid gap-6 md:grid-cols-2 relative z-10">
              <Card className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 border-2 border-slate-200 dark:border-white/10 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                <CardHeader className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-slate-900 dark:text-white">Mission</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300">
                  To eliminate administrative fragmentation in sports organizations globally by providing a unified, intelligent platform that maximizes operational efficiency, compliance, and member engagement.
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-2 border-slate-200 dark:border-white/10 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                <CardHeader className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-slate-900 dark:text-white">Vision</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300">
                  To become the leading global technology partner for sports clubs and supporter groups, recognized for transforming community management through innovation and unparalleled user experience.
                </CardContent>
              </Card>
            </div>

            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4 bg-gradient-to-r from-slate-900 via-sky-800 to-blue-900 dark:from-white dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent">
                What We Do
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    title: "Centralized Membership Management",
                    description:
                      "Handle enrollment, maintain data integrity, manage access, and track member status from a single control center.",
                    icon: Users,
                    gradient: "from-blue-500 to-cyan-600",
                    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20"
                  },
                  {
                    title: "Integrated Commerce",
                    description:
                      "Manage ticketing, merchandise sales, and automated payments with end-to-end financial reporting and compliance.",
                    icon: Rocket,
                    gradient: "from-green-500 to-emerald-600",
                    bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
                  },
                  {
                    title: "Seamless Engagement",
                    description:
                      "Activate events, communications, and content delivery—including OTP via Email/SMS, polls, and leaderboards—with ease.",
                    icon: Trophy,
                    gradient: "from-orange-500 to-red-600",
                    bgGradient: "from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20"
                  },
                  {
                    title: "Compliance & Security",
                    description:
                      "Meet stringent security standards and global data protection requirements, including DPDPA and GDPR-aligned principles.",
                    icon: Shield,
                    gradient: "from-purple-500 to-indigo-600",
                    bgGradient: "from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20"
                  },
                  {
                    title: "Gamification & AI",
                    description:
                      "Deliver intelligent engagement, performance leaderboards, actionable insights, automated content curation, and optimized communications using AI.",
                    icon: Zap,
                    gradient: "from-yellow-500 to-orange-600",
                    bgGradient: "from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20"
                  },
                ].map((item, i) => {
                  let bgClass = item.bgGradient
                  let iconClass = item.gradient
                  return (
                    <Card
                      key={item.title}
                      className={`bg-gradient-to-br ${bgClass} border-2 border-slate-200 dark:border-white/10 hover:shadow-xl hover:scale-105 transition-all duration-300 group relative overflow-hidden animate-scale-in`}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <CardHeader className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${iconClass} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                            {React.createElement(item.icon, { className: "h-5 w-5 text-white" })}
                          </div>
                          <CardTitle className="text-lg text-slate-900 dark:text-white">{item.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="text-slate-600 dark:text-slate-300 relative z-10">
                        {item.description}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section className="mt-16 relative">
            {/* Dashboard Image Background */}
            <div className="absolute left-0 top-0 w-1/2 max-w-xl opacity-10 dark:opacity-5 -z-0 hidden xl:block">
              <div className="relative h-[400px] w-full animate-float" style={{ animationDelay: '1s' }}>
                <Image
                  src="/Webpage Assets 00.png"
                  alt="Wingman Pro Dashboard"
                  fill
                  sizes="(max-width: 1280px) 0px, 600px"
                  className="object-contain"
                />
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6 bg-gradient-to-r from-slate-900 via-sky-800 to-blue-900 dark:from-white dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent relative z-10">
              Leadership Team
            </h2>
            <p className="max-w-3xl text-slate-700 dark:text-slate-300 mb-10 relative z-10">
              Our leadership blends deep technical expertise with decades of experience in global operations, finance, and community administration—ensuring Wingman Pro solves real-world challenges with cutting-edge solutions.
            </p>
            <div className="grid gap-6 md:grid-cols-2 relative z-10">
              {[
                {
                  name: "Dr. Sunil Acharya",
                  title: "Managing Director, COO & CCO",
                  description:
                    "Over 40 years leading quality, audits, compliance, and operations. Guides RallyUp Solutions' operational rigor and global security standards as the lead Operations and Compliance Officer.",
                  image: "/Sunil.png",
                },
                {
                  name: "Dr. Neeta Acharya",
                  title: "Managing Director, CMO & CFO",
                  description:
                    "Expert in marketing, finance, branding, and strategy. Shapes club growth, brand perception, and financial health while overseeing marketing strategy and corporate growth for RallyUp Solutions.",
                  image: "/Neeta.png",
                },
                {
                  name: "Mihir Chheda",
                  title: "CTO, Wingman Pro & Partner",
                  description:
                    "FinTech veteran and sports club administrator. Designs the Wingman Pro architecture, aligning engineering excellence with the real-world operational needs of clubs and supporter groups globally.",
                  image: "/Mihir.png",
                },
                {
                  name: "Ankit Ameria",
                  title: "Partner & Chief Sales Officer, Wingman Pro",
                  description:
                    "Leads market strategy and sales initiatives. Specializes in scaling startups and SMBs, ensuring Wingman Pro delivers measurable value to organizations and their supporter communities.",
                  image: "/Ankit.png",
                },
              ].map((leader, i) => (
                <Card
                  key={leader.name}
                  className="bg-gradient-to-br from-white to-sky-50/50 dark:from-slate-900/50 dark:to-blue-950/30 border-2 border-slate-200 dark:border-white/10 h-full hover:shadow-2xl hover:scale-105 transition-all duration-500 group relative overflow-hidden animate-scale-in"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <CardHeader className="relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 ring-4 ring-sky-200 dark:ring-sky-900 group-hover:ring-sky-400 dark:group-hover:ring-sky-600 transition-all duration-300 shadow-lg group-hover:scale-110 group-hover:rotate-3">
                        <Image
                          src={leader.image}
                          alt={leader.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-slate-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-sky-600 group-hover:to-blue-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                          {leader.name}
                        </CardTitle>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{leader.title}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-slate-600 dark:text-slate-300 relative z-10">
                    {leader.description}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section className="mt-16 rounded-3xl border-2 border-slate-200 dark:border-white/10 bg-gradient-to-br from-sky-500/10 via-blue-500/10 to-indigo-500/10 dark:from-sky-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 p-8 md:p-10 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(56,189,248,0.1),transparent_50%)]" />
            
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white bg-gradient-to-r from-sky-700 to-blue-700 dark:from-sky-300 dark:to-blue-300 bg-clip-text text-transparent">
                Partner with RallyUp Solutions
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-6 max-w-3xl">
                Are you a sports league, governing body, or technology provider ready to integrate with the future of club and membership management? Let's explore how Wingman Pro can deliver seamless data exchange and operational synergy.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-500 dark:to-blue-500 px-6 py-3 text-white hover:from-sky-500 hover:to-blue-500 dark:hover:from-sky-400 dark:hover:to-blue-400 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 duration-300 font-semibold"
                >
                  Connect with Us
                </a>
                <a
                  href="/affiliations"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-slate-300 dark:border-white/20 bg-white/80 backdrop-blur-sm px-6 py-3 text-slate-900 hover:bg-white dark:bg-white/5 dark:text-white dark:hover:bg-white/10 transition-all shadow-md hover:shadow-lg transform hover:scale-105 duration-300 font-semibold"
                >
                  Explore Affiliations
                </a>
              </div>
            </div>
          </section>
        </FadeIn>
      </div>
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}
