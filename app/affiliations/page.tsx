"use client"

import type React from "react"
import Image from "next/image"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"
import { JellyCursor } from "@/components/jelly-cursor"
import { ParticleBackground } from "@/components/particle-background"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowRight,
  Building2,
  Cloud,
  CreditCard,
  Globe,
  Handshake,
  MapPin,
  ShieldCheck,
  Sprout,
  Trophy,
  Users,
  Sparkles,
} from "lucide-react"

export default function AffiliationsPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white relative overflow-x-hidden">
      <JellyCursor />
      <ParticleBackground />
      <SiteNavbar />
      
      <div className="mx-auto max-w-7xl px-4 py-16 relative z-10">
        <FadeIn>
          <div className="relative mb-12">
            {/* Puzzle Globe Image Background */}
            <div className="absolute right-0 top-0 w-1/2 max-w-md opacity-15 dark:opacity-8 -z-0 hidden lg:block">
              <div className="relative h-[400px] w-full animate-float">
                <Image
                  src="/Webpage Assets 03.png"
                  alt="Global partnership and organization"
                  fill
                  sizes="(max-width: 1024px) 0px, 400px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="max-w-3xl relative z-10">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="relative h-11 w-40 sm:h-12 sm:w-48 animate-scale-in">
                  <Image
                    src="/WingmanPro Logo (White BG).svg"
                    alt="Wingman Pro logo"
                    fill
                    sizes="(max-width: 640px) 160px, 192px"
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="relative h-10 w-40 sm:h-11 sm:w-48 animate-scale-in" style={{ animationDelay: '0.1s' }}>
                  <Image
                    src="/RallyUpSolutions Logo (Transparent Background).svg"
                    alt="RallyUp Solutions logo"
                    fill
                    sizes="(max-width: 640px) 160px, 192px"
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 mb-4 animate-scale-in">
                <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400 animate-pulse" />
                <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">Partnerships & Affiliations</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-sky-800 to-blue-900 dark:from-white dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent">
                Our Affiliation Ecosystem
              </h1>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                Wingman Pro, a flagship product of RallyUp Solutions Private Limited, connects supporter groups and sports organizations with the technology, infrastructure, and partnerships they need to thrive.
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeIn>
          <section className="mt-10 relative">
            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute top-0 left-0 w-96 h-96 bg-sky-200/20 dark:bg-sky-900/10 rounded-full blur-3xl animate-float" />
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-slate-900 dark:text-white bg-gradient-to-r from-slate-900 via-sky-800 to-blue-900 dark:from-white dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent relative z-10">
              Technology Partners & Infrastructure
            </h2>
            <p className="text-slate-700 dark:text-slate-300 mb-6 relative z-10">
              These alliances keep our platform secure, scalable, and always-on for supporter communities across the globe.
            </p>
            <div className="grid md:grid-cols-3 gap-6 relative z-10">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 hover:shadow-2xl hover:scale-105 transition-all duration-500 group relative overflow-hidden animate-scale-in">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <CardHeader className="flex flex-row items-center gap-3 relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-slate-900 dark:text-white">Payment Gateways</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300 space-y-2 relative z-10">
                  <p>
                    Seamless integrations with secure domestic and international payment processors like RazorPay to manage membership
                    fees, merchandise, and ticketing.
                  </p>
                  <p>Supports multi-currency transactions and diverse payment types, including UPI.</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-2 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 hover:shadow-2xl hover:scale-105 transition-all duration-500 group relative overflow-hidden animate-scale-in" style={{ animationDelay: '0.1s' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <CardHeader className="flex flex-row items-center gap-3 relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Cloud className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-slate-900 dark:text-white">Cloud Hosting & Infrastructure</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300 space-y-2 relative z-10">
                  <p>
                    Built on leading global cloud providers to guarantee data security, low latency, and resilient operations backed by
                    international compliance standards.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-2 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 hover:shadow-2xl hover:scale-105 transition-all duration-500 group relative overflow-hidden animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <CardHeader className="flex flex-row items-center gap-3 relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <ShieldCheck className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-slate-900 dark:text-white">Authentication Services</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300 space-y-2 relative z-10">
                  <p>
                    Integrated with trusted identity providers such as Google Firebase to deliver secure, rapid OTP-based authentication
                    and identity management.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section className="mt-10 relative">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-slate-900 dark:text-white bg-gradient-to-r from-slate-900 via-sky-800 to-blue-900 dark:from-white dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent">
              League & Organizational Affiliates
            </h2>
            <p className="text-slate-700 dark:text-slate-300 mb-6">
              We collaborate with organizations that amplify value for our club network, expanding marketing reach, resources, and grassroots development.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 border-2 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 hover:shadow-2xl hover:scale-105 transition-all duration-500 group relative overflow-hidden animate-scale-in">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <CardHeader className="flex flex-row items-center gap-3 relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-slate-900 dark:text-white">Supporter Group Networks</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300 relative z-10">
                  Collaborations with global supporter networks to share best practices in member management and deliver shared knowledge among groups using Wingman Pro.
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-2 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 hover:shadow-2xl hover:scale-105 transition-all duration-500 group relative overflow-hidden animate-scale-in" style={{ animationDelay: '0.1s' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <CardHeader className="flex flex-row items-center gap-3 relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Handshake className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-slate-900 dark:text-white">Corporate Sponsors</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300 relative z-10">
                  Streamlined engagement channels between sponsors and our network of engaged supporter groups, unlocking new revenue opportunities for partner clubs.
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-2 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 hover:shadow-2xl hover:scale-105 transition-all duration-500 group relative overflow-hidden animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <CardHeader className="flex flex-row items-center gap-3 relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Sprout className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-slate-900 dark:text-white">Youth & Grassroots Programs</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300 relative z-10">
                  Purpose-built tracking modules such as attendance and engagement scoring to document development, support grant obligations, and grow local communities.
                </CardContent>
              </Card>
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section className="mt-12 relative">
            {/* Global Celebration Image */}
            <div className="absolute left-0 top-0 w-1/2 max-w-2xl opacity-10 dark:opacity-5 -z-0 hidden xl:block">
              <div className="relative h-[500px] w-full animate-float" style={{ animationDelay: '1.5s' }}>
                <Image
                  src="/Webpage Assets 01.png"
                  alt="Global sports community"
                  fill
                  sizes="(max-width: 1280px) 0px, 800px"
                  className="object-contain"
                />
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-slate-900 dark:text-white bg-gradient-to-r from-slate-900 via-sky-800 to-blue-900 dark:from-white dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent relative z-10">
              Global Reach
            </h2>
            <div className="grid md:grid-cols-2 gap-6 relative z-10">
              <Card className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 border-2 border-slate-200 dark:border-white/10 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    International Presence
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300 space-y-3">
                  <p>Wingman Pro serves supporter groups across multiple continents, bringing together fans from diverse backgrounds and cultures.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Asia-Pacific: India, Singapore, Malaysia, Indonesia, Thailand, Australia</li>
                    <li>Europe: United Kingdom, Germany, and growing presence</li>
                    <li>Americas: United States, Mexico</li>
                    <li>Middle East: UAE, expanding regionally</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-2 border-slate-200 dark:border-white/10 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    Key Regions
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300 space-y-3">
                  <p>Our platform supports clubs and groups in major football markets with localized features and compliance.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>South Asian football communities</li>
                    <li>European supporter groups</li>
                    <li>North American soccer clubs</li>
                    <li>Southeast Asian football networks</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section className="mt-12 relative">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-slate-900 dark:text-white bg-gradient-to-r from-slate-900 via-sky-800 to-blue-900 dark:from-white dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent">
              Partnership Benefits
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 border-2 border-slate-200 dark:border-white/10 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Club Solutions</h3>
                    <p>Dedicated platforms for professional clubs to manage membership, ticketing, and fan engagement.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-2 border-slate-200 dark:border-white/10 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Supporter Group Tools</h3>
                    <p>Complete toolkit for independent fan clubs including member management, events, and merchandise.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-slate-200 dark:border-white/10 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Community Building</h3>
                    <p>Features designed to strengthen connections between fans, clubs, and local communities.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-2 border-slate-200 dark:border-white/10 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0">
                    <Handshake className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Custom Partnerships</h3>
                    <p>Tailored solutions and integrations for organizations with specific needs and requirements.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section className="mt-12 rounded-3xl border-2 border-slate-200 dark:border-white/10 bg-gradient-to-br from-sky-500/10 via-blue-500/10 to-indigo-500/10 dark:from-sky-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 p-8 md:p-10 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(56,189,248,0.1),transparent_50%)]" />
            
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white bg-gradient-to-r from-sky-700 to-blue-700 dark:from-sky-300 dark:to-blue-300 bg-clip-text text-transparent">
                Interested in Partnering?
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-6">
                Whether you're a football club, supporter group, or football organization, we'd love to explore how Wingman Pro can support your community.
              </p>
              <div className="flex flex-wrap gap-3">
                <a 
                  href="/contact" 
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-500 dark:to-blue-500 px-6 py-3 text-white hover:from-sky-500 hover:to-blue-500 dark:hover:from-sky-400 dark:hover:to-blue-400 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 duration-300 font-semibold"
                >
                  Contact Us
                </a>
                <a 
                  href="/clubs" 
                  className="inline-flex items-center justify-center rounded-lg border-2 border-slate-300 dark:border-white/20 bg-white/80 backdrop-blur-sm px-6 py-3 text-slate-900 hover:bg-white dark:bg-white/5 dark:text-white dark:hover:bg-white/10 transition-all shadow-md hover:shadow-lg transform hover:scale-105 duration-300 font-semibold"
                >
                  Create Your Club
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
