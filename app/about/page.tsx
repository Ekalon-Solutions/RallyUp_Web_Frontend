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
import { Button } from "@/components/ui/button"
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
        <main className="min-h-screen bg-white text-background relative overflow-x-clip public-theme">
            {/* <JellyCursor /> */}
            <ParticleBackground />
            <SiteNavbar />

              <section className="relative w-full py-12 lg:py-15 flex flex-col justify-center min-h-[60vh]">
                <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 w-full">
                    {/* Hero Section */}
                    <FadeIn>
                    <div className="mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-primary my-12">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            <span className="text-[#E18F67] text-[10px] font-medium leading-tight">
                                About RallyUp Solutions
                            </span>
                        </div>
                        
                        <h1 className="md:text-4xl text-4xl lg:text-5xl font-bold mb-6 text-[#1A1A1A] tracking-tight leading-[1.1]">
                            Built for <span className="text-primary">The Game.</span>
                        </h1>
                        
                        <p className="text-background text-base md:text-lg max-w-2xl leading-relaxed">
                            RallyUp Solutions was founded to match the passion of sports communities with seamless, modern operations — and Wingman Pro is how we deliver on that promise.
                        </p>
                    </div>
                </FadeIn>

                <FadeIn>
                    <section className="grid md:grid-cols-2 gap-6">
                        {/* Card 1 */}
                        <div className="bg-[#DCD4E2] hover:bg-[#CBAEE1] rounded-xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-start shadow-[0px_4px_24px_#00000040] transition-shadow">
                            <span className="absolute top-4 right-6 text-[7rem] font-black text-[#E3DCE8] leading-none pointer-events-none select-none font-sans">R</span>
                            <div className="w-14 h-14 rounded-xl bg-[#5D5377] flex items-center justify-center mb-6 relative z-10 p-2 shadow-md">
                                <Image
                                    src="/RallyUpSolutions Logo (Transparent Background).svg"
                                    alt="RallyUp Solutions"
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                />
                            </div>
                            <h3 className="font-bold text-[#1A1A1A] text-xl mb-3 relative z-10">RallyUp Solutions Private Limited</h3>
                            <p className="text-[#675477] text-sm leading-relaxed relative z-10">
                                We engineer robust, scalable, and intelligent software for the global sports ecosystem — eliminating fragmentation and administrative overload that hinder growth and engagement. From grassroots groups to professional bodies, we empower organizations to operate with the efficiency and insight required in the digital age.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-[#D4D5FB] hover:bg-[#B8BAFF] rounded-xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-start shadow-[0px_4px_24px_#00000040] transition-shadow">
                            <span className="absolute top-4 right-6 text-[7rem] font-black text-[#E3DCE8] leading-none pointer-events-none select-none font-sans">W</span>
                            <div className="w-14 h-14 rounded-xl bg-[#7D7FBC] flex items-center justify-center mb-6 relative z-10 p-2 shadow-md">
                                <Image
                                    src="/Logo.svg"
                                    alt="Wingman Pro"
                                    width={42}
                                    height={42}
                                    className="object-contain"
                                />
                            </div>
                            <h3 className="font-bold text-[#1A1A1A] text-xl mb-3 relative z-10">Wingman Pro</h3>
                            <p className="text-[#6668A1] text-sm leading-relaxed relative z-10">
                                The realization of our mission: a single, secure platform that brings membership management, payments, communications, and events into one seamless system. Wingman Pro replaces multiple tools with an intuitive experience, freeing managers and volunteers to focus on growing communities and delivering great matchday moments.
                            </p>
                        </div>
                    </section>
                </FadeIn>
                </div>
            </section>

            {/* Why We Exist Section */}
            <section className="py-16 md:py-20 lg:py-24 bg-[#222222] relative w-full overflow-hidden">
                {/* Large faint background text */}
                <div className="hidden md:flex  absolute top-1/2 -translate-y-[65%] flex items-center justify-center pointer-events-none select-none z-0 w-full">
                    <span 
                        className="text-[160px] text-[#353434] tracking-wider"
                        style={{ fontFamily: 'var(--font-purple-purse)' }}
                    >
                        TARGET
                    </span>
                </div>

                <FadeIn>
                    <div className="max-w-8xl mx-auto relative z-10 px-6 sm:px-8 lg:px-12 xl:px-16">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#67B18A]" />
                            <span className="text-base font-semibold text-[#67B18A]">Our North Star</span>
                        </div>
                        <h2 className="text-3xl lg:text-5xl font-extrabold mb-12 md:mb-16 text-white tracking-tight leading-[1.1]">
                            Why We <span className="text-[#67B18A]">Exist.</span>
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6 md:gap-8">

                            {/* Mission Card */}
                            <div className="group rounded-3xl border-2 border-white/10 bg-[#2A2A2A]/50 backdrop-blur-sm p-8 md:p-12 flex flex-col justify-start hover:border-primary hover:bg-[#333333]/80 transition-all duration-300">

                                <span className="text-[#67B18A] group-hover:text-primary font-semibold text-base mb-6 md:mb-8 block transition-colors duration-300">
                                    Mission
                                </span>

                                <h3 className="font-bold text-white text-2xl md:text-3xl mb-6 md:mb-8 leading-[1.3] tracking-wide transition-colors duration-300">
                                    Unified.<br />
                                    Efficient.<br />
                                    Compliant.
                                </h3>

                                <p className="text-[#A3A3A3] group-hover:text-[#E18F67] text-sm leading-relaxed transition-colors duration-300">
                                    To eliminate administrative fragmentation in sports organizations globally by providing a unified, intelligent platform that maximizes operational efficiency, compliance, and member engagement.
                                </p>
                            </div>

                            {/* Vision Card */}
                            <div className="group rounded-3xl border-2 border-white/10 bg-[#2A2A2A]/50 backdrop-blur-sm p-8 md:p-12 flex flex-col justify-start hover:border-primary hover:bg-[#333333]/80 transition-all duration-300">

                                <span className="text-[#67B18A] group-hover:text-primary font-semibold text-base mb-6 md:mb-8 block transition-colors duration-300">
                                    Vision
                                </span>

                                <h3 className="font-bold text-white text-2xl md:text-3xl mb-6 md:mb-8 leading-[1.3] tracking-wide transition-colors duration-300">
                                    Leading.<br />
                                    Global.<br />
                                    Trusted.
                                </h3>

                                <p className="text-[#A3A3A3] group-hover:text-[#E18F67] text-sm leading-relaxed transition-colors duration-300">
                                    To become the leading global technology partner for sports clubs and supporter groups, recognized for transforming community management through innovation and unparalleled user experience.
                                </p>
                            </div>

                        </div>
                    </div>
                </FadeIn>
            </section>

            <section className="py-16 md:py-20 lg:py-24 relative z-10">
                <FadeIn>
                    <div className="max-w-8xl mx-auto relative px-6 sm:px-8 lg:px-12 xl:px-16">
                        {/* Background Decoration */}
                        <div className="absolute inset-0 -z-10 overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-purple/50 rounded-full blur-3xl animate-float" />
                        </div>

                        <div className="relative z-10 mb-8">
                            {/* Mobile Title */}
                            <div className="md:hidden">
                                <div className="inline-flex items-center gap-2 mb-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span className="text-base font-semibold text-primary tracking-wide">Platform Features</span>
                                </div>
                                <h2 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1] mb-8">
                                    What <span className="text-primary">You Get.</span>
                                </h2>
                            </div>

                            {/* Desktop Title */}
                            <div className="hidden md:block mb-12">
                                <div className="inline-flex items-center gap-2 mb-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span className="text-base font-semibold text-primary tracking-wide">What We Do</span>
                                </div>
                                <h2 className="text-3xl lg:text-4xl font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1]">
                                    Five Core Features. <span className="text-primary">One Platform.</span>
                                </h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                {/* Card 1 */}
                                <div className="group md:col-span-7 bg-[#2A2A2A] hover:bg-[#444444] rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300 min-h-[17.5rem]">
                                    <span className="absolute bottom-2 right-2 md:bottom-4 md:right-6 text-[6rem] md:text-[8rem] font-[600] font-black text-[#1A1A1A] group-hover:text-[#2E2E2E] transition-colors duration-300 leading-none pointer-events-none select-none z-0">01</span>
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-12 md:mb-16 relative z-10 backdrop-blur-sm">
                                        <Users className="w-7 h-7 text-white" strokeWidth={1.5} />
                                    </div>
                                    <div className="relative z-10 mt-auto">
                                        <h3 className="font-bold text-white text-xl mb-3">Membership Management</h3>
                                        <p className="text-[#A3A3A3] text-sm leading-relaxed md:max-w-[85%]">
                                            Handle enrollment, maintain data integrity, manage access, and track member status from a single control center.
                                        </p>
                                    </div>
                                </div>

                                {/* Card 2 */}
                                <div className="group md:col-span-5 bg-[#7D7FBC] hover:bg-[#8A8EE9] rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300 min-h-[17.5rem]">
                                    <span className="absolute font-[600] top-2 right-2 md:top-4 md:right-6 text-[6rem] md:text-[8rem] font-black text-[#65679B] group-hover:text-[#797CCB] transition-colors duration-300 leading-none pointer-events-none select-none z-0">02</span>
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-12 md:mb-16 relative z-10 backdrop-blur-sm">
                                        <BarChart3 className="w-7 h-7 text-white" strokeWidth={1.5} />
                                    </div>
                                    <div className="relative z-10 mt-auto">
                                        <h3 className="font-bold text-white text-xl mb-3">Integrated Commerce</h3>
                                        <p className="text-[#D6D7F5] text-sm leading-relaxed">
                                            Manage ticketing, merchandise, and payments with full reporting and compliance.
                                        </p>
                                    </div>
                                </div>

                                {/* Card 3 */}
                                <div className="group md:col-span-5 bg-[#D6D7FA] hover:bg-[#BCBDFF] rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300 min-h-[17.5rem]">
                                    <span className="absolute top-2 font-[600] right-2 md:top-4 md:right-6 text-[6rem] md:text-[8rem] font-black text-white/60 group-hover:text-[#DEDFFF] transition-colors duration-300 leading-none pointer-events-none select-none z-0">03</span>
                                    <div className="w-14 h-14 rounded-2xl bg-[#7D7FBC] flex items-center justify-center mb-12 md:mb-16 relative z-10 shadow-md">
                                        <Smartphone className="w-7 h-7 text-white" strokeWidth={1.5} />
                                    </div>
                                    <div className="relative z-10 mt-auto">
                                        <h3 className="font-bold text-[#7D7FBC] text-xl mb-3">Seamless Engagement</h3>
                                        <p className="text-[#65679B] text-sm leading-relaxed">
                                            Activate events, communications, and content—like OTP via Email/SMS, polls, and leaderboards—with ease.
                                        </p>
                                    </div>
                                </div>

                                {/* Card 4 */}
                                <div className="group md:col-span-7 bg-[#E4DEE3] hover:bg-[#D8BBEE] rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300 min-h-[17.5rem]">
                                    <span className="absolute font-[600] bottom-2 right-2 md:bottom-4 md:right-6 text-[6rem] md:text-[8rem] font-black text-white/80 group-hover:text-[#E7DFED] transition-colors duration-300 leading-none pointer-events-none select-none z-0">04</span>
                                    <div className="w-14 h-14 rounded-2xl bg-[#5D5377] flex items-center justify-center mb-12 md:mb-16 relative z-10 shadow-md">
                                        <ShieldCheck className="w-7 h-7 text-white" strokeWidth={1.5} />
                                    </div>
                                    <div className="relative z-10 mt-auto">
                                        <h3 className="font-bold text-[#5D5377] text-xl mb-3">Compliance & Security</h3>
                                        <p className="text-[#756A8F] text-sm leading-relaxed md:max-w-[85%]">
                                            Meet stringent security standards and global data protection requirements, including DPDPA and GDPR-aligned principles.
                                        </p>
                                    </div>
                                </div>

                                {/* Card 5 */}
                                <div className="group md:col-span-12 bg-[#C2DEF5] hover:bg-[#97BEF7] rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition-all duration-300 min-h-[15rem] items-stretch">
                                    <span className="absolute font-[600] bottom-2 right-2 md:bottom-4 md:right-6 text-[6rem] md:text-[8rem] font-black text-white/80 group-hover:text-[#C9DFFF] transition-colors duration-300 leading-none pointer-events-none select-none z-0">05</span>
                                    
                                    <div className="flex flex-col justify-between relative z-10 w-full md:w-1/3">
                                        <div className="w-14 h-14 rounded-2xl bg-[#1D4ED8] flex items-center justify-center mb-8 md:mb-12 shadow-md">
                                            <Puzzle className="w-7 h-7 text-white" strokeWidth={1.5} />
                                        </div>
                                        <h3 className="font-bold text-[#1D4ED8] text-xl mt-auto">Gamification & AI</h3>
                                    </div>
                                    
                                    <div className="hidden md:block w-px bg-[#1D4ED8]/20 mx-8 self-stretch relative z-10" />
                                    
                                    <div className="mt-6 md:mt-0 relative z-10 flex items-center w-full md:w-2/3 pr-12 lg:pr-32">
                                        <p className="text-[#1E3A8A] text-sm md:text-base leading-relaxed font-medium md:max-w-[90%]">
                                            Deliver intelligent engagement, performance leaderboards, actionable insights, automated content curation, and optimized communications using AI.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </section>
            
            <section className="py-16 md:py-20 lg:py-24 bg-secondary-purple relative z-10">
                <FadeIn>
                    <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
                        {/* Leadership Team Header */}
                        <div className="mb-12 relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="text-base font-semibold text-primary tracking-wide">Leadership Team</span>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1]">
                            The <span className="text-primary">People</span> Behind It.
                        </h2>
                    </div>

                    {/* Leadership Team Grid */}
                    <div className="relative z-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    name: "Dr. Sunil Acharya",
                                    title: "Managing Director, COO & CCO",
                                    image: "/Sunil.png",
                                    description: "Over 40 years leading quality, audits, compliance, and operations. Guides RallyUp Solutions' operational rigor and global security standards as the lead Operations and Compliance Officer.",
                                },
                                {
                                    name: "Dr. Neeta Acharya",
                                    title: "Managing Director, CMO & CFO",
                                    image: "/Neeta.png",
                                    description: "Expert in marketing, finance, branding, and strategy. Shapes club growth, brand perception, and financial health while overseeing marketing strategy and corporate growth.",
                                },
                                {
                                    name: "Mihir Chheda",
                                    title: "CTO, Wingman Pro & Partner",
                                    image: "/Mihir.png",
                                    description: "FinTech veteran and sports club administrator. Designs the Wingman Pro architecture, aligning engineering excellence with the real-world operational needs of clubs and supporter groups globally.",
                                },
                                {
                                    name: "Ankit Ameria",
                                    title: "Partner & Chief Sales Officer,\nWingman Pro",
                                    image: "/Ankit.png",
                                    description: "Leads market strategy and sales initiatives. Specialises in scaling startups and SMBs, ensuring Wingman Pro delivers measurable value to organizations and their supporter communities.",
                                },
                            ].map((leader, i) => (
                                <div key={leader.name} className="group relative w-full [perspective:1000px]">
                                    <div className="w-full h-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                                        {/* Front Face */}
                                        <div className="relative w-full h-full [backface-visibility:hidden] bg-white rounded-3xl p-8 md:p-10 shadow-sm flex flex-col justify-start border border-white/50">
                                            <div className="w-24 h-24 rounded-full bg-[#E5DFE6] mb-8 overflow-hidden relative shadow-sm">
                                                <Image
                                                    src={leader.image}
                                                    alt={leader.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="96px"
                                                />
                                            </div>
                                            <h3 className="font-bold text-[#1A1A1A] text-lg mb-3">{leader.name}</h3>
                                            <p className="text-[#65679B] text-sm font-medium leading-relaxed whitespace-pre-wrap">
                                                {leader.title}
                                            </p>
                                        </div>
                                        {/* Back Face */}
                                        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-secondary rounded-3xl px-6 md:px-8 flex flex-col items-start justify-center text-left shadow-lg border border-black/5">
                                            <h3 className="font-bold text-white text-xl md:text-2xl mb-4 tracking-wide">{leader.name}</h3>
                                            <p className="text-secondary-purple text-sm md:text-base leading-relaxed font-medium">
                                                {leader.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    </div>
                </FadeIn>
            </section>

            {/* CTA Section */}
            <div className="w-full">
                <FadeIn>
                    <div className="relative overflow-hidden bg-[linear-gradient(to_right,#DCD4E2_50%,#8598C7_100%)]">
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
                        
                        <div className="relative z-10 px-6 py-16 md:py-14 flex flex-col items-center text-center">
                            <span className="text-primary font-medium text-base tracking-wide mb-6">
                                Partner with RallyUp Solutions
                            </span>

                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-none text-black">
                                Let's Build <span className="text-primary">The Future.</span>
                            </h2>

                            <p className="mt-8 max-w-3xl text-secondary text-xl md:text-lg font-medium">
                                Are you a sports league, governing body, or technology provider ready to integrate with the future of club and membership management?
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 w-full">
                                <a
                                  href="/contact"
                                  className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#FF7E4A] hover:shadow-[0_8px_20px_#FF5C1A6B] w-full sm:w-[280px] whitespace-nowrap"
                                >
                                  Contact Us
                                </a>
                                <a
                                  href="/affiliations"
                                  className="inline-flex h-12 items-center justify-center rounded-xl bg-[#65679B] px-6 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#7C7FDF] hover:shadow-[0_8px_20px_#6668A1D9] w-full sm:w-[280px] whitespace-nowrap"
                                >
                                  Explore Affiliations
                                </a>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>
            <SiteFooter />
            <ScrollToTop />
        </main>
    )
}
