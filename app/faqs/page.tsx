import type React from "react"
import { ChevronDown, Mail } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import SvgIcon from "@/components/svg-icon";
import Button from "@/components/landing/button";

export const metadata = {
  title: "FAQs | Wingman Pro",
  description: "Frequently asked questions about Wingman Pro",
}

type Faq = { question: string; answer: string }

type Category = {
  id: string
  title: string
  description: string
  accent: string
  headingSide: "left" | "right"
  faqs: Faq[]
}

const categories: Category[] = [
  {
    id: "general-technical",
    title: "General & Technical",
    description: "The foundation of Wingman Pro technology and infrastructure.",
    accent: "from-wingman-cyan to-wingman-cyan/0",
    headingSide: "left",
    faqs: [
      {
        question: "What is Wingman Pro?",
        answer:
          "Wingman Pro is a digital hub that helps supporter groups and sports clubs manage members, deliver content, and run event engagement from a single platform.",
      },
      {
        question: "Who is Wingman Pro designed for?",
        answer:
          "It is built for sports clubs, supporters' clubs, and their administrators and members who need a precise, reliable way to organise their community.",
      },
      {
        question: "What technology does Wingman Pro use?",
        answer:
          "Wingman Pro is a modern web application with a companion mobile app, secured with OTP-based authentication and built on current data security best practices.",
      },
      {
        question: "Does Wingman Pro replace our existing website?",
        answer:
          "Not necessarily. Wingman Pro can work alongside your current website as your members' hub, or serve as your club's main home on the web. It's your choice.",
      },
    ],
  },
  {
    id: "onboarding-usage",
    title: "Onboarding & Usage",
    description: "Smooth transitions and daily operational excellence.",
    accent: "from-purple-500 to-transparent",
    headingSide: "right",
    faqs: [
      {
        question: "How do users log into the app?",
        answer:
          "Members sign in with a One-Time Password (OTP) sent to their registered email and mobile number. There is no password to remember.",
      },
      {
        question: "How do we get our current member data onto Wingman Pro?",
        answer:
          "Club administrators can upload and manage member data directly within Wingman Pro. Our team can help you with the initial setup.",
      },
      {
        question: "Can members update their own profile information?",
        answer:
          "Yes. Members can keep their own profile details up to date, while administrators retain control over access rights and enrollment.",
      },
    ],
  },
  {
    id: "financial-commerce",
    title: "Financial & Commerce",
    description: "Precision management of revenue and member transactions.",
    accent: "from-emerald-400 to-transparent",
    headingSide: "left",
    faqs: [
      {
        question: "Can Wingman Pro handle our merchandise sales?",
        answer:
          "Yes. Wingman Pro supports club commerce, so you can manage merchandise and member purchases alongside your other club activity.",
      },
      {
        question: "Is there an extra fee for payment processing?",
        answer:
          "Payment processing fees depend on your plan and payment provider. Contact our team and we will walk you through the exact pricing for your club.",
      },
    ],
  },
]

const mobileOnlyCategories: Category[] = [
  {
    id: "security-compliance",
    title: "Security & Compliance",
    description: "How Wingman Pro protects your club's data.",
    accent: "from-emerald-400 to-transparent",
    headingSide: "left",
    faqs: [
      {
        question: "How is my club's data protected?",
        answer:
          "Wingman Pro uses OTP-based authentication and follows current data security best practices to keep your club's and members' information safe.",
      },
    ],
  },
]

function FaqItem({ faq }: { faq: Faq }): React.JSX.Element {
  return (
    <details className="group rounded-[0.75rem] border border-[#FFFFFF1A] bg-[#121212B2] backdrop-blur-[1.25rem] transition-colors hover:border-white/20 max-[767px]:rounded-[0.5rem]">
      <summary className="flex min-h-[5.125rem] cursor-pointer list-none items-center justify-between gap-4 px-6 [&::-webkit-details-marker]:hidden max-[767px]:min-h-[3.75rem] max-[767px]:px-5">
        <span className="max-w-[32.8125rem] font-sf text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-wingman-primary-text align-middle max-[767px]:font-sf-compact max-[767px]:font-[656] max-[767px]:text-[0.875rem] max-[767px]:leading-[1.25rem]">
          {faq.question}
        </span>
        <SvgIcon
          src="/new-wingman/icons/arrow-down.svg"
          className="h-[0.4625rem] w-[0.75rem] shrink-0 bg-wingman-cyan transition-transform duration-200 group-open:rotate-180"
        />
      </summary>

      <p className="px-6 pb-6 pt-2 font-sf-compact text-[0.9375rem] leading-6 text-zinc-400 max-[767px]:px-5 max-[767px]:pb-4 max-[767px]:pt-0 max-[767px]:text-[0.8125rem] max-[767px]:leading-[1.125rem]">
        {faq.answer}
      </p>
    </details>
  )
}

