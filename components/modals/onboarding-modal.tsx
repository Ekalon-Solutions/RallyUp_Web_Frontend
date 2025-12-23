"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  UserPlus, 
  Target, 
  ArrowRight,
  Settings
} from "lucide-react"
import { toast } from "sonner"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"

interface OnboardingStep {
  id: string
  title: string
  description: string
  isCompleted: boolean
  isRequired: boolean
}

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onFlowCreated?: () => void
}

export default function OnboardingModal({ isOpen, onClose, onFlowCreated }: OnboardingModalProps) {
  const [loading, setLoading] = useState(false)
  
  // Form states
  const [flowName, setFlowName] = useState("")
  const [flowDescription, setFlowDescription] = useState("")
  const [targetAudience, setTargetAudience] = useState<'new_members' | 'existing_members' | 'all'>('new_members')
  const [estimatedDuration, setEstimatedDuration] = useState(15)
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: "welcome",
      title: "Welcome & Introduction",
      description: "Welcome message and community overview",
      isCompleted: false,
      isRequired: true
    },
    {
      id: "profile",
      title: "Complete Profile",
      description: "Fill out personal information and preferences",
      isCompleted: false,
      isRequired: true
    },
    {
      id: "tour",
      title: "Community Tour",
      description: "Navigate through key features and sections",
      isCompleted: false,
      isRequired: true
    }
  ])

  const addStep = () => {
    const newStep: OnboardingStep = {
      id: `step_${Date.now()}`,
      title: "",
      description: "",
      isCompleted: false,
      isRequired: true
    }
    setSteps([...steps, newStep])
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const updateStep = (index: number, field: keyof OnboardingStep, value: any) => {
    const updatedSteps = [...steps]
    updatedSteps[index] = { ...updatedSteps[index], [field]: value }
    setSteps(updatedSteps)
  }

  const handleCreateFlow = async () => {
    if (!flowName.trim()) {
      toast.error("Flow name is required")
      return
    }

    if (steps.length === 0) {
      toast.error("At least one step is required")
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.onboarding.flows), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: flowName,
          description: flowDescription,
          targetAudience,
          estimatedDuration,
          steps: steps.map(step => ({
            title: step.title,
            description: step.description,
            isRequired: step.isRequired
          }))
        }),
      })

      if (response.ok) {
        toast.success("Onboarding flow created successfully!")
        resetForm()
        onFlowCreated?.()
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to create onboarding flow")
      }
    } catch (error) {
      // console.error('Error creating onboarding flow:', error)
      toast.error("An error occurred while creating the flow")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFlowName("")
    setFlowDescription("")
    setTargetAudience('new_members')
    setEstimatedDuration(15)
    setSteps([
      {
        id: "welcome",
        title: "Welcome & Introduction",
        description: "Welcome message and community overview",
        isCompleted: false,
        isRequired: true
      },
      {
        id: "profile",
        title: "Complete Profile",
        description: "Fill out personal information and preferences",
        isCompleted: false,
        isRequired: true
      },
      {
        id: "tour",
        title: "Community Tour",
        description: "Navigate through key features and sections",
        isCompleted: false,
        isRequired: true
      }
    ])
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Onboarding & Member Management
          </DialogTitle>
          <DialogDescription>
            Create onboarding flows and manage member experiences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Flow Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="flow-name">Flow Name *</Label>
                    <Input
                      id="flow-name"
                      placeholder="e.g., New Member Welcome"
                      value={flowName}
                      onChange={(e) => setFlowName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flow-description">Description</Label>
                    <Textarea
                      id="flow-description"
                      placeholder="Describe the purpose and goals of this onboarding flow"
                      value={flowDescription}
                      onChange={(e) => setFlowDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="target-audience">Target Audience</Label>
                      <Select value={targetAudience} onValueChange={(value: any) => setTargetAudience(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new_members">New Members</SelectItem>
                          <SelectItem value="existing_members">Existing Members</SelectItem>
                          <SelectItem value="all">All Members</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="5"
                        max="120"
                        value={estimatedDuration}
                        onChange={(e) => setEstimatedDuration(parseInt(e.target.value) || 15)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Steps Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Onboarding Steps
                    <Badge variant="secondary">{steps.length} steps</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div key={step.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Step {index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            ×
                          </Button>
                        </div>
                        
                        <Input
                          placeholder="Step title"
                          value={step.title}
                          onChange={(e) => updateStep(index, 'title', e.target.value)}
                        />
                        
                        <Textarea
                          placeholder="Step description"
                          value={step.description}
                          onChange={(e) => updateStep(index, 'description', e.target.value)}
                          rows={2}
                        />
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`required-${step.id}`}
                            checked={step.isRequired}
                            onChange={(e) => updateStep(index, 'isRequired', e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor={`required-${step.id}`} className="text-sm">
                            Required step
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    onClick={addStep}
                    className="w-full"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Add Step
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
              <Button onClick={handleCreateFlow} disabled={loading}>
                {loading ? "Creating..." : "Create Onboarding Flow"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
