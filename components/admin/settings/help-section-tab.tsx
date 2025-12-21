"use client"

import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Save, HelpCircle, Plus, Trash2, ChevronDown, ChevronUp, Mail, Phone, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"

interface FAQ {
  id: string
  question: string
  answer: string
  expanded?: boolean
}

interface ContactInfo {
  email: string
  phone: string
  supportHours: string
}

export function HelpSectionTab() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: "",
    phone: "",
    supportHours: ""
  })

  const faqRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const clubId = (user as any)?.club?._id || (user as any)?.club_id?._id

  useEffect(() => {
    if (clubId) {
      loadSettings()
    }
  }, [clubId])

  const loadSettings = async () => {
    if (!clubId) return

    try {
      setLoading(true)
      const response = await apiClient.getClubSettings(clubId)
      
      if (response.success && response.data) {
        const actualData = response.data.data || response.data
        const helpSection = actualData.helpSection || {
          faqs: [],
          contactInfo: {
            email: "",
            phone: "",
            supportHours: ""
          }
        }

        const loadedFAQs = helpSection.faqs.map((faq: any, index: number) => ({
          id: `faq-${index}-${Date.now()}`,
          question: faq.question || "",
          answer: faq.answer || "",
          expanded: false
        }))

        setFaqs(loadedFAQs.length > 0 ? loadedFAQs : [])
        setContactInfo({
          email: helpSection.contactInfo?.email || "",
          phone: helpSection.contactInfo?.phone || "",
          supportHours: helpSection.contactInfo?.supportHours || ""
        })
      }
    } catch (error) {
      toast.error("Failed to load help section")
    } finally {
      setLoading(false)
    }
  }

  const addFAQ = () => {
    const newId = Date.now().toString()
    const newFAQ: FAQ = {
      id: newId,
      question: "",
      answer: "",
      expanded: true
    }
    setFaqs([...faqs, newFAQ])
    
    setTimeout(() => {
      const element = faqRefs.current[newId]
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        const input = element.querySelector(`#question-${newId}`) as HTMLInputElement
        if (input) {
          input.focus()
        }
      }
    }, 100)
  }

  const removeFAQ = (id: string) => {
    setFaqs(faqs.filter(faq => faq.id !== id))
    toast.success("FAQ removed")
  }

  const updateFAQ = (id: string, field: 'question' | 'answer', value: string) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, [field]: value } : faq
    ))
  }

  const toggleFAQ = (id: string) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, expanded: !faq.expanded } : faq
    ))
  }

  const handleSave = async () => {
    if (!clubId) {
      toast.error("Club ID not found")
      return
    }

    try {
      const validFAQs = faqs.filter(faq => faq.question.trim() && faq.answer.trim())
      const invalidFAQs = faqs.filter(faq => (!faq.question.trim() || !faq.answer.trim()) && (faq.question.trim() || faq.answer.trim()))
      
      if (invalidFAQs.length > 0) {
        toast.error("Please fill in all FAQ questions and answers completely")
        return
      }

      setSaving(true)

      const faqsToSave = validFAQs.map((faq, index) => ({
        question: faq.question.trim(),
        answer: faq.answer.trim(),
        order: index
      }))

      const response = await apiClient.updateHelpSection(clubId, {
        faqs: faqsToSave,
        contactInfo: {
          email: contactInfo.email.trim(),
          phone: contactInfo.phone.trim(),
          supportHours: contactInfo.supportHours.trim()
        }
      })

      if (response.success) {
        toast.success("Help section saved successfully!")
        await loadSettings()
      } else {
        toast.error(response.error || "Failed to save help section")
      }
    } catch (error) {
      toast.error("Failed to save help section")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* FAQs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Create and manage FAQs to help your members
              </CardDescription>
            </div>
            <Button onClick={addFAQ} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No FAQs yet. Click "Add FAQ" to create one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={faq.id}
                  ref={(el) => { faqRefs.current[faq.id] = el }}
                >
                  <Card className="border-2">
                    <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFAQ(faq.id)}
                            className="p-0 h-6 w-6"
                          >
                            {faq.expanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <span className="text-sm font-semibold text-muted-foreground">
                            FAQ #{index + 1}
                          </span>
                        </div>
                        
                        {faq.expanded ? (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor={`question-${faq.id}`}>Question</Label>
                              <Input
                                id={`question-${faq.id}`}
                                value={faq.question}
                                onChange={(e) => updateFAQ(faq.id, 'question', e.target.value)}
                                placeholder="Enter your question here..."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`answer-${faq.id}`}>Answer</Label>
                              <Textarea
                                id={`answer-${faq.id}`}
                                value={faq.answer}
                                onChange={(e) => updateFAQ(faq.id, 'answer', e.target.value)}
                                placeholder="Enter the answer here..."
                                rows={4}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="pl-8">
                            <p className="font-medium">{faq.question || "Untitled Question"}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {faq.answer || "No answer provided"}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFAQ(faq.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Contact Information
          </CardTitle>
          <CardDescription>
            Provide contact details for member support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Support Email
            </Label>
            <Input
              id="email"
              type="email"
              value={contactInfo.email}
              onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
              placeholder="support@yourclub.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Support Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={contactInfo.phone}
              onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportHours">Support Hours</Label>
            <Input
              id="supportHours"
              value={contactInfo.supportHours}
              onChange={(e) => setContactInfo({ ...contactInfo, supportHours: e.target.value })}
              placeholder="Monday - Friday, 9:00 AM - 6:00 PM EST"
            />
          </div>

          <div className="mt-4 p-4 rounded-lg bg-muted">
            <p className="text-sm font-medium mb-2">Preview:</p>
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {contactInfo.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {contactInfo.phone}
              </p>
              <p className="text-muted-foreground">{contactInfo.supportHours}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Help Section
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
