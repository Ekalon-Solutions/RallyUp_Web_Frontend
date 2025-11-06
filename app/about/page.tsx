import type React from "react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"

export const metadata = {
  title: "About Us | Wingman Pro",
  description: "Learn about Wingman Pro and our mission for supporter groups",
}

export default function AboutPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white">
      <SiteNavbar />
      <div className="mx-auto max-w-7xl px-4 py-16">
        <FadeIn>
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">About Wingman Pro</h1>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            Wingman Pro helps football supporter groups run smooth matchdays and thriving communities. We bring together
            membership, events, tickets, merch, polls, leaderboards and matchday tools in one platform so leaders can
            organize with ease and fans can focus on supporting their clubs.
          </p>
        </div>
        </FadeIn>

        <FadeIn>
        <section className="mt-10 grid md:grid-cols-3 gap-6">
          {[{n:"Alex Morgan",r:"Founder & CEO"},{n:"Ravi Sharma",r:"Head of Product"},{n:"Elena González",r:"Design Lead"},{n:"James Okoye",r:"Engineering Lead"},{n:"Mina Suzuki",r:"Community & Support"},{n:"Diego Costa",r:"Partnerships"}].map((m,i)=> (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-gradient-to-br from-sky-200 to-blue-300" />
              <div className="font-semibold">{m.n}</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">{m.r}</div>
            </div>
          ))}
        </section>
        </FadeIn>

        <FadeIn>
        <section className="mt-12 space-y-4 text-slate-700 dark:text-slate-300 max-w-3xl">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Our Mission</h2>
          <p>
            Empower local supporter groups around the world with modern tools that celebrate the beautiful game and
            strengthen community connections.
          </p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-8">What We Do</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Matchday workflows: check-ins, predictions, player of the match, polls</li>
            <li>Full membership management with digital cards</li>
            <li>Tickets, events and away-day coordination</li>
            <li>Merch store, inventory and fulfillment tracking</li>
          </ul>
        </section>
        </FadeIn>
      </div>
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}


