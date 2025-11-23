"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Users, Trophy, Building2, CalendarDays, MapPin, Ticket, Shield, Zap, TrendingUp, Database, CreditCard, BarChart3, Target, Globe, Lock, Smartphone, CheckCircle2, XCircle, Brain } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"

function Hero() {
  return (
    <section className="relative overflow-hidden" id="home">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,#38bdf81f,transparent_35%),radial-gradient(circle_at_80%_20%,#60a5fa1f,transparent_35%),radial-gradient(circle_at_50%_80%,#38bdf81a,transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-20 md:py-32">
        <div className="text-center max-w-5xl mx-auto space-y-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Don't Just Run Your Club.<br />
            <span className="bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
              Revolutionize It
            </span> with Intelligent Sports Club Management Software.
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl leading-relaxed max-w-4xl mx-auto">
            The world's first AI-enhanced platform built exclusively for Supporter Groups and Sports Clubs. We replace your spreadsheets, payment links, and chat groups with one powerful, secure Operating System for membership management, ticketing, and fan engagement.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/contact">
              <Button size="lg" className="h-14 px-8 bg-sky-600 text-white hover:bg-sky-500 dark:bg-sky-400 dark:text-slate-900 dark:hover:bg-sky-300 text-lg font-semibold">
                Book Your Demo
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-14 px-8 border-slate-300 dark:border-white/20 bg-white text-slate-900 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 text-lg font-semibold">
                Explore Features
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              <span>Built for High-Performance Clubs</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              <span>GDPR & DPDPA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              <span>Secure OTP Access</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProblemSolution() {
  const comparisons = [
    { old: "Fragmented Excel Sheets & Google Forms", new: "One Centralized Sports Membership Database" },
    { old: "Chasing payments via WhatsApp", new: "Automated Membership Renewals & Ticketing" },
    { old: '"Best Guess" decision making', new: "AI-Driven Club Growth Insights" },
    { old: "Static, boring emails", new: "Gamified Member Engagement Tools" },
  ]
  
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24" id="problem">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
          The "Volunteer Burnout" Ends Here.
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
          You started this club because you love the game. But lately, you're spending more time on club administration, reconciling bank transfers, chasing membership renewals, and managing data privacy than actually watching the match.
        </p>
        <p className="text-slate-700 dark:text-slate-200 text-lg font-semibold mt-4">
          Wingman Pro restores the balance. We handle the heavy lifting of administration, compliance, and commerce, so you can get back to the stands.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">The Old Way</h3>
          {comparisons.map((item, i) => (
            <Card key={i} className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/30">
              <CardContent className="flex items-start gap-3 p-4">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-900 dark:text-white">{item.old}</span>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">The Wingman Pro Way</h3>
          {comparisons.map((item, i) => (
            <Card key={i} className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30">
              <CardContent className="flex items-start gap-3 p-4">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-900 dark:text-white">{item.new}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function CoreFeatures() {
  const features = [
    {
      title: "Command Center Administration",
      desc: "Total control over your organization with our comprehensive club management system. Manage hierarchy, access roles, and member data with military-grade security.",
      icon: Database,
      points: [
        "Smart Profiles: Self-updating member portals",
        "Global Compliance: Built-in adherence to DPDPA (India), GDPR (UK/EU), and international data laws",
        "Zero-Password Risk: Secure OTP-only login infrastructure"
      ]
    },
    {
      title: "Integrated Commerce Engine",
      desc: "Stop using third-party ticketing tools that eat your margins. Wingman Pro turns your passion into revenue with an integrated sports ecommerce platform.",
      icon: CreditCard,
      points: [
        "Merchandise Store: Real-time inventory tracking and seamless checkout",
        "Event Ticketing: QR-code ready ticketing software for match days and socials",
        "Financial Reporting: One-click export for easy club accounting and reconciliation"
      ]
    },
    {
      title: 'Next-Gen Engagement (The "Pro" Advantage)',
      desc: "This is where we leave the competition behind. We use fan engagement technology to turn casual fans into die-hard members.",
      icon: Target,
      points: [
        "Gamified Leaderboards: Award points for attendance, purchases, and interactions to boost fan loyalty",
        "AI Content Curation: Deliver the right news and events to the right members automatically",
        "Interactive Polls & Galleries: Keep the conversation alive with a dedicated community platform between match days"
      ]
    }
  ]
  
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24" id="features">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
          Core Feature Pillars
        </h2>
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        {features.map((feature, i) => (
          <Card key={i} className="bg-white border-slate-200 dark:bg-white/5 dark:border-white/10 hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mb-4">
                {React.createElement(feature.icon, { className: "h-6 w-6 text-sky-600 dark:text-sky-400" })}
              </div>
              <CardTitle className="text-slate-900 dark:text-white text-xl mb-3">{feature.title}</CardTitle>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{feature.desc}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {feature.points.map((point, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function WhyWingmanPro() {
  const differentiators = [
    {
      icon: Globe,
      title: "We are Global",
      desc: "Ready for multi-currency support and cross-border data regulations from Day 1."
    },
    {
      icon: Brain,
      title: "We are Smart",
      desc: "Our predictive AI analyzes member behavior to help you reduce churn before it happens."
    },
    {
      icon: Users,
      title: "We are Partners",
      desc: 'We don\'t just sell you club software; our "Grassroots Growth" initiative helps you secure sponsorships and build affiliations with major leagues.'
    }
  ]
  
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 rounded-3xl">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
          Why Choose Wingman Pro's Membership Platform?
        </h2>
        <p className="text-slate-700 dark:text-slate-200 text-xl leading-relaxed">
          Most software manages data. <span className="font-bold text-sky-700 dark:text-sky-300">Wingman Pro manages communities.</span>
        </p>
        <p className="text-slate-600 dark:text-slate-300 text-lg mt-4">
          While others offer you a database, we offer you an Intelligence Partner for your sports organization.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        {differentiators.map((item, i) => (
          <Card key={i} className="bg-white border-slate-200 dark:bg-slate-900/50 dark:border-white/10 text-center">
            <CardHeader>
              <div className="h-16 w-16 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mx-auto mb-4">
                {React.createElement(item.icon, { className: "h-8 w-8 text-sky-600 dark:text-sky-400" })}
              </div>
              <CardTitle className="text-slate-900 dark:text-white text-xl">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function TechPromise() {
  const promises = [
    { icon: Zap, text: "99.9% Uptime Guarantee" },
    { icon: Lock, text: "Bank-Level Data Encryption" },
    { icon: Smartphone, text: "Mobile-First Responsive Design (No app download required)" }
  ]
  
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
          Built for Scale. Secured for Peace of Mind.
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
          Whether you have 50 members or 50,000, our enterprise-grade infrastructure scales with you.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {promises.map((item, i) => (
          <Card key={i} className="bg-gradient-to-br from-slate-50 to-sky-50 border-slate-200 dark:from-slate-900/50 dark:to-blue-900/30 dark:border-white/10 text-center">
            <CardContent className="pt-8 pb-8">
              <div className="h-14 w-14 rounded-full bg-sky-600 dark:bg-sky-400 flex items-center justify-center mx-auto mb-4">
                {React.createElement(item.icon, { className: "h-7 w-7 text-white dark:text-slate-900" })}
              </div>
              <p className="text-slate-900 dark:text-white font-semibold text-lg">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-sky-500 via-blue-600 to-sky-600 dark:from-sky-600 dark:via-blue-700 dark:to-sky-700 p-10 md:p-16 text-center text-white shadow-2xl">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Ready to Upgrade Your Sports Management System?
        </h2>
        <p className="text-sky-50 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          Join the waiting list or book a consultation with our strategy team to see how Wingman Pro can unlock your club's potential.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/contact">
            <Button size="lg" className="h-14 px-8 bg-white text-sky-700 hover:bg-slate-100 text-lg font-semibold">
              Book a Consultation
            </Button>
          </Link>
          <Link href="/clubs">
            <Button size="lg" variant="outline" className="h-14 px-8 border-white text-white hover:bg-white/10 text-lg font-semibold">
              Join Waiting List
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}



function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-sky-500/10 p-8 md:p-10 text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Ready to rally your supporters?</h3>
        <p className="text-slate-700 dark:text-slate-300 mt-2">Launch your fan club hub in minutes and start your next matchday right.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/clubs"><Button className="bg-sky-600 text-white hover:bg-sky-500 dark:bg-sky-400 dark:text-slate-900 dark:hover:bg-sky-300">Create a Club</Button></Link>
          <Link href="/login"><Button variant="outline" className="border-slate-300 dark:border-white/20 bg-white text-slate-900 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">Sign in</Button></Link>
                    </div>
                      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white">
      <SiteNavbar brandName="Wingman Pro" />
      <FadeIn>
        <Hero />
      </FadeIn>
      <FadeIn>
        <ProblemSolution />
      </FadeIn>
      <FadeIn>
        <CoreFeatures />
      </FadeIn>
      <FadeIn>
        <WhyWingmanPro />
      </FadeIn>
      <FadeIn>
        <TechPromise />
      </FadeIn>
      <FadeIn>
        <FinalCTA />
      </FadeIn>
      <SiteFooter brandName="Wingman Pro" />
      <ScrollToTop />
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee {
          width: max-content;
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  )
}
