"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle2, Circle, ChevronRight, Settings, Users, Calendar, Store, FileText, HelpCircle } from "lucide-react"

interface SetupStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
  link: string
}

export function GetStartedTab() {
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: "1",
      title: "Configure Website Settings",
      description: "Set up your club's basic information, website title, and contact details",
      icon: <Settings className="h-5 w-5" />,
      completed: false,
      link: "/dashboard/admin-settings?tab=website"
    },
    {
      id: "2",
      title: "Customize Design & Branding",
      description: "Upload your logo, choose colors, and set your club motto",
      icon: <FileText className="h-5 w-5" />,
      completed: false,
      link: "/dashboard/admin-settings?tab=design"
    },
    {
      id: "3",
      title: "Set Up Membership Plans",
      description: "Create membership tiers with different benefits and pricing",
      icon: <Users className="h-5 w-5" />,
      completed: false,
      link: "/dashboard/membership-plans"
    },
    {
      id: "4",
      title: "Create Your First Event",
      description: "Add an event to engage your members and build community",
      icon: <Calendar className="h-5 w-5" />,
      completed: false,
      link: "/dashboard/events/create"
    },
    {
      id: "5",
      title: "Add Merchandise",
      description: "Set up your club store with merchandise items",
      icon: <Store className="h-5 w-5" />,
      completed: false,
      link: "/dashboard/merchandise/create"
    },
    {
      id: "6",
      title: "Configure Help & Support",
      description: "Add FAQs and contact information for your members",
      icon: <HelpCircle className="h-5 w-5" />,
      completed: false,
      link: "/dashboard/admin-settings?tab=help"
    }
  ])

  const toggleStepComplete = (id: string) => {
    setSteps(steps.map(step => 
      step.id === id ? { ...step, completed: !step.completed } : step
    ))
  }

  const completedSteps = steps.filter(step => step.completed).length
  const totalSteps = steps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Welcome to RallyUp Admin!
          </CardTitle>
          <CardDescription>
            Follow these steps to set up your club and get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Setup Progress</span>
                <span className="text-muted-foreground">
                  {completedSteps} of {totalSteps} completed
                </span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            
            {completedSteps === totalSteps && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-medium">Great job! You've completed the setup!</p>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1 ml-7">
                  Your club is now ready to engage with members.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Checklist</CardTitle>
          <CardDescription>
            Click on each step to navigate to the relevant section
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`group relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                  step.completed
                    ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                    : "bg-card border-border hover:border-primary hover:shadow-md"
                }`}
              >
                {/* Step Number/Checkbox */}
                <div className="flex-shrink-0 mt-1">
                  <button
                    onClick={() => toggleStepComplete(step.id)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      step.completed
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-muted-foreground/30 group-hover:border-primary"
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </button>
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`${step.completed ? "text-green-600" : "text-primary"}`}>
                        {step.icon}
                      </div>
                      <div>
                        <h3 className={`font-semibold ${step.completed ? "line-through text-muted-foreground" : ""}`}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = step.link}
                      className="flex-shrink-0"
                    >
                      Go
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Common Admin Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Common Admin Tasks</CardTitle>
          <CardDescription>
            Quick links to frequently used admin functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <a href="/dashboard/members">
                <Users className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Manage Members</div>
                  <div className="text-xs text-muted-foreground">View and manage club members</div>
                </div>
              </a>
            </Button>

            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <a href="/dashboard/events">
                <Calendar className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">View Events</div>
                  <div className="text-xs text-muted-foreground">Manage upcoming events</div>
                </div>
              </a>
            </Button>

            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <a href="/dashboard/merchandise">
                <Store className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Manage Store</div>
                  <div className="text-xs text-muted-foreground">Update merchandise inventory</div>
                </div>
              </a>
            </Button>

            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <a href="/dashboard/admin-settings?tab=app-settings">
                <Settings className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">App Settings</div>
                  <div className="text-xs text-muted-foreground">Configure notifications & rules</div>
                </div>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
