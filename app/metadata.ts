import type { Metadata } from "next"

export const landingPageMetadata: Metadata = {
  title: "Revolutionize Your Sports Club Management | Wingman Pro",
  description: "The world's first AI-enhanced platform built exclusively for Supporter Groups and Sports Clubs. Replace your spreadsheets, payment links, and chat groups with one powerful, secure Operating System for membership management, ticketing, and fan engagement.",
  keywords: [
    "sports club management software",
    "supporter group platform",
    "membership management system",
    "sports ticketing software",
    "fan engagement platform",
    "club administration tools",
    "sports organization software",
    "AI-powered club management",
    "sports ecommerce platform",
    "member management solution",
    "sports club CRM",
    "football club management",
    "soccer club software"
  ],
  openGraph: {
    title: "Wingman Pro - Revolutionize Your Sports Club Management",
    description: "Don't Just Run Your Club. Revolutionize It with Intelligent Sports Club Management Software. The world's first AI-enhanced platform for Supporter Groups and Sports Clubs.",
    url: "/",
    siteName: "Wingman Pro",
    images: [
      {
        url: "/Webpage Assets 01.png",
        width: 1200,
        height: 630,
        alt: "Wingman Pro - Global Sports Community Celebration",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wingman Pro - Revolutionize Your Sports Club Management",
    description: "The world's first AI-enhanced platform for Supporter Groups and Sports Clubs. Intelligent membership management, ticketing, and fan engagement.",
    images: ["/Webpage Assets 01.png"],
  },
  alternates: {
    canonical: "/",
  },
}

