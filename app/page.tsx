"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Users, Trophy, Building2, CalendarDays, MapPin, Ticket, Shield, Zap, TrendingUp, Database, CreditCard, BarChart3, Target, Globe, Lock, Smartphone, CheckCircle2, XCircle, Brain, Activity, Award, Star, Flame } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"
import { JellyCursor } from "@/components/jelly-cursor"
import { ParticleBackground } from "@/components/particle-background"

function Hero() {
  return (
    <section className="relative overflow-hidden" id="home">
      {/* Enhanced Background with Animations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-blue-50/50 to-indigo-50 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/20 animate-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,#38bdf840,transparent_40%),radial-gradient(circle_at_80%_20%,#60a5fa40,transparent_40%),radial-gradient(circle_at_50%_80%,#3b82f640,transparent_45%)] animate-pulse-glow" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:20px_20px] opacity-20 dark:opacity-10" />
        
        {/* Sports-themed floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 opacity-20 animate-float">
          <Trophy className="w-full h-full text-sky-400 rotate-12" />
        </div>
        <div className="absolute top-40 right-20 w-16 h-16 opacity-15 animate-float" style={{ animationDelay: '1s' }}>
          <Activity className="w-full h-full text-blue-400 -rotate-12" />
        </div>
        <div className="absolute bottom-32 left-1/4 w-14 h-14 opacity-20 animate-float" style={{ animationDelay: '2s' }}>
          <Award className="w-full h-full text-indigo-400 rotate-6" />
        </div>
        <div className="absolute bottom-20 right-1/3 w-18 h-18 opacity-15 animate-float" style={{ animationDelay: '1.5s' }}>
          <Star className="w-full h-full text-sky-300 -rotate-6" />
        </div>
      </div>

      <ParticleBackground />

      <div className="mx-auto max-w-7xl px-4 py-20 md:py-32 relative z-10">
        <div className="text-center max-w-5xl mx-auto space-y-8">
          {/* Animated Title with Gradient */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight animate-slide-up">
            Don't Just Run Your Club.<br />
            <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent animate-gradient inline-block">
              Revolutionize It
            </span>{" "}
            <span className="inline-block animate-bounce-subtle">⚡</span>
            <br />
            with Intelligent Sports Club Management Software.
          </h1>
          
          {/* Enhanced Description with Shimmer */}
          <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl leading-relaxed max-w-4xl mx-auto relative overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <span className="relative z-10">
              The world's first AI-enhanced platform built exclusively for Supporter Groups and Sports Clubs. We replace your spreadsheets, payment links, and chat groups with one powerful, secure Operating System for membership management, ticketing, and fan engagement.
            </span>
            <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </p>
          
          {/* Enhanced Buttons with Hover Effects */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Link href="/contact">
              <Button 
                size="lg" 
                className="h-14 px-8 bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-500 dark:to-blue-500 text-white hover:from-sky-500 hover:to-blue-500 dark:hover:from-sky-400 dark:hover:to-blue-400 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Flame className="w-5 h-5" />
                  Book Your Demo
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </Link>
            <Link href="#features">
              <Button 
                size="lg" 
                variant="outline" 
                className="h-14 px-8 border-2 border-slate-300 dark:border-white/20 bg-white/80 backdrop-blur-sm text-slate-900 hover:bg-white dark:bg-white/5 dark:text-white dark:hover:bg-white/10 text-lg font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Explore Features
              </Button>
            </Link>
          </div>
          
          {/* Enhanced Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-sm text-slate-600 dark:text-slate-300 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-slate-200/50 dark:border-white/10 hover:scale-110 transition-transform duration-300">
              <Trophy className="h-5 w-5 text-sky-600 dark:text-sky-400 animate-wiggle" />
              <span className="font-medium">Built for High-Performance Clubs</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-slate-200/50 dark:border-white/10 hover:scale-110 transition-transform duration-300">
              <Shield className="h-5 w-5 text-sky-600 dark:text-sky-400 animate-pulse-glow" />
              <span className="font-medium">GDPR & DPDPA Compliant</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-slate-200/50 dark:border-white/10 hover:scale-110 transition-transform duration-300">
              <Lock className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              <span className="font-medium">Secure OTP Access</span>
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
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24 relative" id="problem">
      {/* Background Decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-sky-200/20 dark:bg-sky-900/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="text-center max-w-3xl mx-auto mb-12 relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
          The "Volunteer Burnout" Ends Here.
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
          You started this club because you love the game. But lately, you're spending more time on club administration, reconciling bank transfers, chasing membership renewals, and managing data privacy than actually watching the match.
        </p>
        <p className="text-slate-700 dark:text-slate-200 text-lg font-semibold mt-4 bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
          Wingman Pro restores the balance. We handle the heavy lifting of administration, compliance, and commerce, so you can get back to the stands.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto relative z-10">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center flex items-center justify-center gap-2">
            <XCircle className="h-6 w-6 text-red-500 animate-wiggle" />
            The Old Way
          </h3>
          {comparisons.map((item, i) => (
            <Card 
              key={i} 
              className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 dark:from-red-950/30 dark:to-orange-950/20 dark:border-red-900/40 hover:shadow-xl hover:scale-105 transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <span className="text-slate-900 dark:text-white font-medium">{item.old}</span>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500 animate-bounce-subtle" />
            The Wingman Pro Way
          </h3>
          {comparisons.map((item, i) => (
            <Card 
              key={i} 
              className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 dark:from-green-950/30 dark:to-emerald-950/20 dark:border-green-900/40 hover:shadow-xl hover:scale-105 transition-all duration-300 animate-scale-in relative overflow-hidden group"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <CardContent className="flex items-start gap-3 p-4 relative z-10">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-900 dark:text-white font-medium">{item.new}</span>
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
      ],
      gradient: "from-purple-500 to-indigo-600",
      bgGradient: "from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20"
    },
    {
      title: "Integrated Commerce Engine",
      desc: "Stop using third-party ticketing tools that eat your margins. Wingman Pro turns your passion into revenue with an integrated sports ecommerce platform.",
      icon: CreditCard,
      points: [
        "Merchandise Store: Real-time inventory tracking and seamless checkout",
        "Event Ticketing: QR-code ready ticketing software for match days and socials",
        "Financial Reporting: One-click export for easy club accounting and reconciliation"
      ],
      gradient: "from-sky-500 to-blue-600",
      bgGradient: "from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20"
    },
    {
      title: 'Next-Gen Engagement (The "Pro" Advantage)',
      desc: "This is where we leave the competition behind. We use fan engagement technology to turn casual fans into die-hard members.",
      icon: Target,
      points: [
        "Gamified Leaderboards: Award points for attendance, purchases, and interactions to boost fan loyalty",
        "AI Content Curation: Deliver the right news and events to the right members automatically",
        "Interactive Polls & Galleries: Keep the conversation alive with a dedicated community platform between match days"
      ],
      gradient: "from-orange-500 to-red-600",
      bgGradient: "from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20"
    }
  ]
  
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24 relative" id="features">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-sky-300/10 dark:bg-sky-700/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-blue-300/10 dark:bg-blue-700/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="text-center max-w-3xl mx-auto mb-12 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 mb-4 animate-scale-in">
          <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400 animate-pulse" />
          <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">Core Features</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 bg-gradient-to-r from-slate-900 via-sky-800 to-blue-900 dark:from-white dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent">
          Core Feature Pillars
        </h2>
      </div>
      <div className="grid lg:grid-cols-3 gap-8 relative z-10">
        {features.map((feature, i) => {
          let bgGradientClass = "from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20"
          let iconGradientClass = "from-purple-500 to-indigo-600"
          if (i === 1) {
            bgGradientClass = "from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20"
            iconGradientClass = "from-sky-500 to-blue-600"
          } else if (i === 2) {
            bgGradientClass = "from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20"
            iconGradientClass = "from-orange-500 to-red-600"
          }
          return (
            <Card 
              key={i} 
              className={`bg-gradient-to-br ${bgGradientClass} border-2 border-slate-200 dark:border-white/10 hover:shadow-2xl hover:scale-105 transition-all duration-500 group relative overflow-hidden animate-scale-in`}
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <CardHeader className="relative z-10">
                <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${iconGradientClass} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  {React.createElement(feature.icon, { className: "h-7 w-7 text-white" })}
                </div>
              <CardTitle className="text-slate-900 dark:text-white text-xl mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-sky-600 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-300">
                {feature.title}
              </CardTitle>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{feature.desc}</p>
            </CardHeader>
            <CardContent className="relative z-10">
              <ul className="space-y-3">
                {feature.points.map((point, j) => {
                  let iconColor = "text-sky-600 dark:text-sky-400"
                  if (i === 0) iconColor = "text-purple-600 dark:text-purple-400"
                  if (i === 1) iconColor = "text-sky-600 dark:text-sky-400"
                  if (i === 2) iconColor = "text-orange-600 dark:text-orange-400"
                  return (
                    <li 
                      key={j} 
                      className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-300"
                    >
                      <CheckCircle2 className={`h-4 w-4 ${iconColor} flex-shrink-0 mt-0.5 animate-pulse`} />
                      <span>{point}</span>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
          )
        })}
      </div>
    </section>
  )
}

function WhyWingmanPro() {
  const differentiators = [
    {
      icon: Globe,
      title: "We are Global",
      desc: "Ready for multi-currency support and cross-border data regulations from Day 1.",
      gradient: "from-blue-500 to-cyan-600",
      delay: "0s"
    },
    {
      icon: Brain,
      title: "We are Smart",
      desc: "Our predictive AI analyzes member behavior to help you reduce churn before it happens.",
      gradient: "from-purple-500 to-pink-600",
      delay: "0.2s"
    },
    {
      icon: Users,
      title: "We are Partners",
      desc: 'We don\'t just sell you club software; our "Grassroots Growth" initiative helps you secure sponsorships and build affiliations with major leagues.',
      gradient: "from-orange-500 to-red-600",
      delay: "0.4s"
    }
  ]
  
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24 relative overflow-hidden">
      {/* Enhanced Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 rounded-3xl animate-gradient" />
      
      {/* Animated Orbs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-sky-400/20 dark:bg-sky-600/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      
      {/* Sports Icons Floating */}
      <div className="absolute top-10 right-10 w-16 h-16 opacity-10 animate-rotate-slow">
        <Trophy className="w-full h-full text-sky-500" />
      </div>
      <div className="absolute bottom-10 left-10 w-12 h-12 opacity-10 animate-rotate-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }}>
        <Activity className="w-full h-full text-blue-500" />
      </div>

      <div className="text-center max-w-3xl mx-auto mb-12 relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-700 dark:from-sky-300 dark:via-blue-300 dark:to-indigo-300 bg-clip-text text-transparent">
          Why Choose Wingman Pro's Membership Platform?
        </h2>
        <p className="text-slate-700 dark:text-slate-200 text-xl leading-relaxed">
          Most software manages data. <span className="font-bold bg-gradient-to-r from-sky-700 to-blue-700 dark:from-sky-300 dark:to-blue-300 bg-clip-text text-transparent">Wingman Pro manages communities.</span>
        </p>
        <p className="text-slate-600 dark:text-slate-300 text-lg mt-4">
          While others offer you a database, we offer you an Intelligence Partner for your sports organization.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 relative z-10">
        {differentiators.map((item, i) => {
          let gradientClass = "from-blue-500 to-cyan-600"
          if (i === 1) gradientClass = "from-purple-500 to-pink-600"
          else if (i === 2) gradientClass = "from-orange-500 to-red-600"
          return (
            <Card 
              key={i} 
              className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border-2 border-slate-200 dark:border-white/10 text-center hover:shadow-2xl hover:scale-105 transition-all duration-500 group relative overflow-hidden animate-scale-in"
              style={{ animationDelay: item.delay }}
            >
              {/* Gradient Overlay on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              
              <CardHeader className="relative z-10">
                <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  {React.createElement(item.icon, { className: "h-10 w-10 text-white" })}
                </div>
              <CardTitle className="text-slate-900 dark:text-white text-xl group-hover:bg-gradient-to-r group-hover:from-sky-600 group-hover:to-blue-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
          )
        })}
      </div>
    </section>
  )
}

function TechPromise() {
  const promises = [
    { icon: Zap, text: "99.9% Uptime Guarantee", gradient: "from-yellow-400 to-orange-500" },
    { icon: Lock, text: "Bank-Level Data Encryption", gradient: "from-green-400 to-emerald-500" },
    { icon: Smartphone, text: "Mobile-First Responsive Design (No app download required)", gradient: "from-blue-400 to-cyan-500" }
  ]
  
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(56,189,248,0.05)_25%,rgba(56,189,248,0.05)_50%,transparent_50%,transparent_75%,rgba(56,189,248,0.05)_75%,rgba(56,189,248,0.05))] [background-size:20px_20px]" />
      </div>

      <div className="text-center max-w-3xl mx-auto mb-12 relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 bg-gradient-to-r from-slate-900 via-sky-800 to-blue-900 dark:from-white dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent">
          Built for Scale. Secured for Peace of Mind.
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
          Whether you have 50 members or 50,000, our enterprise-grade infrastructure scales with you.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10">
        {promises.map((item, i) => (
          <Card 
            key={i} 
            className={`bg-gradient-to-br from-slate-50 to-sky-50 border-2 border-slate-200 dark:from-slate-900/50 dark:to-blue-900/30 dark:border-white/10 text-center hover:shadow-2xl hover:scale-105 transition-all duration-500 group relative overflow-hidden animate-scale-in`}
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            {/* Animated Gradient Border */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
            
            <CardContent className="pt-8 pb-8 relative z-10">
              <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                {React.createElement(item.icon, { className: "h-8 w-8 text-white" })}
              </div>
              <p className="text-slate-900 dark:text-white font-semibold text-lg group-hover:bg-gradient-to-r group-hover:from-sky-600 group-hover:to-blue-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                {item.text}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 dark:from-sky-600 dark:via-blue-700 dark:to-indigo-700 animate-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 opacity-20 animate-float">
          <Trophy className="w-full h-full text-white" />
        </div>
        <div className="absolute bottom-10 right-10 w-16 h-16 opacity-20 animate-float" style={{ animationDelay: '1s' }}>
          <Star className="w-full h-full text-white" />
        </div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 opacity-15 animate-float" style={{ animationDelay: '2s' }}>
          <Award className="w-full h-full text-white" />
        </div>
      </div>

      <div className="rounded-3xl border-2 border-white/20 bg-gradient-to-br from-sky-500/90 via-blue-600/90 to-indigo-600/90 dark:from-sky-600/90 dark:via-blue-700/90 dark:to-indigo-700/90 backdrop-blur-sm p-10 md:p-16 text-center text-white shadow-2xl relative z-10 animate-pulse-glow">
        <h2 className="text-3xl md:text-5xl font-bold mb-4 animate-slide-up">
          Ready to Upgrade Your Sports Management System?
        </h2>
        <p className="text-sky-50 text-lg md:text-xl mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Join the waiting list or book a consultation with our strategy team to see how Wingman Pro can unlock your club's potential.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Link href="/contact">
            <Button 
              size="lg" 
              className="h-14 px-8 bg-white text-sky-700 hover:bg-slate-100 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Book a Consultation
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-sky-100 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
          </Link>
          <Link href="/clubs">
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-8 border-2 border-white text-white hover:bg-white/20 text-lg font-semibold backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
            >
              Join Waiting List
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white relative overflow-x-hidden">
      <JellyCursor />
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
    </div>
  )
}
