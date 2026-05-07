"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", topic: "Product Support", message: "" })
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary-purple text-primary flex items-center justify-center text-3xl">✓</div>
        <p className="text-background font-bold text-xl">Thanks! We&apos;ll be in touch shortly.</p>
        <Button
          variant="outline"
          className="border-0 bg-primary rounded-[5px] text-xs font-medium uppercase tracking-wide"
          onClick={() => setSubmitted(false)}
        >
          Submit another
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-secondary-purple/50 p-4 rounded-[10px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-secondary text-xs font-semibold">Full Name</label>
          <div className="relative">
            <Image 
              src="/profileicon.svg" 
              alt="Profile Icon" 
              width={16} 
              height={16} 
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" 
            />
            <input
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full h-11 pl-10 pr-4 border rounded-[10px] text-xs placeholder-[#888] focus:outline-none focus:border-secondary bg-white"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-secondary text-xs font-semibold">Email</label>
          <div className="relative">
            <Image 
              src="/emailIcon.svg" 
              alt="Email Icon" 
              width={16} 
              height={16} 
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" 
            />
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full h-11 pl-10 pr-4 border rounded-[10px] text-xs placeholder-[#888] focus:outline-none focus:border-secondary bg-white"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-secondary text-xs font-semibold">Topic</label>
        <select
          value={form.topic}
          onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
          className="w-full h-11 px-4 border rounded-[10px] text-xs text-[#888] focus:outline-none focus:border-secondary appearance-none bg-white"
        >
          <option>Product Support</option>
          <option>Sales Inquiry</option>
          <option>Partnership</option>
          <option>Other</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-secondary text-xs font-semibold">Message</label>
        <textarea
          placeholder="Tell us what you need..."
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          rows={4}
          className="w-full px-4 py-3 border rounded-[10px] text-xs text-[#888] placeholder-[#888] focus:outline-none focus:border-secondary resize-none bg-white"
        />
      </div>

      <div className="flex flex-col gap-3 pt-1">
        <Button
          type="submit"
          variant="secondary"
          className="bg-secondary/40"
        >
          Submit
        </Button>
        <Link href="/clubs" className="flex-1">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
          >
            Join Waiting List
          </Button>
        </Link>
      </div>
    </form>
  )
}
