import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeColorMeta } from "@/components/theme-color-meta"
import { AuthProvider } from "@/contexts/auth-context"
import { CartProvider } from "@/contexts/cart-context"
import { SocketWrapper } from "@/components/socket-wrapper"
import { Toaster } from "sonner"
import Analytics from "@/components/Analytics"
import { AntiScrapingProtection } from "@/components/anti-scraping-protection"
import Script from "next/script"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://wingmanpro.tech'),
  title: {
    default: "Wingman Pro - Intelligent Sports Club Management Software",
    template: "%s | Wingman Pro"
  },
  description: "The world's first AI-enhanced platform built exclusively for Supporter Groups and Sports Clubs. Revolutionize your club management with intelligent membership management, ticketing, and fan engagement.",
  keywords: [
    "sports club management",
    "supporter group software",
    "membership management",
    "sports ticketing",
    "fan engagement platform",
    "club administration",
    "sports organization software",
    "AI-powered club management",
    "sports ecommerce",
    "member management system"
  ],
  authors: [{ name: "RallyUp Solutions" }],
  creator: "RallyUp Solutions Private Limited",
  publisher: "RallyUp Solutions Private Limited",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Wingman Pro",
    title: "Wingman Pro - Revolutionize Your Sports Club Management",
    description: "The world's first AI-enhanced platform built exclusively for Supporter Groups and Sports Clubs. Replace spreadsheets and fragmented tools with one powerful, secure Operating System.",
    images: [
      {
        url: "/Webpage Assets 01.png",
        width: 1200,
        height: 630,
        alt: "Wingman Pro - Global Sports Community Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wingman Pro - Revolutionize Your Sports Club Management",
    description: "The world's first AI-enhanced platform for Supporter Groups and Sports Clubs. Intelligent membership management, ticketing, and fan engagement.",
    images: ["/Webpage Assets 01.png"],
    creator: "@WingmanPro",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/WingmanPro Logo (White BG).svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  category: 'technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/WingmanPro Logo (White BG).svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-SDPCKFH4E2"
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SDPCKFH4E2');
          `}
        </Script>
        <Script id="ekalon-branding">
          {`
//             console.log('%cPowered by Ekalon Solutions', 'color: #0ea5e9; font-size: 16px; font-weight: bold; padding: 4px;');
          `}
        </Script>
      </head>

      <body className={inter.className}>
        <Analytics />
        <AntiScrapingProtection />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeColorMeta />
          <AuthProvider>
            <SocketWrapper>
              <CartProvider>
                {children}
                <Toaster />
              </CartProvider>
            </SocketWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
