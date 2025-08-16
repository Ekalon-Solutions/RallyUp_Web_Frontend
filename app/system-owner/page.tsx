"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Shield, User, Mail, Phone, Key, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"

export default function SystemOwnerCreationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    countryCode: "+1",
    accessKey: ""
  })

  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.systemOwner.create), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("System owner created successfully!")
        
        // Login the system owner after creation
        const loginResult = await login(formData.email, formData.phoneNumber, formData.countryCode, false, true)
        if (loginResult.success) {
          router.push("/dashboard")
        } else {
          toast.error("Created but login failed. Please try logging in manually.")
          router.push("/system-owner-login")
        }
      } else {
        toast.error(data.message || "Failed to create system owner")
      }
    } catch (error) {
      console.error("System owner creation error:", error)
      toast.error("An error occurred during system owner creation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Create System Owner</CardTitle>
          <CardDescription>
            Initialize the RallyUp platform with a system owner account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-key">Access Key</Label>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="access-key"
                  type="password"
                  placeholder="Enter system owner access key"
                  value={formData.accessKey}
                  onChange={(e) => setFormData({ ...formData, accessKey: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label htmlFor="country-code">Country Code</Label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="country-code"
                    type="text"
                    placeholder="+1"
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating System Owner..." : "Create System Owner"}
              <Shield className="ml-2 w-4 h-4" />
            </Button>

            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Login
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 