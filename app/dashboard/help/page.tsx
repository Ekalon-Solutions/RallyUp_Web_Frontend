"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, MessageCircle, Book, Video, Mail, Phone, ExternalLink, RefreshCw, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api"

const faqData = [
  {
    question: "How do I add members to my club?",
    answer:
      "You can add members through the Members section using four different methods: individual email entry, bulk CSV upload, registration forms, or sharing QR codes/links for open access.",
  },
  {
    question: "How do I set up payment processing?",
    answer:
      "Go to Settings > Payment Settings to configure your payment gateway. We support Razorpay with a processing fee of 2.5% + Wingman Pro fee of 3%.",
  },
  {
    question: "Can I customize my club website?",
    answer:
      "Yes! Visit the Club Website section to configure navigation, content sections, social media links, and publish your hosted website at wingmanpro.tech/yourclub.",
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
  // { title: "Community Forum", icon: MessageCircle, description: "Connect with other clubs" },
]

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'checking';
  message?: string;
  responseTime?: number;
}

export default function HelpPage() {
  const [systemStatus, setSystemStatus] = useState<{
    status: 'operational' | 'degraded' | 'down';
    services: ServiceStatus[];
    timestamp?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getSystemStatus();
      
      if (response.success && response.data) {
        setSystemStatus({
          status: response.data.status,
          services: response.data.services,
          timestamp: response.data.timestamp
        });
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Failed to fetch system status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(() => {
      fetchSystemStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'operational':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'down':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500 hover:bg-green-600';
      case 'degraded':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'down':
        return 'bg-red-500 hover:bg-red-600';
      case 'checking':
        return 'bg-gray-400 hover:bg-gray-500';
      default:
        return 'bg-gray-400 hover:bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'degraded':
        return 'Degraded';
      case 'down':
        return 'Down';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  // Map service names to display names
  const getDisplayName = (serviceName: string): string => {
    const nameMap: Record<string, string> = {
      'Database': 'Database',
      'API Services': 'API Services',
      'Payment Processing': 'Payment Processing',
      'Website Hosting': 'Website Hosting'
    };
    return nameMap[serviceName] || serviceName;
  };

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
                  support@wingman.tech
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Real-time status of our services
                  {lastUpdated && (
                    <span className="ml-2 text-xs">
                      (Last updated: {lastUpdated.toLocaleTimeString()})
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSystemStatus}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && !systemStatus ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Checking system status...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8 text-red-500">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            ) : systemStatus ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                  {systemStatus.services.map((service) => (
                    <div
                      key={service.name}
                      className="flex flex-col gap-2 p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {getDisplayName(service.name)}
                        </span>
                        <Badge
                          variant={getStatusBadgeVariant(service.status)}
                          className={getStatusBadgeColor(service.status)}
                        >
                          {getStatusLabel(service.status)}
                        </Badge>
                      </div>
                      {service.message && (
                        <p className="text-xs text-muted-foreground">
                          {service.message}
                        </p>
                      )}
                      {service.responseTime !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Response time: {service.responseTime}ms
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {systemStatus.status === 'down' && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Some services are experiencing issues</span>
                    </div>
                  </div>
                )}
                {systemStatus.status === 'degraded' && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Some services are experiencing degraded performance</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No status information available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