function CategorySection({ category }: { category: Category }): React.JSX.Element {
  const headingRight = category.headingSide === "right"

  return (
    <section
      id={category.id}
      className="scroll-mt-28 flex flex-col gap-8 border-b border-white/10 py-14 last:border-b-0 mobile:gap-12 mobile:flex-row max-[767px]:gap-4 max-[767px]:border-none max-[767px]:py-6"
    >
      {/* Heading column */}
      <div
        className={`w-full shrink-0 mobile:w-[23.333rem] ${headingRight ? "mobile:order-2" : ""} max-[767px]:mb-2`}
      >
        <div className="flex items-center gap-3">
          {/* Vertical line indicator for mobile */}
          <div className="hidden h-[2rem] w-[0.25rem] rounded-full bg-wingman-cyan max-[767px]:block" />
          <h2 className="font-sf text-[2rem] font-[700] leading-[2.5rem] tracking-[-0.02rem] text-wingman-emphasis-text align-middle max-[767px]:text-[1.5rem] max-[767px]:font-[590] max-[767px]:leading-[2rem] max-[767px]:text-wingman-primary-text">
            {category.title}
          </h2>
        </div>
        <p className="mt-3 font-sf-compact text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text align-middle max-[767px]:hidden">
          {category.description}
        </p>
        <div className={`mt-4 h-px w-[6rem] bg-gradient-to-r ${category.accent} max-[767px]:hidden`} />
      </div>

      {/* FAQ column */}
      <div className={`flex-1 space-y-3 ${headingRight ? "mobile:order-1" : ""} max-[767px]:space-y-4`}>
        {category.faqs.map((faq) => (
          <FaqItem key={faq.question} faq={faq} />
        ))}
      </div>
    </section>
  )
}

export default function FAQsPage(): React.JSX.Element {
  return (
    <main
      className="min-h-screen overflow-x-clip bg-wingman-light-surface-text text-white"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 30% 28.125rem at top left, #A8E8FF1A 0%, transparent 100%),
          radial-gradient(ellipse 30% 28.125rem at top right, #DFB7FF1A 0%, transparent 100%)
        `,
        backgroundRepeat: "no-repeat"
      }}
    >
      <SiteNavbar />

      {/* Hero */}
      <div className="relative">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[22.5rem] w-[56.25rem] max-w-full -translate-x-1/2 rounded-full" />

        <div className="relative mx-auto max-w-8xl px-4 pb-16 pt-12 mobile:px-8 max-[767px]:pb-6 max-[767px]:pt-6">
          <p className="font-sf-compact text-sm font-[656] tracking-[0.0875rem] align-middle uppercase text-wingman-cyan max-[767px]:hidden">Knowledge Base</p>

          {/* Desktop Title Block */}
          <div className="heading-group-desktop mx-auto mt-10 max-w-2xl text-center max-[767px]:hidden">
            <h1 className="heading-main">
              Frequently Asked Questions
            </h1>
            <p className="subheading-main">
              Find answers to common questions about Wingman Pro. Precision-engineered solutions for
              high-performance supporter groups and sports clubs.
            </p>
          </div>

          {/* Mobile Title Block */}
          <div className="heading-group-mobile hidden max-[767px]:flex my-4">
            <h1 className="heading-main-mobile">Frequently Asked Questions</h1>

            {/* green span can go here, gap stays the same */}

            <p className="subheading-main-mobile">
              Find answers to common questions about Wingman Pro. Can't find what you're
              looking for? Contact us and we'll be happy to help.
            </p>
          </div>

          {/* Desktop Buttons */}
          <div className="mt-[4.375rem] flex flex-wrap items-center justify-start gap-4 max-[767px]:hidden">
            <Button className="h-[2.875rem] w-[11.25rem]">Explore Categories</Button>
            <Button className="h-[2.875rem] w-[11.25rem]">Contact Support</Button>

          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mx-auto max-w-8xl px-4 mobile:px-8 my-[2rem] max-[767px]:my-0">
        {categories.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}

        {/* Small screens only */}
        <div className="hidden max-[767px]:block">
          {mobileOnlyCategories.map((category) => (
            <CategorySection key={category.id} category={category} />
          ))}
        </div>

        {/* Contact Block */}
        <div className="relative mx-auto my-16 flex h-[26.625rem] w-full max-w-[74rem] flex-col items-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-black pt-[6.0625rem] text-center max-[767px]:my-12 max-[767px]:h-auto max-[767px]:min-h-0 max-[767px]:rounded-[1rem] max-[767px]:glass-panel max-[767px]:py-10 max-[767px]:px-6 max-[767px]:items-center">
          <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full max-[767px]:hidden" />

          <div className="relative z-10 flex h-[10.5rem] w-full max-w-[73.875rem] flex-col items-center justify-between px-4 max-[767px]:h-auto max-[767px]:gap-3 max-[767px]:px-0 max-[767px]:items-center">
            {/* Desktop content */}
            <h2 className="font-sf text-[2.5rem] mobile:text-[4rem] font-[860] leading-[1.1] mobile:leading-[4.5rem] tracking-[-0.08rem] text-wingman-emphasis-text align-middle max-[767px]:hidden">
              Still have questions?
            </h2>
            <p className="mx-auto h-[3.5rem] w-[34.375rem] max-w-full font-sf-compact text-[1.125rem] font-[457] leading-[1.75rem] tracking-[0rem] text-wingman-secondary-text align-middle max-[767px]:hidden">
              We&apos;re here to help. Reach out to our strategy team and we&apos;ll get back to you right away.
            </p>

            {/* Mobile Content */}
            <h2 className="hidden max-[767px]:block font-sf text-[1.75rem] font-[700] leading-[2.25rem] text-center align-middle text-wingman-emphasis-text">
              We're Here To Help.
            </h2>
            <p className="hidden max-[767px]:block w-[16.875rem] max-w-full font-sf-compact text-[1rem] font-[457] leading-[1.5rem] text-center align-middle text-wingman-secondary-text">
              Reach out to our strategy team and we'll get back to you right away.
            </p>
          </div>

          <Button
            variant="primary"
            href="mailto:response@wingman-pro.com"
            className="
    relative z-10 mt-[2.5rem] h-[4rem] w-[13.5625rem]
    max-[767px]:mt-6 max-[767px]:h-[3.25rem] max-[767px]:w-[13.3125rem]
  "
          >
            Contact Us
          </Button>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}