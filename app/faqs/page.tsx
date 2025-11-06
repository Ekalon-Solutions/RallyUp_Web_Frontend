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
      category: "General & Technical",
      questions: [
        {
          question: "What is Wingman Pro?",
          answer: <>It is an all-encompassing sports club management platform developed by <strong>RallyUp Solutions Pvt. Ltd.</strong> It centralizes member management, communications, events, and payments into one cohesive system, eliminating the need for fragmented tools.</>
        },
        {
          question: "Who is Wingman Pro designed for?",
          answer: "It is designed for sports club administrators, managers, and volunteer staff who need to streamline operations, reduce paperwork, improve member engagement, and grow their organization efficiently."
        },
        {
          question: "What technology does Wingman Pro use?",
          answer: "The core platform utilizes a robust, scalable technology stack designed for growth and reliability. We are the reliable partner that keeps your operations seamless and secure."
        },
        {
          question: "Does Wingman Pro replace our existing website?",
          answer: <><strong>Wingman Pro</strong> acts as your central operating system, replacing fragmented administrative tools. You can either use its dedicated interface as your primary web portal or easily integrate its key functions (like registration and store links) into your existing club website.</>
        }
      ]
    },
    {
      category: "Onboarding & Usage",
      questions: [
        {
          question: "How do users log into the app?",
          answer: <>User access is secured via a mandatory <strong>OTP (One-Time Password)</strong> login mechanism delivered instantly via <strong>Email and Mobile SMS</strong>.</>
        },
        {
          question: "How do we get our current member data onto Wingman Pro?",
          answer: <>Our support team handles the secure data migration. You provide your existing member data in a standard format (like <strong>CSV or Excel</strong>), and we manage the mapping and secure transfer to your new <strong>Wingman Pro</strong> dashboard. We work with you to verify all data accuracy before going live.</>
        },
        {
          question: "What kind of training is provided for our volunteers and administrators?",
          answer: "We provide comprehensive, personalized training sessions tailored to your team's roles, including one-on-one sessions, dedicated after-sales support through our communication channels and easy to use self-help documentation."
        },
        {
          question: "Can we track attendance for events and training sessions?",
          answer: <>Yes. The <strong>Event Management module</strong> includes <strong>Attendance Tracking functionality</strong>. You can quickly track check-ins for events, training, or meetings, providing valuable data for resource allocation and member engagement analysis.</>
        },
        {
          question: "Can members update their own profile information?",
          answer: "Yes. Members have direct, secure access to their profile and can update their personal contact details and preferences at any time. This ensures the data accuracy remains current, reducing the administrative burden on club staff."
        }
      ]
    },
    {
      category: "Financial & Commerce Management",
      questions: [
        {
          question: "Can Wingman Pro handle our merchandise sales and ticketing?",
          answer: <>Yes. <strong>Wingman Pro</strong> includes fully integrated <strong>Store and Ticketing modules</strong>. You can list merchandise, manage inventory, sell event tickets (including recurring events), and consolidate all sales directly into centralized financial reports.</>
        },
        {
          question: "Is there an extra fee for payment processing?",
          answer: <>We integrate with secure, reputable payment gateways (<strong>RazorPay and Stripe</strong>). The standard transaction processing fee charged by the payment gateway itself will apply to each transaction. All fees are transparently outlined in your pricing package taken during the contract agreement.</>
        },
        {
          question: "How does the system handle membership renewals?",
          answer: <>The platform gives you the option to automate this process. You can set up automated renewal reminders via in-app notification, email and SMS. The system automatically tracks member status (<strong>Active, Pending, Expired</strong>) and allows administrators to easily generate reports, minimizing manual administrative effort.</>
        }
      ]
    },
    {
      category: "Security & Compliance",
      questions: [
        {
          question: "How is my club's data protected?",
          answer: "We implement comprehensive technical and organizational safeguards, including data encryption, access controls, and regular security assessments. We are committed to global data protection principles."
        },
        {
          question: "Is the platform compliant with international data laws?",
          answer: <>Yes. We adhere to the stringent <strong>DPDPA (India)</strong> and general principles of global frameworks like <strong>GDPR/UK GDPR</strong> by maintaining secure data practices and implementing robust data subject rights mechanisms.</>
        },
        {
          question: "What happens if a member withdraws their consent for data usage?",
          answer: <>As required by global data privacy laws (like the <strong>DPDPA and GDPR</strong>), <strong>Wingman Pro</strong> provides tools to manage consent withdrawal. Our system enables administrators to instantly halt all processing of that user's non-essential personal data and securely erase it upon request (subject to necessary legal retention requirements).</>
        },
        {
          question: "What role does RallyUp Solutions play in managing my members' data?",
          answer: <>We act as the <strong>Data Processor</strong> (or <strong>Data Fiduciary/Controller</strong>, depending on the region) providing the secure technology. The Club/Group maintains full responsibility for the data accuracy and integrity of its members.</>
        }
      ]
    },
    {
      category: "Engagement & Data Security",
      questions: [
        {
          question: "How does Wingman Pro help us engage with our members more effectively?",
          answer: <>The platform centralizes communication tools, allowing you to send targeted SMS and Email notifications for urgent updates, events, or announcements. Furthermore, features like the <strong>Leaderboard, Polls</strong>, and specialized Content sections (<strong>News/Events, Gallery</strong>) encourage active participation, helping to strengthen community loyalty and engagement.</>
        },
        {
          question: "What happens if a member withdraws their consent for data usage?",
          answer: <>As required by global data privacy laws (like the <strong>DPDPA and GDPR</strong>), <strong>Wingman Pro</strong> provides tools to manage consent withdrawal. If a member revokes their consent, our system enables administrators to instantly halt all processing of that user's non-essential personal data and securely erase it upon request (subject to necessary legal retention requirements).</>
        },
        {
          question: "Can we track attendance for events and training sessions?",
          answer: <>Yes. The <strong>Event Management module</strong> includes <strong>Attendance Tracking functionality</strong>. You can quickly track check-ins for events, training, or meetings, providing valuable data for resource allocation and member engagement analysis.</>
        }
      ]
    },
    {
      category: "Customization, Branding & Data Ownership",
      questions: [
        {
          question: "Can we brand the platform with our club's colours and logo?",
          answer: <>Absolutely. <strong>Wingman Pro</strong> supports deep visual customization. Administrators can easily upload the club's logo, set primary and secondary colours, and configure branding elements to ensure the member interface is fully consistent with the club's identity.</>
        },
        {
          question: "Who owns the data we upload to Wingman Pro?",
          answer: <>You retain full ownership of all <strong>User Content</strong> and member data uploaded to the platform. <strong>RallyUp Solutions</strong> acts purely as the data processor (or fiduciary) providing the secure technology and hosting service. We will never sell or misuse your member data, as strictly outlined in our <strong>Privacy Policy and Terms & Conditions</strong>.</>
        },
        {
          question: "Can we export our data if we decide to leave the Wingman Pro platform?",
          answer: <>Yes. We ensure full data portability. Clubs maintain the right to receive a copy of their core data (member details, financial reports, etc.) in a standard, machine-readable format upon request, guaranteeing a smooth transition if your needs ever change.</>
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

