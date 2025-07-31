"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, MessageCircle, Book, Video, Mail, Phone, ExternalLink } from "lucide-react"

const faqData = [
  {
    question: "How do I add members to my club?",
    answer:
      "You can add members through the Members section using four different methods: individual email entry, bulk CSV upload, registration forms, or sharing QR codes/links for open access.",
  },
  {
    question: "How do I set up payment processing?",
    answer:
      "Go to Settings > Payment Settings to configure your payment gateway. We support Razorpay with a processing fee of 2.5% + RallyUp fee of 3%.",
  },
  {
    question: "Can I customize my club website?",
    answer:
      "Yes! Visit the Club Website section to configure navigation, content sections, social media links, and publish your hosted website at group.chant.fan/yourclub.",
  },
  {
    question: "How do I create and manage events?",
    answer:
      "Use the Events & Tickets section to create events, set up ticketing, manage registrations, and track attendance. You can also create coupons and manage volunteer access.",
  },
  {
    question: "What's included in the store functionality?",
    answer:
      "The store allows you to sell merchandise with size/color variants, manage inventory, process orders, and configure delivery options (pickup, shipping, or both).",
  },
  {
    question: "How do member packages work?",
    answer:
      "Packages are membership tiers that can include auto-renewal, expiration dates, and different access levels. Members can only buy one package per email per season.",
  },
]

const quickLinks = [
  { title: "Getting Started Guide", icon: Book, description: "Complete setup walkthrough" },
  { title: "Video Tutorials", icon: Video, description: "Step-by-step video guides" },
  { title: "API Documentation", icon: ExternalLink, description: "For advanced integrations" },
  { title: "Community Forum", icon: MessageCircle, description: "Connect with other clubs" },
]

export default function HelpPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Help & Support</h1>
          <p className="text-muted-foreground">Find answers to common questions and get support for your club</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search help articles..." className="pl-10" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Links */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickLinks.map((link, index) => (
                  <Button key={index} variant="ghost" className="w-full justify-start h-auto p-3">
                    <link.icon className="w-4 h-4 mr-3 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">{link.title}</div>
                      <div className="text-xs text-muted-foreground">{link.description}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>Need personalized help? Reach out to our support team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Mail className="w-4 h-4 mr-2" />
                  support@rallyup.com
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Phone className="w-4 h-4 mr-2" />
                  +91 98765 43210
                </Button>
                <div className="text-xs text-muted-foreground">Support hours: Mon-Fri 9AM-6PM IST</div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqData.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Submit Ticket */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Submit a Support Ticket</CardTitle>
                <CardDescription>Can't find what you're looking for? Send us a detailed message</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <Input id="subject" placeholder="Describe your issue briefly" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="priority" className="text-sm font-medium">
                    Priority
                  </label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Please provide detailed information about your issue..."
                    rows={5}
                  />
                </div>
                <Button className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Submit Ticket
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">API Services</span>
                <Badge variant="default" className="bg-green-500">
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">Payment Processing</span>
                <Badge variant="default" className="bg-green-500">
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">Website Hosting</span>
                <Badge variant="default" className="bg-green-500">
                  Operational
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
