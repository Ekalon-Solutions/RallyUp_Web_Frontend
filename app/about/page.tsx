import type React from "react"
import Image from "next/image"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Building2,
  Rocket,
  Sparkles,
  Target,
  Users,
} from "lucide-react"

export const metadata = {
  title: "About Us | Wingman Pro",
  description: "Discover RallyUp Solutions and Wingman Pro—our mission, vision, and leadership powering supporter communities worldwide.",
}

export default function AboutPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white">
      <SiteNavbar />
      <div className="mx-auto max-w-7xl px-4 py-16">
        <FadeIn>
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">About Us: RallyUp Solutions & Wingman Pro</h1>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
              RallyUp Solutions Private Limited was founded to match the passion of sports communities with seamless, modern operations.
              Our flagship platform, Wingman Pro, transforms supporter group and club management into a unified, intelligent digital experience.
            </p>
          </div>
        </FadeIn>

        <FadeIn>
          <section className="mt-12 grid gap-6 md:grid-cols-2">
            <Card className="bg-white border-slate-200 dark:bg-white/5 dark:border-white/10">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="rounded-xl bg-sky-500/10 p-3 dark:bg-sky-400/10">
                  <Building2 className="h-7 w-7 text-sky-600 dark:text-sky-300" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-slate-900 dark:text-white">RallyUp Solutions Private Limited</CardTitle>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">
                    We engineer robust, scalable, and intelligent software for the global sports ecosystem, eliminating fragmentation and administrative overload that hinder growth and engagement.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="text-slate-600 dark:text-slate-300 space-y-3">
                <p>
                  From grassroots groups to professional bodies, we empower organizations to operate with the efficiency and insight required in the digital age.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 dark:bg-white/5 dark:border-white/10">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="rounded-xl bg-sky-500/10 p-3 dark:bg-sky-400/10">
                  <Rocket className="h-7 w-7 text-sky-600 dark:text-sky-300" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-slate-900 dark:text-white">Wingman Pro</CardTitle>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">
                    The realization of our mission: a single, secure platform integrating membership management, payments, communications, and events into one cohesive system.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="text-slate-600 dark:text-slate-300 space-y-3">
                <p>
                  Wingman Pro replaces the complexity of juggling multiple tools with an intuitive experience, giving managers and volunteers more time to grow communities and deliver exceptional matchday moments.
                </p>
              </CardContent>
            </Card>
          </section>
        </FadeIn>

        <FadeIn>
          <section className="mt-16 space-y-10">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-white border-slate-200 dark:bg-white/5 dark:border-white/10">
                <CardHeader className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-sky-600 dark:text-sky-300" />
                  <CardTitle className="text-xl text-slate-900 dark:text-white">Mission</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300">
                  To eliminate administrative fragmentation in sports organizations globally by providing a unified, intelligent platform that maximizes operational efficiency, compliance, and member engagement.
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-200 dark:bg-white/5 dark:border-white/10">
                <CardHeader className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-sky-600 dark:text-sky-300" />
                  <CardTitle className="text-xl text-slate-900 dark:text-white">Vision</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300">
                  To become the leading global technology partner for sports clubs and supporter groups, recognized for transforming community management through innovation and unparalleled user experience.
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">What We Do</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    title: "Centralized Membership Management",
                    description:
                      "Handle enrollment, maintain data integrity, manage access, and track member status from a single control center.",
                  },
                  {
                    title: "Integrated Commerce",
                    description:
                      "Manage ticketing, merchandise sales, and automated payments with end-to-end financial reporting and compliance.",
                  },
                  {
                    title: "Seamless Engagement",
                    description:
                      "Activate events, communications, and content delivery—including OTP via Email/SMS, polls, and leaderboards—with ease.",
                  },
                  {
                    title: "Compliance & Security",
                    description:
                      "Meet stringent security standards and global data protection requirements, including DPDPA and GDPR-aligned principles.",
                  },
                  {
                    title: "Gamification & AI",
                    description:
                      "Deliver intelligent engagement, performance leaderboards, actionable insights, automated content curation, and optimized communications using AI.",
                  },
                ].map((item) => (
                  <Card
                    key={item.title}
                    className="bg-white border-slate-200 dark:bg-white/5 dark:border-white/10"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg text-slate-900 dark:text-white">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-600 dark:text-slate-300">
                      {item.description}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">Leadership Team</h2>
            <p className="max-w-3xl text-slate-700 dark:text-slate-300 mb-10">
              Our leadership blends deep technical expertise with decades of experience in global operations, finance, and community administration—ensuring Wingman Pro solves real-world challenges with cutting-edge solutions.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  name: "Dr. Sunil Acharya",
                  title: "Managing Director, COO & CCO",
                  description:
                    "Over 40 years leading quality, audits, compliance, and operations. Guides RallyUp Solutions’ operational rigor and global security standards as the lead Operations and Compliance Officer.",
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
              ].map((leader) => (
                <Card
                  key={leader.name}
                  className="bg-white border-slate-200 dark:bg-white/5 dark:border-white/10 h-full"
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-16 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <Image
                          src={leader.image}
                          alt={leader.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-slate-900 dark:text-white">{leader.name}</CardTitle>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{leader.title}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-slate-600 dark:text-slate-300">
                    {leader.description}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section className="mt-16 rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-sky-500/10 p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white">Partner with RallyUp Solutions</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-6 max-w-3xl">
              Are you a sports league, governing body, or technology provider ready to integrate with the future of club and membership management? Let’s explore how Wingman Pro can deliver seamless data exchange and operational synergy.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-6 py-3 text-white hover:bg-sky-500 dark:bg-sky-400 dark:text-slate-900 dark:hover:bg-sky-300 transition-colors"
              >
                Connect with Us
              </a>
              <a
                href="/affiliations"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-white/20 bg-white px-6 py-3 text-slate-900 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 transition-colors"
              >
                Explore Affiliations
              </a>
            </div>
          </section>
        </FadeIn>
      </div>
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}


