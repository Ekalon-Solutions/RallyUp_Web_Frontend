"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Save, HelpCircle, Plus, Trash2, ChevronDown, ChevronUp, Mail, Phone, MessageCircle } from "lucide-react"
import { toast } from "sonner"

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
  const [saving, setSaving] = useState(false)
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: "1",
      question: "How do I renew my membership?",
      answer: "Navigate to your dashboard, select 'Browse Plans', and click on your current plan to renew. You can upgrade or downgrade based on your membership status.",
      expanded: false
    }
  ])
  
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: "support@rallyup.com",
    phone: "+1 (555) 123-4567",
    supportHours: "Monday - Friday, 9:00 AM - 6:00 PM EST"
  })

  const addFAQ = () => {
    const newFAQ: FAQ = {
      id: Date.now().toString(),
      question: "",
      answer: "",
      expanded: true
    }
    setFaqs([...faqs, newFAQ])
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
    try {
      // Validate FAQs
      const invalidFAQs = faqs.filter(faq => !faq.question.trim() || !faq.answer.trim())
      if (invalidFAQs.length > 0) {
        toast.error("Please fill in all FAQ questions and answers")
        return
      }

      setSaving(true)
      // TODO: Implement API call
      // const response = await apiClient.updateHelpSection({ faqs, contactInfo })
      toast.success("Help section saved successfully!")
    } catch (error) {
      // console.error("Error saving help section:", error)
      toast.error("Failed to save help section")
    } finally {
      setSaving(false)
    }
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
                <Card key={faq.id} className="border-2">
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
