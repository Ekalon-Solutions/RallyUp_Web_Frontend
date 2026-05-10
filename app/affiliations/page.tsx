"use client"

import type React from "react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"

import Image from "next/image"

export default function AffiliationsPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-white text-slate-900 relative overflow-x-clip font-sans public-theme">
      <SiteNavbar brandName="Wingman Pro" />

      {/* Top Section */}
      <section className="relative isolate w-full py-12 lg:py-15 flex flex-col justify-center min-h-[60vh]">
        {/* Faint background graphic */}
        <div className="absolute -bottom-32 right-0 w-[25rem] h-[25rem] lg:w-[35rem] lg:h-[35rem] opacity-60 pointer-events-none select-none z-[-5]">
          <Image src="/VectorLeft.svg" alt="" fill className="object-contain object-right-bottom" />
        </div>
        
        <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 w-full">
          <FadeIn>
            <div className="relative z-10 max-w-3xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-primary my-12">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <span className="text-[#E18F67] text-[10px] font-medium leading-tight">
                  Partnerships & Affiliations
                </span>
              </div>

              <h1 className="text-5xl font-extrabold mb-6 text-background tracking-tight leading-[1.1]">
                Our <span className="text-primary">Affiliation</span> Ecosystem
              </h1>
              
              <p className="text-background text-lg md:text-xl mb-12 max-w-2xl leading-relaxed">
                Connecting supporter groups and sports organizations with the technology, infrastructure, and partnerships they need to thrive.
              </p>

              <div className="flex flex-col md:flex-row flex-wrap gap-5">
                {/* Stat Card 1 */}
                <div className="w-full md:w-auto flex items-center gap-4 bg-[#EEF6F0] rounded-2xl p-4 pr-12 border border-green-50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-xl bg-[#67B18A] flex items-center justify-center shadow-sm">
                    <Image src="/globalicon.svg" alt="Global Icon" width={28} height={28} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-semibold text-background mr-1">4<span className="text-[#67B18A]">+</span></span>
                    <span className="text-sm text-background font-medium">Continents</span>
                  </div>
                </div>

                {/* Stat Card 2 */}
                <div className="w-full md:w-auto flex items-center gap-4 bg-[#F2EFFF] rounded-2xl p-4 pr-12 border border-purple-50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-xl bg-[#665D96] flex items-center justify-center shadow-sm">
                    <Image src="/locationicon.svg" alt="Location Icon" width={28} height={28} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-semibold text-background mr-1">10<span className="text-[#665D96]">+</span></span>
                    <span className="text-sm text-background font-medium">Markets</span>
                  </div>
                </div>

                {/* Stat Card 3 */}
                <div className="w-full md:w-auto flex items-center gap-4 bg-[#FDF2EC] rounded-2xl p-4 pr-12 border border-orange-50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-xl bg-[#E28D69] flex items-center justify-center shadow-sm">
                    <Image src="/baricon.svg" alt="Features Icon" width={28} height={28} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-semibold text-background mr-1">5<span className="text-[#E28D69]">+</span></span>
                    <span className="text-sm text-background font-medium">Core Features</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="relative z-10 bg-[#E2DCE7] py-16 md:py-20 lg:py-24 border-t border-[#D5CFDA]">
        <FadeIn>
          <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            {/* Badge */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-base text-primary">Technology Partners & Infrastructure</span>
            </div>

            <h2 className="text-4xl lg:text-6xl font-extrabold mb-6 text-background tracking-tight leading-[1.1]">
              Built to <span className="text-primary">Scale.</span>
            </h2>

            <p className="text-secondary text-lg md:text-xl mb-16 max-w-2xl">
              These alliances keep our platform secure, scalable, and always-on for supporter communities across the globe.
            </p>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {/* Card 1 */}
              <div className="hidden md:block group relative w-full h-64 [perspective:1000px]">
                <div className="w-full h-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                  {/* Front Face */}
                  <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-white rounded-3xl px-8 py-2 flex flex-col items-center justify-center text-center gap-5 shadow-sm border border-black/5">
                    <div className="w-14 h-14 rounded-2xl bg-[#44867B] flex items-center justify-center shadow-sm mb-2">
                      <Image src="/affiliationslogo/Framepayment.svg" alt="Payment Gateways" width={32} height={32} />
                    </div>
                    <h3 className="text-background text-lg">Payment Gateways</h3>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#00A68A] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
                    <div className="inline-flex items-center justify-center rounded-full border border-white/50 px-3 py-1 mb-4">
                      <span className="text-[10px] text-white font-medium tracking-wide uppercase">Wingman Pro</span>
                    </div>
                    <h3 className="text-lg text-white font-medium mb-3">Seamless Payments</h3>
                    <p className="text-xs leading-relaxed text-white/90">
                      Secure integrations with RazorPay and international processors. Multi-currency support including UPI — covering membership fees, merchandise, and ticketing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="hidden md:block group relative w-full h-64 [perspective:1000px]">
                <div className="w-full h-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                  {/* Front Face */}
                  <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-[#A093B8] rounded-3xl px-8 py-2 flex flex-col items-center justify-center text-center gap-5 shadow-md border border-black/5">
                    <div className="w-14 h-14 rounded-2xl bg-[#6668A1] flex items-center justify-center shadow-sm mb-2">
                      <Image src="/affiliationslogo/Framecloud.svg" alt="Cloud Hosting" width={32} height={32} />
                    </div>
                    <h3 className="text-white text-lg leading-snug">Cloud Hosting &<br/>Infrastructure</h3>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#6668A1] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
                    <div className="inline-flex items-center justify-center rounded-full border border-white/50 px-3 py-1 mb-4">
                      <span className="text-[10px] text-white font-medium tracking-wide uppercase">Wingman Pro</span>
                    </div>
                    <h3 className="text-lg text-white font-medium mb-3">Always On</h3>
                    <p className="text-xs leading-relaxed text-white/90">
                      Built on leading global cloud providers guaranteeing data security, low latency, and resilient operations backed by international compliance standards.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="hidden md:block group relative w-full h-64 [perspective:1000px]">
                <div className="w-full h-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                  {/* Front Face */}
                  <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-white rounded-3xl px-8 py-2 flex flex-col items-center justify-center text-center gap-5 shadow-sm border border-black/5">
                    <div className="w-14 h-14 rounded-2xl bg-[#E18F67] flex items-center justify-center shadow-sm mb-2">
                      <Image src="/affiliationslogo/Frameauthentication.svg" alt="Authentication Services" width={32} height={32} />
                    </div>
                    <h3 className="text-background text-lg leading-snug">Authentication<br/>Services</h3>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#F14921] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
                    <div className="inline-flex items-center justify-center rounded-full border border-white/50 px-3 py-1 mb-4">
                      <span className="text-[10px] text-white font-medium tracking-wide uppercase">Wingman Pro</span>
                    </div>
                    <h3 className="text-lg text-white font-medium mb-3">Trusted Identity</h3>
                    <p className="text-xs leading-relaxed text-white/90">
                      Integrated with Google Firebase to deliver secure, rapid OTP-based authentication and identity management for every user on the platform.
                    </p>
                  </div>
                </div>
              </div>
              {/* Card 1 */}
              <div className="md:hidden bg-white rounded-3xl p-8 flex flex-col items-start text-left gap-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-[#44867B] flex items-center justify-center shadow-sm mb-2">
                  <Image 
                    src="/affiliationslogo/Vectorpayment.png" 
                    alt="Payment Gateways" 
                    width={32} 
                    height={32}
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </div>
                <h3 className="text-background text-lg">Payment Gateways</h3>
                <p className="text-[#8598C7] text-sm leading-relaxed max-w-sm">
                  Secure transaction processing for memberships, donations, and merchandise sales.
                </p>
              </div>

              {/* Card 2 */}
              <div className="md:hidden bg-[#A093B8] rounded-3xl p-8 flex flex-col items-start text-left gap-4 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-[#6668A1] flex items-center justify-center shadow-sm mb-2">
                  <Image src="/affiliationslogo/Framecloud.svg" alt="Cloud Hosting" width={32} height={32} />
                </div>
                <h3 className="text-white text-lg">Cloud Hosting & Infrastructure</h3>
                <p className="text-black text-sm leading-relaxed max-w-sm">
                  Reliable, scalable servers to ensure your group's digital presence is always online.
                </p>
              </div>

              {/* Card 3 */}
              <div className="md:hidden bg-white rounded-3xl p-8 flex flex-col items-start text-left gap-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-[#E18F67] flex items-center justify-center shadow-sm mb-2">
                  <Image src="/affiliationslogo/Frameauthentication.svg" alt="Authentication Services" width={32} height={32} />
                </div>
                <h3 className="text-background text-lg">Authentication Services</h3>
                <p className="text-[#8598C7] text-sm leading-relaxed max-w-sm">
                  Secure user logins and identity verification to protect member data.
                </p>
              </div>
              {/* Card 1 */}
              <div className="md:hidden bg-white rounded-3xl p-8 flex flex-col items-start text-left gap-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-[#44867B] flex items-center justify-center shadow-sm mb-2">
                  <Image 
                    src="/affiliationslogo/Vectorpayment.png" 
                    alt="Payment Gateways" 
                    width={32} 
                    height={32}
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </div>
                <h3 className="text-background text-lg">Payment Gateways</h3>
                <p className="text-[#8598C7] text-sm leading-relaxed max-w-sm">
                  Secure transaction processing for memberships, donations, and merchandise sales.
                </p>
              </div>

              {/* Card 2 */}
              <div className="md:hidden bg-[#A093B8] rounded-3xl p-8 flex flex-col items-start text-left gap-4 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-[#6668A1] flex items-center justify-center shadow-sm mb-2">
                  <Image src="/affiliationslogo/Framecloud.svg" alt="Cloud Hosting" width={32} height={32} />
                </div>
                <h3 className="text-white text-lg">Cloud Hosting & Infrastructure</h3>
                <p className="text-black text-sm leading-relaxed max-w-sm">
                  Reliable, scalable servers to ensure your group's digital presence is always online.
                </p>
              </div>

              {/* Card 3 */}
              <div className="md:hidden bg-white rounded-3xl p-8 flex flex-col items-start text-left gap-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-[#E18F67] flex items-center justify-center shadow-sm mb-2">
                  <Image src="/affiliationslogo/Frameauthentication.svg" alt="Authentication Services" width={32} height={32} />
                </div>
                <h3 className="text-background text-lg">Authentication Services</h3>
                <p className="text-[#8598C7] text-sm leading-relaxed max-w-sm">
                  Secure user logins and identity verification to protect member data.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* What You Get Section */}
      <section className="py-16 md:py-20 lg:py-24 bg-white relative">
        <FadeIn>
          <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-base text-primary">Partnership Benefits</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-extrabold mb-12 text-background tracking-tight leading-[1.1]">
              What <span className="text-primary">You Get.</span>
            </h2>

            <div className="grid md:grid-cols-5 gap-6">
              {/* Card 1 */}
              <div className="group md:col-span-3 bg-[#222222] hover:bg-[#444444] rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300 min-h-[18rem] md:min-h-[22rem]">
                <span className="absolute font-[600] top-2 right-2 md:top-auto md:bottom-4 md:right-6 text-[6rem] md:text-[8rem] text-[#2A2A2A] group-hover:text-[#2E2E2E] transition-colors duration-300 leading-none pointer-events-none select-none z-0">
                  01
                </span>
                <div className="w-14 h-14 rounded-xl bg-[#8A8A8A] flex items-center justify-center relative z-10 mt-2 md:mt-0">
                  <Image src="/affiliationslogo/Frametrophy.svg" alt="Club Solutions" width={28} height={28} />
                </div>
                <div className="mt-auto pt-12 relative z-10 w-full">
                  <h3 className="font-bold text-white text-3xl mb-3">Club Solutions</h3>
                  <p className="text-[#A3A3A3] text-base leading-relaxed max-w-xl">
                    Dedicated platforms for professional clubs to manage membership, ticketing, and fan engagement — everything in one place.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="group md:col-span-2 bg-[#786FBB] hover:bg-[#8A8EE9] rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300 min-h-[18rem] md:min-h-[22rem]">
                <span className="absolute font-[600] top-2 right-2 md:top-4 md:right-6 text-[6rem] md:text-[8rem] text-[#6961A3] group-hover:text-[#797CCB] transition-colors duration-300 leading-none pointer-events-none select-none z-0">02</span>
                <div className="w-14 h-14 rounded-xl bg-[#D6D3F0] flex items-center justify-center relative z-10 mt-2 md:mt-0">
                  <Image src="/affiliationslogo/Framecommunity.svg" alt="Community Building" width={28} height={28} />
                </div>
                <div className="mt-auto pt-12 relative z-10 w-full">
                  <h3 className="font-bold text-white text-3xl mb-3">Community Building</h3>
                  <p className="text-[#E0DDF0] text-base leading-relaxed max-w-sm">
                    Features designed to strengthen connections between fans, clubs, and local communities.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="group md:col-span-2 bg-[#D8D5FB] hover:bg-[#BCBDFF] rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300 min-h-[18rem] md:min-h-[22rem]">
                <span className="absolute font-[600] top-2 right-2 md:top-4 md:right-6 text-[6rem] md:text-[8rem] text-[#E9E6FF] group-hover:text-[#DEDFFF] transition-colors duration-300 leading-none pointer-events-none select-none z-0">
                03</span>
              <div className="w-14 h-14 rounded-xl bg-[#8076B9] flex items-center justify-center relative z-10 mt-2 md:mt-0">
                  <Image src="/affiliationslogo/Vectortool.svg" alt="Supporter Group Tools" width={28} height={28} />
                </div>
                <div className="mt-auto pt-12 relative z-10 w-full">
                  <h3 className="font-bold text-[#6D6392] text-3xl mb-3 group-hover:text-[#4A4363] transition-colors duration-300">Supporter Group Tools</h3>
                  <p className="text-[#6D6392] text-base leading-relaxed max-w-sm group-hover:text-[#4A4363] transition-colors duration-300">
                    Complete toolkit for independent fan clubs — member management, events, and merchandise built in.
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="group md:col-span-3 bg-[#E4D9DF] hover:bg-[#D8BBEE] rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300 min-h-[18rem] md:min-h-[22rem]">
                <span className="absolute font-[600] top-2 right-2 md:top-auto md:bottom-4 md:right-6 text-[6rem] md:text-[8rem] text-[#F4ECF0] group-hover:text-[#E7DFED] transition-colors duration-300 leading-none pointer-events-none select-none z-0">04</span>
                <div className="w-14 h-14 rounded-xl bg-[#7B6A76] flex items-center justify-center relative z-10 mt-2 md:mt-0">
                  <Image src="/affiliationslogo/Framepartnership.svg" alt="Custom Partnerships" width={28} height={28} />
                </div>
                <div className="mt-auto pt-12 relative z-10 w-full">
                  <h3 className="font-bold text-[#564954] text-3xl mb-3 group-hover:text-[#2E2E2E] transition-colors duration-300">Custom Partnerships</h3>
                  <p className="text-[#6C5E6A] text-base leading-relaxed max-w-xl group-hover:text-[#4A4A4A] transition-colors duration-300">
                    Tailored solutions and integrations for organizations with specific needs and requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Who We Work With Section */}
      <section className="py-16 md:py-20 lg:py-24 bg-white relative">
        <FadeIn>
          <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-base text-primary">League & Organizational Affiliates</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-extrabold mb-12 text-background tracking-tight leading-[1.1]">
              Who We <span className="text-primary">Work With.</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="group bg-[#D9DBFF] hover:bg-[#BCBDFF] rounded-3xl p-8 relative overflow-hidden flex flex-col items-start md:items-center text-left md:text-center hover:shadow-lg transition-all duration-300 min-h-[18rem]">
                <span className="hidden md:flex md:absolute font-[600] top-2 right-2 md:top-4 md:right-6 text-[6.25rem]  text-[#BFC3FF] group-hover:text-[#DEDFFF] transition-colors duration-300 leading-none pointer-events-none select-none z-0">
                  01
                </span>

                <div className="w-14 h-14 rounded-xl bg-[#7D7FBC] flex items-center justify-center mb-6 relative z-10 mt-2">
                  <Image
                    src="/affiliationslogo/Framesupporter.svg"
                    alt="Supporter Group Networks"
                    width={28}
                    height={28}
                  />
                </div>

                <div className="mt-auto relative z-10 w-full flex flex-col items-start md:items-center">
                  <h3 className="text-background text-lg mb-4">
                    Supporter Group Networks
                  </h3>

                  <p className="text-[#7D7FBC] text-sm leading-relaxed max-w-sm group-hover:text-[#5B5D99] transition-colors duration-300">
                    Collaborations with global supporter networks — sharing best practices
                    in member management and delivering shared knowledge among Wingman Pro
                    communities.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="group bg-[#E4DCDF] hover:bg-[#D8BBEE] rounded-3xl p-8 relative overflow-hidden flex flex-col items-start md:items-center text-left md:text-center hover:shadow-lg transition-all duration-300 min-h-[18rem]">
                <span className="hidden md:flex absolute font-[600] top-2 right-2 md:top-4 md:right-6 text-[6.25rem]  text-[#D0C7CC] group-hover:text-[#E7DFED] transition-colors duration-300 leading-none pointer-events-none select-none z-0">
                  02
                </span>

                <div className="w-14 h-14 rounded-xl bg-[#A2919A] flex items-center justify-center mb-6 relative z-10 mt-2">
                  <Image
                    src="/affiliationslogo/Vectorcorporate.svg"
                    alt="Corporate Sponsors"
                    width={28}
                    height={28}
                  />
                </div>

                <div className="mt-auto relative z-10 w-full flex flex-col items-start md:items-center">
                  <h3 className="text-background text-lg mb-4">
                    Corporate Sponsors
                  </h3>

                  <p className="text-[#A2919A] text-sm leading-relaxed max-w-sm group-hover:text-[#7A6B73] transition-colors duration-300">
                    Streamlined engagement channels between sponsors and our network of
                    engaged supporter groups — unlocking new revenue opportunities for
                    partner clubs.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="group bg-[#9AE69D] hover:bg-[#7FD483] rounded-3xl p-8 relative overflow-hidden flex flex-col items-start md:items-center text-left md:text-center hover:shadow-lg transition-all duration-300 min-h-[18rem]">
                <span className="hidden md:flex absolute font-[600] top-2 right-2 md:top-4 md:right-6 text-[6.25rem]  text-[#86CD89] group-hover:text-[#B3EDB6] transition-colors duration-300 leading-none pointer-events-none select-none z-0">
                  03
                </span>

                <div className="w-14 h-14 rounded-xl bg-[#5C9460] flex items-center justify-center mb-6 relative z-10 mt-2">
                  <Image
                    src="/affiliationslogo/Framegrassroots.svg"
                    alt="Youth & Grassroots Programs"
                    width={28}
                    height={28}
                  />
                </div>

                <div className="mt-auto relative z-10 w-full flex flex-col items-start md:items-center">
                  <h3 className="text-background text-lg mb-4">
                    Youth & Grassroots Programs
                  </h3>

                  <p className="text-[#5C9460] text-sm leading-relaxed max-w-sm group-hover:text-[#3B663E] transition-colors duration-300">
                    Purpose-built tracking for attendance and engagement scoring —
                    documenting development, supporting grant obligations, and growing
                    local communities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Global Reach Section */}
      <section className="py-16 md:py-20 lg:py-24 bg-[#222222] relative overflow-hidden">
        {/* Large faint background text */}
        <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none select-none overflow-hidden">
          <span
            className="text-6xl md:text-8xl lg:text-9xl text-[#353434] tracking-wider leading-none whitespace-nowrap"
            style={{ fontFamily: "var(--font-purple-purse)" }}
          >
            GLOBAL
          </span>
        </div>

        <FadeIn>
          <div className="max-w-8xl mx-auto relative z-10 px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#67B18A]" />
              <span className="text-base text-[#67B18A]">Global Reach</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-extrabold mb-16 text-white tracking-tight leading-[1.1]">
              We're <span className="text-[#67B18A]">Everywhere.</span>
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="group rounded-3xl border-2 border-white/10 bg-[#2A2A2A]/50 backdrop-blur-sm p-8 flex flex-col justify-start hover:bg-primary/20 hover:border-primary transition-all duration-300 min-h-[16.25rem]">
                <div className="w-14 h-14 rounded-xl bg-[#665D96] flex items-center justify-center mb-8">
                  <Image src="/affiliationslogo/Frameasia.svg" alt="Asia-Pacific Icon" width={28} height={28} />
                </div>
                <h3 className="font-bold text-white text-xl mb-3">Asia-Pacific</h3>
                <p className="text-[#A291B1] text-sm leading-relaxed">
                  India • Singapore • Malaysia
                  <br />
                  Indonesia • Thailand • Australia
                </p>
              </div>

              {/* Card 2 */}
              <div className="group rounded-3xl border-2 border-white/10 bg-[#2A2A2A]/50 backdrop-blur-sm p-8 flex flex-col justify-start hover:bg-primary/20 hover:border-primary transition-all duration-300 min-h-[16.25rem]">
                <div className="w-14 h-14 rounded-xl bg-[#E28D69] flex items-center justify-center mb-8">
                  <Image src="/affiliationslogo/Framemiddleeast.svg" alt="Middle East Icon" width={28} height={28} />
                </div>
                <h3 className="font-bold text-white text-xl mb-3">Middle East</h3>
                <p className="text-[#A291B1] text-sm leading-relaxed">
                  UAE
                  <br />
                  & expanding regionally
                </p>
              </div>

              {/* Card 3 */}
              <div className="group rounded-3xl border-2 border-white/10 bg-[#2A2A2A]/50 backdrop-blur-sm p-8 flex flex-col justify-start hover:bg-primary/20 hover:border-primary transition-all duration-300 min-h-[16.25rem]">
                <div className="w-14 h-14 rounded-xl bg-[#A2919A] flex items-center justify-center mb-8">
                  <Image src="/affiliationslogo/Frameamericas.svg" alt="Americas Icon" width={28} height={28} />
                </div>
                <h3 className="font-bold text-white text-xl mb-3">Americas</h3>
                <p className="text-[#A291B1] text-sm leading-relaxed">
                  United States • Mexico
                </p>
              </div>

              {/* Card 4 */}
              <div className="group rounded-3xl border-2 border-white/10 bg-[#2A2A2A]/50 backdrop-blur-sm p-8 flex flex-col justify-start hover:bg-primary/20 hover:border-primary transition-all duration-300 min-h-[16.25rem]">
                <div className="w-14 h-14 rounded-xl bg-[#67B18A] flex items-center justify-center mb-8">
                  <Image src="/affiliationslogo/Frameeurope.svg" alt="Europe Icon" width={28} height={28} />
                </div>
                <h3 className="font-bold text-white text-xl mb-3">Europe</h3>
                <p className="text-[#A291B1] text-sm leading-relaxed">
                  United Kingdom • Germany
                  <br />
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
          <div className="relative overflow-hidden bg-[linear-gradient(to_right,#DCD4E2_50%,#8598C7_100%)]">
          {/* Exact geometric line pattern */}
          <svg
              className="hidden md:block absolute inset-0 w-full h-full"
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

          {/* CONTENT */}
          <div className="relative z-10 px-6 py-16 md:py-14 flex flex-col items-center text-center">
            <span className="text-primary font-medium text-base tracking-wide mb-6">
              Interested in Partnering?
            </span>

            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-none text-black">
              Let's Build{" "}
              <span className="text-primary">Together.</span>
            </h2>

            <p className="mt-8 max-w-3xl text-secondary text-xl md:text-lg font-medium">
              Whether you're a football club, supporter group, or football
              organization — we'd love to explore how Wingman Pro can support your
              community.
            </p>

            <a
              href="/contact"
              className="mt-12 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-12 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#FF7E4A] hover:shadow-[0_8px_20px_#FF5C1A6B]"
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

