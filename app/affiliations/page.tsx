"use client"

import type React from "react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"
import {
  Cloud,
  CreditCard,
  Globe,
  MapPin,
  ShieldCheck,
  Trophy,
  Users,
  Wrench,
  Handshake,
  Briefcase,
  Sprout,
  ChartNoAxesColumnIncreasing,
} from "lucide-react"
import Image from "next/image"

export default function AffiliationsPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-white text-slate-900 relative overflow-x-hidden font-sans">
      <SiteNavbar brandName="Wingman Pro" />

      {/* Top Section */}
      <section className="relative w-full py-20 lg:py-32 flex flex-col justify-center min-h-[60vh]">
        {/* Faint background graphic */}
        <div className="absolute -bottom-32 right-0 w-[30rem] h-[30rem] lg:w-[40rem] lg:h-[40rem] opacity-60 pointer-events-none select-none">
          <Image src="/VectorLeft.svg" alt="" fill className="object-contain object-right-bottom" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 w-full">
          <FadeIn>
            <div className="relative z-10 max-w-3xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2A2A2A] mb-8">
                <div className="w-2 h-2 rounded-full bg-[#FF4F2B]" />
                <span className="text-sm font-semibold text-[#FF4F2B] tracking-wide">Partnerships & Affiliations</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 text-[#1A1A1A] tracking-tight leading-[1.1]">
                Our <span className="text-[#FF4F2B]">Affiliation</span> Ecosystem
              </h1>
              
              <p className="text-gray-600 text-lg md:text-xl mb-12 max-w-2xl leading-relaxed">
                Connecting supporter groups and sports organizations with the technology, infrastructure, and partnerships they need to thrive.
              </p>

              <div className="flex flex-wrap gap-5">
                {/* Stat Card 1 */}
                <div className="flex items-center gap-4 bg-[#EEF6F0] rounded-2xl p-4 pr-12 border border-green-50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-xl bg-[#67B18A] flex items-center justify-center shadow-sm">
                    <Globe className="text-white w-7 h-7" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-[#1A1A1A] leading-tight">4+</span>
                    <span className="text-sm text-gray-800 font-medium">Continents</span>
                  </div>
                </div>

                {/* Stat Card 2 */}
                <div className="flex items-center gap-4 bg-[#F2EFFF] rounded-2xl p-4 pr-12 border border-purple-50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-xl bg-[#665D96] flex items-center justify-center shadow-sm">
                    <MapPin className="text-white w-7 h-7" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-[#1A1A1A] leading-tight">10+</span>
                    <span className="text-sm text-gray-800 font-medium">Markets</span>
                  </div>
                </div>

                {/* Stat Card 3 */}
                <div className="flex items-center gap-4 bg-[#FDF2EC] rounded-2xl p-4 pr-12 border border-orange-50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-xl bg-[#E28D69] flex items-center justify-center shadow-sm">
                    <ChartNoAxesColumnIncreasing className="text-white w-7 h-7" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-[#1A1A1A] leading-tight">5+</span>
                    <span className="text-sm text-gray-800 font-medium">Core Features</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="relative z-10 bg-[#E2DCE7] py-24 px-4 border-t border-[#D5CFDA]">
        <FadeIn>
          <div className="max-w-7xl mx-auto">
            {/* Badge */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF4F2B]" />
              <span className="text-base font-semibold text-[#FF4F2B]">Technology Partners & Infrastructure</span>
            </div>

            <h2 className="text-4xl lg:text-6xl font-extrabold mb-6 text-[#1A1A1A] tracking-tight leading-[1.1]">
              Built to <span className="text-[#FF4F2B]">Scale.</span>
            </h2>

            <p className="text-[#6D6392] text-lg md:text-xl mb-16 max-w-2xl font-medium leading-relaxed">
              These alliances keep our platform secure, scalable, and always-on for supporter communities across the globe.
            </p>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {/* Card 1 */}
              <div className="bg-white rounded-3xl px-8 py-2 flex flex-col items-center justify-center text-center gap-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 h-52">
                <div className="w-14 h-14 rounded-2xl bg-[#44867B] flex items-center justify-center shadow-sm mb-2">
                  <CreditCard className="text-white w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-background text-lg">Payment Gateways</h3>
              </div>

              {/* Card 2 */}
              <div className="bg-[#A093B8] rounded-3xl px-8 py-2 flex flex-col items-center justify-center text-center gap-5 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 h-52">
                <div className="w-14 h-14 rounded-2xl bg-[#6668A1] flex items-center justify-center shadow-sm mb-2">
                  <Cloud className="text-white w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-white text-lg leading-snug">Cloud Hosting &<br/>Infrastructure</h3>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-3xl px-8 py-2 flex flex-col items-center justify-center text-center gap-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 h-52">
                <div className="w-14 h-14 rounded-2xl bg-[#E18F67] flex items-center justify-center shadow-sm mb-2">
                  <ShieldCheck className="text-white w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-background text-lg leading-snug">Authentication<br/>Services</h3>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* What You Get Section */}
      <section className="py-24 px-4 bg-white relative">
        <FadeIn>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF4F2B]" />
              <span className="text-base font-semibold text-[#FF4F2B]">Partnership Benefits</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-extrabold mb-12 text-[#1A1A1A] tracking-tight leading-[1.1]">
              What <span className="text-[#FF4F2B]">You Get.</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Card 1 */}
              <div className="bg-[#222222] rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-start hover:shadow-lg transition-shadow min-h-72">
                <span className="absolute -bottom-4 -right-4 text-[8.75rem] font-black text-[#2A2A2A] leading-none pointer-events-none select-none">01</span>
                <div className="w-14 h-14 rounded-xl bg-[#8A8A8A] flex items-center justify-center mb-6 relative z-10">
                  <Trophy className="text-[#242424] w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-white text-2xl mb-3 relative z-10">Club Solutions</h3>
                <p className="text-[#A3A3A3] text-base leading-relaxed relative z-10 max-w-sm">
                  Dedicated platforms for professional clubs to manage membership, ticketing, and fan engagement — everything in one place.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-[#786FBB] rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-start hover:shadow-lg transition-shadow min-h-72">
                <span className="absolute -top-6 -right-4 text-[8.75rem] font-black text-[#6961A3] leading-none pointer-events-none select-none">02</span>
                <div className="w-14 h-14 rounded-xl bg-[#D6D3F0] flex items-center justify-center mb-6 relative z-10">
                  <Users className="text-[#786FBB] w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-white text-2xl mb-3 relative z-10">Community Building</h3>
                <p className="text-[#E0DDF0] text-base leading-relaxed relative z-10 max-w-sm">
                  Features designed to strengthen connections between fans, clubs, and local communities.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-[#D8D5FB] rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-start hover:shadow-lg transition-shadow min-h-72">
                <span className="absolute -top-6 -right-4 text-[8.75rem] font-black text-[#E9E6FF] leading-none pointer-events-none select-none">03</span>
                <div className="w-14 h-14 rounded-xl bg-[#8076B9] flex items-center justify-center mb-6 relative z-10">
                  <Wrench className="text-white w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-[#6D6392] text-2xl mb-3 relative z-10">Supporter Group Tools</h3>
                <p className="text-[#6D6392] text-base leading-relaxed relative z-10 max-w-sm">
                  Complete toolkit for independent fan clubs — member management, events, and merchandise built in.
                </p>
              </div>

              {/* Card 4 */}
              <div className="bg-[#E4D9DF] rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-start hover:shadow-lg transition-shadow min-h-72">
                <span className="absolute -bottom-4 -right-4 text-[8.75rem] font-black text-[#F4ECF0] leading-none pointer-events-none select-none">04</span>
                <div className="w-14 h-14 rounded-xl bg-[#7B6A76] flex items-center justify-center mb-6 relative z-10">
                  <Handshake className="text-white w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-[#564954] text-2xl mb-3 relative z-10">Custom Partnerships</h3>
                <p className="text-[#6C5E6A] text-base leading-relaxed relative z-10 max-w-sm">
                  Tailored solutions and integrations for organizations with specific needs and requirements.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Who We Work With Section */}
      <section className="py-24 px-4 bg-white relative">
        <FadeIn>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF4F2B]" />
              <span className="text-base font-semibold text-[#FF4F2B]">League & Organizational Affiliates</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-extrabold mb-12 text-[#1A1A1A] tracking-tight leading-[1.1]">
              Who We <span className="text-[#FF4F2B]">Work With.</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-[#D9DBFF] rounded-3xl p-8 relative overflow-hidden flex flex-col items-center text-center hover:shadow-lg transition-shadow min-h-72">
                <span className="absolute -top-2 right-4 text-[6.25rem] font-black text-[#BFC3FF] leading-none pointer-events-none select-none">01</span>
                <div className="w-14 h-14 rounded-xl bg-[#7D7FBC] flex items-center justify-center mb-6 relative z-10">
                  <Handshake className="text-white w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-lg mb-4 relative z-10">Supporter Group Networks</h3>
                <p className="text-[#7D7FBC] text-sm leading-relaxed relative z-10 max-w-sm">
                  Collaborations with global supporter networks — sharing best practices in member management and delivering shared knowledge among Wingman Pro communities.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-[#E4DCDF] rounded-3xl p-8 relative overflow-hidden flex flex-col items-center text-center hover:shadow-lg transition-shadow min-h-72">
                <span className="absolute -top-2 right-4 text-[6.25rem] font-black text-[#D0C7CC] leading-none pointer-events-none select-none">02</span>
                <div className="w-14 h-14 rounded-xl bg-[#A2919A] flex items-center justify-center mb-6 relative z-10">
                  <Briefcase className="text-white w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-lg mb-4 relative z-10">Corporate Sponsors</h3>
                <p className="text-[#A2919A] text-sm leading-relaxed relative z-10 max-w-sm">
                  Streamlined engagement channels between sponsors and our network of engaged supporter groups — unlocking new revenue opportunities for partner clubs.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-[#9AE69D] rounded-3xl p-8 relative overflow-hidden flex flex-col items-center text-center hover:shadow-lg transition-shadow min-h-72">
                <span className="absolute -top-2 right-4 text-[6.25rem] font-black text-[#86CD89] leading-none pointer-events-none select-none">03</span>
                <div className="w-14 h-14 rounded-xl bg-[#5C9460] flex items-center justify-center mb-6 relative z-10">
                  <Sprout className="text-white w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] text-lg mb-4 relative z-10">Youth & Grassroots Programs</h3>
                <p className="text-[#5C9460] text-sm leading-relaxed relative z-10 max-w-sm">
                  Purpose-built tracking for attendance and engagement scoring — documenting development, supporting grant obligations, and growing local communities.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Global Reach Section */}
      <section className="py-24 px-4 bg-[#222222] relative overflow-hidden">
        {/* Large faint background text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span 
            className="text-6xl md:text-8xl lg:text-9xl text-[#353434] tracking-wider text-center"
            style={{ fontFamily: 'var(--font-purple-purse)' }}
          >
            GLOBAL
          </span>
        </div>

        <FadeIn>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#67B18A]" />
              <span className="text-base font-semibold text-[#67B18A]">Global Reach</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-extrabold mb-16 text-white tracking-tight leading-[1.1]">
              We're <span className="text-[#67B18A]">Everywhere.</span>
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="rounded-3xl border border-white/10 bg-[#2A2A2A]/50 backdrop-blur-sm p-8 flex flex-col justify-start hover:bg-[#333333]/80 transition-colors min-h-[16.25rem]">
                <div className="w-14 h-14 rounded-xl bg-[#665D96] flex items-center justify-center mb-8">
                  <Globe className="text-white w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-white text-xl mb-3">Asia-Pacific</h3>
                <p className="text-[#A3A3A3] text-sm leading-relaxed">
                  India • Singapore • Malaysia<br/>
                  Indonesia • Thailand • Australia
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-3xl border border-white/10 bg-[#2A2A2A]/50 backdrop-blur-sm p-8 flex flex-col justify-start hover:bg-[#333333]/80 transition-colors min-h-[16.25rem]">
                <div className="w-14 h-14 rounded-xl bg-[#E28D69] flex items-center justify-center mb-8">
                  <Globe className="text-white w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-white text-xl mb-3">Middle East</h3>
                <p className="text-[#A3A3A3] text-sm leading-relaxed">
                  UAE<br/>
                  & expanding regionally
                </p>
              </div>

              {/* Card 3 */}
              <div className="rounded-3xl border border-white/10 bg-[#2A2A2A]/50 backdrop-blur-sm p-8 flex flex-col justify-start hover:bg-[#333333]/80 transition-colors min-h-[16.25rem]">
                <div className="w-14 h-14 rounded-xl bg-[#A2919A] flex items-center justify-center mb-8">
                  <Globe className="text-white w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-white text-xl mb-3">Americas</h3>
                <p className="text-[#A3A3A3] text-sm leading-relaxed">
                  United States • Mexico
                </p>
              </div>

              {/* Card 4 */}
              <div className="rounded-3xl border border-white/10 bg-[#2A2A2A]/50 backdrop-blur-sm p-8 flex flex-col justify-start hover:bg-[#333333]/80 transition-colors min-h-[16.25rem]">
                <div className="w-14 h-14 rounded-xl bg-[#67B18A] flex items-center justify-center mb-8">
                  <Globe className="text-white w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-white text-xl mb-3">Europe</h3>
                <p className="text-[#A3A3A3] text-sm leading-relaxed">
                  United Kingdom • Germany<br/>
                  & growing presence
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* CTA Section */}
      <div className="w-full">
        <FadeIn>
          <div className="rounded-none relative overflow-hidden bg-gradient-to-br from-[#DCD4E2] to-[#8598C7] border-0">
            {/* Decorative background lines */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <line x1="-20%" y1="120%" x2="120%" y2="-20%" stroke="currentColor" strokeWidth="1" className="text-[#FF4F2B]/30" />
                <line x1="-20%" y1="-20%" x2="120%" y2="120%" stroke="currentColor" strokeWidth="1" className="text-blue-500/20" />
                <line x1="20%" y1="120%" x2="120%" y2="20%" stroke="currentColor" strokeWidth="1" className="text-[#FF4F2B]/20" />
                <line x1="-20%" y1="20%" x2="80%" y2="-20%" stroke="currentColor" strokeWidth="1" className="text-blue-500/20" />
                <line x1="50%" y1="120%" x2="120%" y2="50%" stroke="currentColor" strokeWidth="1" className="text-[#FF4F2B]/10" />
              </svg>
            </div>
            
            <div className="relative z-10 px-6 py-24 md:py-32 flex flex-col items-center text-center space-y-6">
              <span className="text-[#FF4F2B] font-medium text-base tracking-wide">Interested in Partnering?</span>
              <h2 className="text-4xl lg:text-6xl font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1] mb-2">
                Let's Build <span className="text-[#FF4F2B]">Together.</span>
              </h2>
              <p className="text-[#5D5377] max-w-2xl text-lg md:text-xl font-medium leading-relaxed pb-6">
                Whether you're a football club, supporter group, or football organization — we'd love to explore how Wingman Pro can support your community.
              </p>
              <a 
                href="/contact" 
                className="inline-flex h-14 items-center justify-center rounded-lg bg-[#FF4F2B] px-10 text-sm font-bold text-white shadow-lg shadow-[#FF4F2B]/20 transition-transform hover:-translate-y-1 hover:shadow-xl active:translate-y-0 uppercase tracking-[0.1em]"
              >
                Contact Us
              </a>
            </div>
          </div>
        </FadeIn>
      </div>

      <SiteFooter brandName="Wingman Pro" />
      <ScrollToTop />
    </main>
  )
}

