"use client"

import type React from "react"
import Image from "next/image"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"
import { ParticleBackground } from "@/components/particle-background"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
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
} from "lucide-react"

export default function AffiliationsPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-white text-slate-900 relative overflow-x-hidden">
      <ParticleBackground />
      <SiteNavbar brandName="Wingman Pro" />

      <div className="mx-auto max-w-7xl px-4 py-16 relative z-10">
        <FadeIn>
          <div className="relative mb-12">
            {/* Puzzle Globe Image Background */}
            <div className="absolute right-0 top-0 w-1/2 max-w-md opacity-20 -z-0 hidden lg:block">
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
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-primary animate-scale-in mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <span className="text-sm font-medium text-primary leading-tight">Partnerships & Affiliations</span>
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold mb-4 text-background leading-tight">
                Our Affiliation <span className="text-primary">Ecosystem</span>
              </h1>
              <p className="text-[#666] leading-relaxed text-lg max-w-2xl">
                Wingman Pro, a flagship product of RallyUp Solutions Private Limited, connects supporter groups and sports organizations with the technology, infrastructure, and partnerships they need to thrive.
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeIn>
          <section className="mt-10 relative">
            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute top-0 left-0 w-96 h-96 bg-secondary-purple rounded-full blur-3xl animate-float" />
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-background leading-tight relative z-10">
              Technology Partners & <span className="text-primary">Infrastructure</span>
            </h2>
            <p className="text-[#666] mb-6 relative z-10 max-w-2xl">
              These alliances keep our platform secure, scalable, and always-on for supporter communities across the globe.
            </p>
            <div className="grid md:grid-cols-3 gap-6 relative z-10">
              {/* Card 1 */}
              <Card className="bg-secondary/30 border border-border hover:shadow-lg transition-all duration-300 group relative overflow-hidden animate-scale-in rounded-[20px]">
                <CardHeader className="flex flex-row items-center gap-3 relative z-10">
                  <div className="h-12 w-12 rounded-[14px] bg-primary flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-background text-lg font-bold">Payment Gateways</CardTitle>
                </CardHeader>
                <CardContent className="text-[#666] space-y-2 relative z-10 text-sm">
                  <p>
                    Seamless integrations with secure domestic and international payment processors like RazorPay to manage membership fees, merchandise, and ticketing.
                  </p>
                  <p>Supports multi-currency transactions and diverse payment types, including UPI.</p>
                </CardContent>
              </Card>
              {/* Card 2 */}
              <Card className="bg-secondary/30 border border-border hover:shadow-lg transition-all duration-300 group relative overflow-hidden animate-scale-in rounded-[20px]" style={{ animationDelay: '0.1s' }}>
                <CardHeader className="flex flex-row items-center gap-3 relative z-10">
                  <div className="h-12 w-12 rounded-[14px] bg-primary flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300">
                    <Cloud className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-background text-lg font-bold">Cloud Hosting</CardTitle>
                </CardHeader>
                <CardContent className="text-[#666] space-y-2 relative z-10 text-sm">
                  <p>
                    Built on leading global cloud providers to guarantee data security, low latency, and resilient operations backed by international compliance standards.
                  </p>
                </CardContent>
              </Card>
              {/* Card 3 */}
              <Card className="bg-secondary/30 border border-border hover:shadow-lg transition-all duration-300 group relative overflow-hidden animate-scale-in rounded-[20px]" style={{ animationDelay: '0.2s' }}>
                <CardHeader className="flex flex-row items-center gap-3 relative z-10">
                  <div className="h-12 w-12 rounded-[14px] bg-primary flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300">
                    <ShieldCheck className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-background text-lg font-bold">Auth Services</CardTitle>
                </CardHeader>
                <CardContent className="text-[#666] space-y-2 relative z-10 text-sm">
                  <p>
                    Integrated with trusted identity providers such as Google Firebase to deliver secure, rapid OTP-based authentication and identity management.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section className="mt-16 relative">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-background leading-tight">
              League & Organizational <span className="text-primary">Affiliates</span>
            </h2>
            <p className="text-[#666] mb-6 max-w-2xl">
              We collaborate with organizations that amplify value for our club network, expanding marketing reach, resources, and grassroots development.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-secondary/30 border border-border hover:shadow-lg transition-all duration-300 group relative overflow-hidden animate-scale-in rounded-[20px]">
                <CardHeader className="flex flex-row items-center gap-3 relative z-10">
                  <div className="h-12 w-12 rounded-[14px] bg-primary flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-background text-lg font-bold">Supporter Groups</CardTitle>
                </CardHeader>
                <CardContent className="text-[#666] relative z-10 text-sm">
                  Collaborations with global supporter networks to share best practices in member management and deliver shared knowledge among groups using Wingman Pro.
                </CardContent>
              </Card>
              <Card className="bg-secondary/30 border border-border hover:shadow-lg transition-all duration-300 group relative overflow-hidden animate-scale-in rounded-[20px]" style={{ animationDelay: '0.1s' }}>
                <CardHeader className="flex flex-row items-center gap-3 relative z-10">
                  <div className="h-12 w-12 rounded-[14px] bg-primary flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300">
                    <Handshake className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-background text-lg font-bold">Corporate Sponsors</CardTitle>
                </CardHeader>
                <CardContent className="text-[#666] relative z-10 text-sm">
                  Streamlined engagement channels between sponsors and our network of engaged supporter groups, unlocking new revenue opportunities for partner clubs.
                </CardContent>
              </Card>
              <Card className="bg-secondary/30 border border-border hover:shadow-lg transition-all duration-300 group relative overflow-hidden animate-scale-in rounded-[20px]" style={{ animationDelay: '0.2s' }}>
                <CardHeader className="flex flex-row items-center gap-3 relative z-10">
                  <div className="h-12 w-12 rounded-[14px] bg-primary flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300">
                    <Sprout className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-background text-lg font-bold">Youth Programs</CardTitle>
                </CardHeader>
                <CardContent className="text-[#666] relative z-10 text-sm">
                  Purpose-built tracking modules such as attendance and engagement scoring to document development, support grant obligations, and grow local communities.
                </CardContent>
              </Card>
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section className="mt-16 relative py-4">
            {/* Global Celebration Image */}
            <div className="absolute left-0 top-0 w-1/2 max-w-2xl opacity-10 -z-0 hidden xl:block">
              <div className="relative h-[400px] w-full animate-float" style={{ animationDelay: '1.5s' }}>
                <Image
                  src="/Webpage Assets 01.png"
                  alt="Global sports community"
                  fill
                  sizes="(max-width: 1280px) 0px, 800px"
                  className="object-contain"
                />
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-background leading-tight relative z-10">
              Global <span className="text-primary">Reach</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-6 relative z-10">
              <Card className="bg-secondary/30 border border-border hover:shadow-md transition-all duration-300 group rounded-[20px]">
                <CardHeader>
                  <CardTitle className="text-background text-lg font-bold flex items-center gap-3">
                    <div className="h-10 w-10 rounded-[12px] bg-primary flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    International Presence
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-[#666] space-y-3 text-sm">
                  <p>Wingman Pro serves supporter groups across multiple continents, bringing together fans from diverse backgrounds and cultures.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Asia-Pacific: India, Singapore, Malaysia, Indonesia, Thailand, Australia</li>
                    <li>Europe: United Kingdom, Germany, and growing presence</li>
                    <li>Americas: United States, Mexico</li>
                    <li>Middle East: UAE, expanding regionally</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-secondary/30 border border-border hover:shadow-md transition-all duration-300 group rounded-[20px]">
                <CardHeader>
                  <CardTitle className="text-background text-lg font-bold flex items-center gap-3">
                    <div className="h-10 w-10 rounded-[12px] bg-primary flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    Key Regions
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-[#666] space-y-3 text-sm">
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
          <section className="mt-16 relative">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-background leading-tight">
              Partnership <span className="text-primary">Benefits</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-5 rounded-[20px] bg-secondary/30 border border-border hover:shadow-md transition-all duration-300 group">
                  <div className="h-12 w-12 rounded-[14px] bg-primary flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-background mb-1 text-base">Club Solutions</h3>
                    <p className="text-[#666] text-sm">Dedicated platforms for professional clubs to manage membership, ticketing, and fan engagement.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 rounded-[20px] bg-secondary/30 border border-border hover:shadow-md transition-all duration-300 group">
                  <div className="h-12 w-12 rounded-[14px] bg-primary flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-background mb-1 text-base">Supporter Group Tools</h3>
                    <p className="text-[#666] text-sm">Complete toolkit for independent fan clubs including member management, events, and merchandise.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-5 rounded-[20px] bg-secondary/30 border border-border hover:shadow-md transition-all duration-300 group">
                  <div className="h-12 w-12 rounded-[14px] bg-primary flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-background mb-1 text-base">Community Building</h3>
                    <p className="text-[#666] text-sm">Features designed to strengthen connections between fans, clubs, and local communities.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 rounded-[20px] bg-secondary/30 border border-border hover:shadow-md transition-all duration-300 group">
                  <div className="h-12 w-12 rounded-[14px] bg-primary flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                    <Handshake className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-background mb-1 text-base">Custom Partnerships</h3>
                    <p className="text-[#666] text-sm">Tailored solutions and integrations for organizations with specific needs and requirements.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section className="mt-20 rounded-[32px] border border-border bg-secondary-purple p-8 md:p-12 relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-background leading-tight">
                Interested in <span className="text-primary">Partnering?</span>
              </h2>
              <p className="text-[#666] mb-8 max-w-xl text-lg">
                Whether you're a football club, supporter group, or football organization, we'd love to explore how Wingman Pro can support your community.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-[5px] bg-primary px-8 h-10 text-white font-medium text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm"
                >
                  Contact Us
                </a>
                <a
                  href="/clubs"
                  className="inline-flex items-center justify-center rounded-[5px] border border-border bg-white px-8 h-10 text-background font-medium text-xs uppercase tracking-wider hover:bg-gray-50 transition-all shadow-sm"
                >
                  Create Your Club
                </a>
              </div>
            </div>
          </section>
        </FadeIn>
      </div>
      <SiteFooter brandName="Wingman Pro" />
      <ScrollToTop />
    </main>
  )
}
