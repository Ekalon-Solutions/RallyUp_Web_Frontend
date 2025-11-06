import type React from "react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Handshake, Users, Trophy, MapPin, Globe } from "lucide-react"

export const metadata = {
  title: "Affiliations | Wingman Pro",
  description: "Our partnerships and affiliations with clubs and supporter groups",
}

export default function AffiliationsPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white">
      <SiteNavbar />
      <div className="mx-auto max-w-7xl px-4 py-16">
        <FadeIn>
          <div className="max-w-3xl mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Affiliations & Partnerships</h1>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
              Wingman Pro proudly partners with football clubs, supporter groups, and organizations worldwide to build stronger communities around the beautiful game.
            </p>
          </div>
        </FadeIn>

        <FadeIn>
          <section className="mt-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-slate-900 dark:text-white">Our Partners</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-white border-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 transition-colors">
                <CardHeader className="flex flex-row items-center gap-3">
                  <Building2 className="h-6 w-6 text-sky-600 dark:text-sky-300" />
                  <CardTitle className="text-slate-900 dark:text-white">Professional Clubs</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300">
                  We work directly with professional football clubs to provide supporter engagement platforms and membership management solutions.
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 transition-colors">
                <CardHeader className="flex flex-row items-center gap-3">
                  <Users className="h-6 w-6 text-sky-600 dark:text-sky-300" />
                  <CardTitle className="text-slate-900 dark:text-white">Supporter Groups</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300">
                  Independent supporter groups and fan clubs use Wingman Pro to organize matchdays, events, and community initiatives.
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 transition-colors">
                <CardHeader className="flex flex-row items-center gap-3">
                  <Handshake className="h-6 w-6 text-sky-600 dark:text-sky-300" />
                  <CardTitle className="text-slate-900 dark:text-white">Football Associations</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300">
                  Partnerships with regional and national football associations to support grassroots football communities.
                </CardContent>
              </Card>
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section className="mt-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-slate-900 dark:text-white">Global Reach</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white border-slate-200 dark:bg-white/5 dark:border-white/10">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                    International Presence
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300 space-y-3">
                  <p>Wingman Pro serves supporter groups across multiple continents, bringing together fans from diverse backgrounds and cultures.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Asia-Pacific: India, Singapore, Malaysia, Indonesia, Thailand, Australia</li>
                    <li>Europe: United Kingdom, Germany, and growing presence</li>
                    <li>Americas: United States, Mexico</li>
                    <li>Middle East: UAE, expanding regionally</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-200 dark:bg-white/5 dark:border-white/10">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                    Key Regions
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 dark:text-slate-300 space-y-3">
                  <p>Our platform supports clubs and groups in major football markets with localized features and compliance.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>South Asian football communities</li>
                    <li>European supporter groups</li>
                    <li>North American soccer clubs</li>
                    <li>Southeast Asian football networks</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section className="mt-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-slate-900 dark:text-white">Partnership Benefits</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <Trophy className="h-5 w-5 text-sky-600 dark:text-sky-300 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Club Solutions</h3>
                    <p>Dedicated platforms for professional clubs to manage membership, ticketing, and fan engagement.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-sky-600 dark:text-sky-300 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Supporter Group Tools</h3>
                    <p>Complete toolkit for independent fan clubs including member management, events, and merchandise.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-sky-600 dark:text-sky-300 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Community Building</h3>
                    <p>Features designed to strengthen connections between fans, clubs, and local communities.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Handshake className="h-5 w-5 text-sky-600 dark:text-sky-300 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Custom Partnerships</h3>
                    <p>Tailored solutions and integrations for organizations with specific needs and requirements.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section className="mt-12 rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-sky-500/10 p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white">Interested in Partnering?</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-6">
              Whether you're a football club, supporter group, or football organization, we'd love to explore how Wingman Pro can support your community.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/contact" className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-6 py-3 text-white hover:bg-sky-500 dark:bg-sky-400 dark:text-slate-900 dark:hover:bg-sky-300 transition-colors">
                Contact Us
              </a>
              <a href="/clubs" className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-white/20 bg-white px-6 py-3 text-slate-900 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 transition-colors">
                Create Your Club
              </a>
            </div>
          </section>
        </FadeIn>
      </div>
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}

