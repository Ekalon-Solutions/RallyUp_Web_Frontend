import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { CartProvider } from "@/contexts/cart-context"
import { SocketWrapper } from "@/components/socket-wrapper"
import { Toaster } from "sonner"
import Analytics from "@/components/Analytics"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Wingman Pro - Supporter Group Management",
  description: "Manage your supporter group with ease",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-SRLNL9FQ0G"
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SRLNL9FQ0G');
          `}
        </Script>
      </head>

      <body className={inter.className}>
        <Analytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
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
