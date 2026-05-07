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
    Smartphone,
    ShieldCheck,
    Puzzle,
    BarChart3
} from "lucide-react"

export default function AboutPage(): React.JSX.Element {
    return (
        <main className="min-h-screen bg-white text-background relative overflow-x-hidden">
            {/* <JellyCursor /> */}
            <ParticleBackground />
            <SiteNavbar />

            <div className="mx-auto max-w-7xl px-6 py-8 lg:py-12 relative z-10">
                {/* Hero Section */}
                <FadeIn>
                    <div className="mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2A2A2A] mb-8">
                            <div className="w-2 h-2 rounded-full bg-[#FF4F2B]" />
                            <span className="text-sm font-semibold text-[#FF4F2B] tracking-wide">About RallyUp Solutions</span>
                        </div>
                        
                        <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 text-[#1A1A1A] tracking-tight leading-[1.1]">
                            Built for <span className="text-[#FF4F2B]">The Game.</span>
                        </h1>
                        
                        <p className="text-gray-600 text-lg md:text-xl max-w-2xl leading-relaxed">
                            RallyUp Solutions was founded to match the passion of sports communities with seamless, modern operations — and Wingman Pro is how we deliver on that promise.
                        </p>
                    </div>
                </FadeIn>

                <FadeIn>
                    <section className="grid md:grid-cols-2 gap-6">
                        {/* Card 1 */}
                        <div className="bg-[#E4DEE3] rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-start hover:shadow-lg transition-shadow">
                            <span className="absolute top-4 right-6 text-[8.75rem] font-black text-[#D6CDD4] leading-none pointer-events-none select-none font-sans">R</span>
                            <div className="w-20 h-20 rounded-2xl bg-[#5D5377] flex items-center justify-center mb-8 relative z-10 p-3 shadow-md">
                                <Image
                                    src="/RallyUpSolutions Logo (Transparent Background).svg"
                                    alt="RallyUp Solutions"
                                    width={48}
                                    height={48}
                                    className="object-contain"
                                />
                            </div>
                            <h3 className="font-bold text-[#1A1A1A] text-2xl mb-4 relative z-10">RallyUp Solutions Private Limited</h3>
                            <p className="text-[#5D5377] text-base leading-relaxed relative z-10">
                                We engineer robust, scalable, and intelligent software for the global sports ecosystem — eliminating fragmentation and administrative overload that hinder growth and engagement. From grassroots groups to professional bodies, we empower organizations to operate with the efficiency and insight required in the digital age.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-[#D9DCFA] rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-start hover:shadow-lg transition-shadow">
                            <span className="absolute top-4 right-6 text-[8.75rem] font-black text-[#C9CDF4] leading-none pointer-events-none select-none font-sans">W</span>
                            <div className="w-20 h-20 rounded-2xl bg-[#7D7FBC] flex items-center justify-center mb-8 relative z-10 p-3 shadow-md">
                                <Image
                                    src="/Logo.svg"
                                    alt="Wingman Pro"
                                    width={48}
                                    height={48}
                                    className="object-contain"
                                />
                            </div>
                            <h3 className="font-bold text-[#1A1A1A] text-2xl mb-4 relative z-10">Wingman Pro</h3>
                            <p className="text-[#65679B] text-base leading-relaxed relative z-10">
                                The realization of our mission: a single, secure platform that brings membership management, payments, communications, and events into one seamless system. Wingman Pro replaces multiple tools with an intuitive experience, freeing managers and volunteers to focus on growing communities and delivering great matchday moments.
                            </p>
                        </div>
                    </section>
                </FadeIn>
            </div>

            {/* Why We Exist Section */}
            <section className="py-24 px-4 bg-[#222222] relative w-full overflow-hidden">
                {/* Large faint background text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                    <span 
                        className="text-6xl md:text-8xl lg:text-10xl text-[#353434] tracking-wider text-center"
                        style={{ fontFamily: 'var(--font-purple-purse)' }}
                    >
                        TARGET
                    </span>
                </div>

                <FadeIn>
                    <div className="mx-auto max-w-7xl relative z-10">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#67B18A]" />
                            <span className="text-base font-semibold text-[#67B18A]">Our North Star</span>
                        </div>
                        <h2 className="text-4xl lg:text-6xl font-extrabold mb-12 md:mb-16 text-white tracking-tight leading-[1.1]">
                            Why We <span className="text-[#67B18A]">Exist.</span>
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                            {/* Mission Card */}
                            <div className="rounded-3xl border border-white/10 bg-[#2A2A2A]/50 backdrop-blur-sm p-8 md:p-12 flex flex-col justify-start hover:bg-[#333333]/80 transition-colors">
                                <span className="text-[#67B18A] font-semibold text-base mb-6 md:mb-8 block">Mission</span>
                                <h3 className="font-bold text-white text-3xl md:text-4xl mb-6 md:mb-8 leading-[1.3] tracking-wide">
                                    Unified.<br/>
                                    Efficient.<br/>
                                    Compliant.
                                </h3>
                                <p className="text-[#A3A3A3] text-base leading-relaxed">
                                    To eliminate administrative fragmentation in sports organizations globally by providing a unified, intelligent platform that maximizes operational efficiency, compliance, and member engagement.
                                </p>
                            </div>

                            {/* Vision Card */}
                            <div className="rounded-3xl border border-white/10 bg-[#2A2A2A]/50 backdrop-blur-sm p-8 md:p-12 flex flex-col justify-start hover:bg-[#333333]/80 transition-colors">
                                <span className="text-[#67B18A] font-semibold text-base mb-6 md:mb-8 block">Vision</span>
                                <h3 className="font-bold text-white text-3xl md:text-4xl mb-6 md:mb-8 leading-[1.3] tracking-wide">
                                    Leading.<br/>
                                    Global.<br/>
                                    Trusted.
                                </h3>
                                <p className="text-[#A3A3A3] text-base leading-relaxed">
                                    To become the leading global technology partner for sports clubs and supporter groups, recognized for transforming community management through innovation and unparalleled user experience.
                                </p>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </section>

            <div className="mx-auto max-w-7xl px-4 pb-16 lg:pb-24 relative z-10 pt-16">
                <FadeIn>
                    <section className="space-y-10 relative">
                        {/* Background Decoration */}
                        <div className="absolute inset-0 -z-10 overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-purple/50 rounded-full blur-3xl animate-float" />
                        </div>

                        <div className="relative z-10 mb-8">
                            <div className="inline-flex items-center gap-2 mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FF4F2B]" />
                                <span className="text-base font-semibold text-[#FF4F2B] tracking-wide">What We Do</span>
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1] mb-12">
                                Five Core Features. <span className="text-[#FF4F2B]">One Platform.</span>
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                {/* Card 1 */}
                                <div className="md:col-span-7 bg-[#2A2A2A] rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow min-h-[17.5rem]">
                                    <span className="absolute bottom-[-5%] right-6 text-[7.5rem] md:text-[10rem] font-black text-white/[0.04] leading-none pointer-events-none select-none">01</span>
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-16 relative z-10 backdrop-blur-sm">
                                        <Users className="w-7 h-7 text-white" strokeWidth={1.5} />
                                    </div>
                                    <div className="relative z-10 mt-auto">
                                        <h3 className="font-bold text-white text-2xl mb-3">Membership Management</h3>
                                        <p className="text-[#A3A3A3] text-base leading-relaxed md:max-w-[85%]">
                                            Handle enrollment, maintain data integrity, manage access, and track member status from a single control center.
                                        </p>
                                    </div>
                                </div>

                                {/* Card 2 */}
                                <div className="md:col-span-5 bg-[#7D7FBC] rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow min-h-[17.5rem]">
                                    <span className="absolute top-4 right-6 text-[7.5rem] md:text-[10rem] font-black text-white/[0.1] leading-none pointer-events-none select-none">02</span>
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-16 relative z-10 backdrop-blur-sm">
                                        <BarChart3 className="w-7 h-7 text-white" strokeWidth={1.5} />
                                    </div>
                                    <div className="relative z-10 mt-auto">
                                        <h3 className="font-bold text-white text-2xl mb-3">Integrated Commerce</h3>
                                        <p className="text-[#D6D7F5] text-base leading-relaxed">
                                            Manage ticketing, merchandise, and payments with full reporting and compliance.
                                        </p>
                                    </div>
                                </div>

                                {/* Card 3 */}
                                <div className="md:col-span-5 bg-[#D6D7FA] rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow min-h-[17.5rem]">
                                    <span className="absolute top-4 right-6 text-[7.5rem] md:text-[10rem] font-black text-[#C5C8F2] leading-none pointer-events-none select-none">03</span>
                                    <div className="w-14 h-14 rounded-2xl bg-[#7D7FBC] flex items-center justify-center mb-16 relative z-10 shadow-md">
                                        <Smartphone className="w-7 h-7 text-white" strokeWidth={1.5} />
                                    </div>
                                    <div className="relative z-10 mt-auto">
                                        <h3 className="font-bold text-[#7D7FBC] text-2xl mb-3">Seamless Engagement</h3>
                                        <p className="text-[#65679B] text-base leading-relaxed">
                                            Activate events, communications, and content—like OTP via Email/SMS, polls, and leaderboards—with ease.
                                        </p>
                                    </div>
                                </div>

                                {/* Card 4 */}
                                <div className="md:col-span-7 bg-[#E4DEE3] rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow min-h-[17.5rem]">
                                    <span className="absolute bottom-[-5%] right-6 text-[7.5rem] md:text-[10rem] font-black text-[#D5CBD4] leading-none pointer-events-none select-none">04</span>
                                    <div className="w-14 h-14 rounded-2xl bg-[#5D5377] flex items-center justify-center mb-16 relative z-10 shadow-md">
                                        <ShieldCheck className="w-7 h-7 text-white" strokeWidth={1.5} />
                                    </div>
                                    <div className="relative z-10 mt-auto">
                                        <h3 className="font-bold text-[#5D5377] text-2xl mb-3">Compliance & Security</h3>
                                        <p className="text-[#756A8F] text-base leading-relaxed md:max-w-[85%]">
                                            Meet stringent security standards and global data protection requirements, including DPDPA and GDPR-aligned principles.
                                        </p>
                                    </div>
                                </div>

                                {/* Card 5 */}
                                <div className="md:col-span-12 bg-[#C2DEF5] rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition-shadow min-h-[15rem] items-stretch">
                                    <span className="absolute bottom-[-5%] right-6 text-[7.5rem] md:text-[10rem] font-black text-[#A6C6E6] leading-none pointer-events-none select-none">05</span>
                                    
                                    <div className="flex flex-col justify-between relative z-10 w-full md:w-1/3">
                                        <div className="w-14 h-14 rounded-2xl bg-[#1D4ED8] flex items-center justify-center mb-8 md:mb-12 shadow-md">
                                            <Puzzle className="w-7 h-7 text-white" strokeWidth={1.5} />
                                        </div>
                                        <h3 className="font-bold text-[#1D4ED8] text-2xl mt-auto">Gamification & AI</h3>
                                    </div>
                                    
                                    <div className="hidden md:block w-px bg-[#1D4ED8]/20 mx-8 self-stretch relative z-10" />
                                    
                                    <div className="mt-6 md:mt-0 relative z-10 flex items-center w-full md:w-2/3">
                                        <p className="text-[#1E3A8A] text-base md:text-lg leading-relaxed font-medium md:max-w-[85%]">
                                            Deliver intelligent engagement, performance leaderboards, actionable insights, automated content curation, and optimized communications using AI.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </FadeIn>


            </div>

            {/* Leadership & CTA Section */}
            <section className="relative w-full pt-24 pb-32 overflow-hidden bg-[#E4DEE3]">
                {/* Background Intersecting Lines & Gradients */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-0 w-full h-[60%] bg-gradient-to-t from-[#8089BA]/80 via-[#D0D4EE]/40 to-transparent" />
                    <svg className="absolute w-[200%] h-[200%] -bottom-[50%] -left-[50%] opacity-[0.03] stroke-black" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line x1="0" y1="100" x2="100" y2="0" strokeWidth="0.1" />
                        <line x1="0" y1="0" x2="100" y2="100" strokeWidth="0.1" />
                        <line x1="20" y1="100" x2="100" y2="20" strokeWidth="0.1" />
                        <line x1="0" y1="80" x2="80" y2="0" strokeWidth="0.1" />
                    </svg>
                </div>

                <FadeIn>
                    {/* Leadership Team Header */}
                    <div className="mx-auto max-w-7xl px-4 mb-12 relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF4F2B]" />
                            <span className="text-base font-semibold text-[#FF4F2B] tracking-wide">Leadership Team</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1]">
                            The <span className="text-[#FF4F2B]">People</span> Behind It.
                        </h2>
                    </div>

                    {/* Leadership Team Grid */}
                    <div className="mx-auto max-w-7xl px-4 mb-32 relative z-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    name: "Dr. Sunil Acharya",
                                    title: "Managing Director, COO & CCO",
                                    image: "/Sunil.png",
                                },
                                {
                                    name: "Dr. Neeta Acharya",
                                    title: "Managing Director, CMO & CFO",
                                    image: "/Neeta.png",
                                },
                                {
                                    name: "Mihir Chheda",
                                    title: "CTO, Wingman Pro & Partner",
                                    image: "/Mihir.png",
                                },
                                {
                                    name: "Ankit Ameria",
                                    title: "Partner & Chief Sales Officer,\nWingman Pro",
                                    image: "/Ankit.png",
                                },
                            ].map((leader, i) => (
                                <div key={leader.name} className="bg-white rounded-3xl p-8 md:p-10 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-start relative z-10 border border-white/50">
                                    <div className="w-24 h-24 rounded-full bg-[#E5DFE6] mb-8 overflow-hidden relative shadow-sm">
                                        <Image
                                            src={leader.image}
                                            alt={leader.name}
                                            fill
                                            className="object-cover hover:scale-110 transition-transform duration-500"
                                            sizes="96px"
                                        />
                                    </div>
                                    <h3 className="font-bold text-[#1A1A1A] text-xl mb-3">{leader.name}</h3>
                                    <p className="text-[#65679B] text-base font-medium leading-relaxed whitespace-pre-wrap">
                                        {leader.title}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeIn>

                <FadeIn>
                    {/* CTA Section */}
                    <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
                        <span className="text-[#FF4F2B] font-semibold text-base mb-4 block tracking-wide">
                            Partner with RallyUp Solutions
                        </span>
                        <h2 className="text-4xl lg:text-6xl font-extrabold mb-8 text-[#1A1A1A] tracking-tight leading-[1.1]">
                            Let's Build <span className="text-[#FF4F2B]">The Future.</span>
                        </h2>
                        <p className="text-[#5D5377] text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                            Are you a sports league, governing body, or technology provider ready to integrate with the future of club and membership management?
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="/contact"
                                className="inline-flex items-center justify-center rounded-lg bg-[#FF4F2B] px-8 py-4 text-white hover:bg-[#E04525] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-300 font-bold tracking-wide text-sm"
                            >
                                CONTACT US
                            </a>
                            <a
                                href="/affiliations"
                                className="inline-flex items-center justify-center rounded-lg bg-[#65679B] px-8 py-4 text-white hover:bg-[#525482] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-300 font-bold tracking-wide text-sm"
                            >
                                EXPLORE AFFILIATIONS
                            </a>
                        </div>
                    </div>
                </FadeIn>
            </section>
            <SiteFooter />
            <ScrollToTop />
        </main>
    )
}
