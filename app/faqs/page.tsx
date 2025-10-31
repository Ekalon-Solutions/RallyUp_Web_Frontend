"use client"

import type React from "react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react"

export default function FAQsPage(): React.JSX.Element {
  const faqs = [
    {
      category: "General",
      questions: [
        {
          question: "What is Wingman Pro?",
          answer: "Wingman Pro is a comprehensive platform designed for football supporter groups to manage members, organize events, sell merchandise, run polls, and engage their community—all in one place. It's built to help supporter groups run smoothly so leaders can focus on what matters: supporting their club."
        },
        {
          question: "Who can use Wingman Pro?",
          answer: "Wingman Pro is designed for football supporter groups, fan clubs, and professional clubs looking to engage with their community. Whether you're a small local group or a large organization, our platform can scale to meet your needs."
        },
        {
          question: "How do I get started?",
          answer: "Getting started is simple! Visit our clubs page, create an account, and set up your supporter group. You'll have access to all features including member management, event planning, merchandise store, and more. Our team is also available to help guide you through the setup process."
        },
        {
          question: "Is there a mobile app?",
          answer: "Wingman Pro is a web-based platform that works seamlessly on all devices including smartphones, tablets, and desktops. You can access all features through your mobile browser, ensuring your community can engage from anywhere."
        }
      ]
    },
    {
      category: "Membership & Accounts",
      questions: [
        {
          question: "How does member management work?",
          answer: "Wingman Pro provides comprehensive member management tools. You can add members manually or allow them to register themselves. Each member gets a profile, digital membership card, and access to group-specific features. Members can track their engagement, view leaderboards, and participate in polls."
        },
        {
          question: "What is OTP authentication?",
          answer: "We use One-Time Password (OTP) authentication for secure account access. When logging in, members receive a unique code via email and SMS. This ensures that only authorized users can access their accounts and protects member data."
        },
        {
          question: "Can members have different roles?",
          answer: "Yes! Wingman Pro supports role-based access control. You can assign different roles such as admin, moderator, staff, or member, each with appropriate permissions. This helps you manage your group effectively while giving members the right level of access."
        },
        {
          question: "What is the minimum age requirement?",
          answer: "Wingman Pro is intended for users who are at least 18 years of age or the age of legal majority in their jurisdiction. We do not knowingly allow clubs to collect personal data from children without parental consent."
        }
      ]
    },
    {
      category: "Events & Tickets",
      questions: [
        {
          question: "How do I create and manage events?",
          answer: "Creating events is straightforward. Simply go to the Events section, click 'Create Event', fill in details like date, time, location, and description. You can set capacity limits, ticket prices, and customize event settings. Members can then RSVP or purchase tickets directly through the platform."
        },
        {
          question: "Can I sell tickets through Wingman Pro?",
          answer: "Absolutely! Wingman Pro includes a full ticketing system. You can create events with paid or free tickets, set pricing, manage capacity, and track attendance. All transactions are processed securely through our integrated payment gateway."
        },
        {
          question: "How do away day trips work?",
          answer: "You can organize away day trips using our Events feature. Create an event for the away match, set departure times and locations, manage bus/transport bookings, and track RSVPs. Members can reserve seats and coordinate travel logistics all in one place."
        }
      ]
    },
    {
      category: "Merchandise & Store",
      questions: [
        {
          question: "Can I sell merchandise through Wingman Pro?",
          answer: "Yes! Wingman Pro includes a built-in merchandise store. You can add products, set prices, manage inventory, and process orders. Members can browse your store, add items to cart, and checkout securely. The platform tracks orders from purchase to fulfillment."
        },
        {
          question: "How do payments work?",
          answer: "Payments for merchandise and tickets are processed securely through our payment partner gateway. We support multiple payment methods including credit cards, debit cards, and digital wallets. All sensitive payment information is handled by our certified payment partner—we never store full card details."
        },
        {
          question: "What payment methods are accepted?",
          answer: "We support various payment methods depending on your region. Typically, this includes major credit cards, debit cards, UPI, digital wallets, and bank transfers. The exact methods available will depend on your location and payment provider."
        }
      ]
    },
    {
      category: "Features & Platform",
      questions: [
        {
          question: "What features are included?",
          answer: "Wingman Pro includes member management, event planning and ticketing, merchandise store, polls and voting, leaderboards, matchday tools (check-ins, predictions, player of the match), chants library, forum/discussions, membership cards, volunteer management, and more—all integrated into one platform."
        },
        {
          question: "Can I customize the platform for my group?",
          answer: "Yes! You can customize branding, colors, logos, and content to match your supporter group's identity. The platform supports multiple clubs, each with its own branding and settings, while sharing the same powerful tools."
        },
        {
          question: "How do polls work?",
          answer: "Polls allow you to engage your community with quick questions and instant results. Create polls on any topic—match predictions, event preferences, merchandise choices, and more. Results are displayed in real-time, and you can track participation."
        },
        {
          question: "What about data privacy and security?",
          answer: "Data privacy and security are paramount. We implement encryption, access controls, and follow best practices for data protection. We comply with applicable privacy laws including GDPR, DPDPA (India), and other regional regulations. See our Privacy Policy for detailed information."
        }
      ]
    },
    {
      category: "Support & Pricing",
      questions: [
        {
          question: "How can I get support?",
          answer: "We offer multiple support channels. You can reach out through our contact page, email us at response@wingmanpro.tech, or use the in-platform help section. Our support team is available to assist with setup, troubleshooting, and platform questions."
        },
        {
          question: "Is there a free trial?",
          answer: "Yes, we offer trial periods for new clubs. Contact us to learn more about trial options and pricing plans that best fit your supporter group's needs and size."
        },
        {
          question: "What are the pricing options?",
          answer: "Pricing varies based on your group size and needs. We offer flexible plans for small groups to large organizations. Contact us to discuss your requirements and we'll recommend the best plan for you."
        },
        {
          question: "Can I cancel or change my plan?",
          answer: "Yes, you can upgrade, downgrade, or cancel your plan at any time. Changes take effect based on your billing cycle. Contact our support team if you need assistance with plan changes."
        }
      ]
    }
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white">
      <SiteNavbar />
      <div className="mx-auto max-w-4xl px-4 py-16">
        <FadeIn>
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center mb-4">
              <HelpCircle className="h-12 w-12 text-sky-600 dark:text-sky-300" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg max-w-2xl mx-auto">
              Find answers to common questions about Wingman Pro. Can't find what you're looking for? <a href="/contact" className="text-sky-600 dark:text-sky-300 hover:underline">Contact us</a> and we'll be happy to help.
            </p>
          </div>
        </FadeIn>

        <FadeIn>
          <div className="space-y-8">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-4">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{category.category}</h2>
                <Accordion type="single" collapsible className="space-y-3">
                  {category.questions.map((faq, faqIndex) => (
                    <AccordionItem
                      key={faqIndex}
                      value={`item-${categoryIndex}-${faqIndex}`}
                      className="border border-slate-200 dark:border-white/10 rounded-lg px-4 bg-white dark:bg-white/5"
                    >
                      <AccordionTrigger className="text-left text-slate-900 dark:text-white hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 dark:text-slate-300 pt-2 pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn>
          <Card className="mt-12 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-sky-500/10 border-slate-200 dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Still have questions?</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-700 dark:text-slate-300">
              <p className="mb-4">
                We're here to help! Reach out to our support team and we'll get back to you as soon as possible.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="/contact" className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-6 py-3 text-white hover:bg-sky-500 dark:bg-sky-400 dark:text-slate-900 dark:hover:bg-sky-300 transition-colors">
                  Contact Support
                </a>
                <a href="/about" className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-white/20 bg-white px-6 py-3 text-slate-900 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 transition-colors">
                  Learn More About Us
                </a>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}

