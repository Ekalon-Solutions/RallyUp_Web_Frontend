"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  UserPlus, 
  Users, 
  Mail, 
  Phone, 
  Building, 
  Star, 
  Gift, 
  Target, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Send,
  Settings,
  Calendar,
  MessageSquare
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

interface OnboardingFlow {
  _id: string
  name: string
  description: string
  steps: OnboardingStep[]
  targetAudience: 'new_members' | 'existing_members' | 'all'
  isActive: boolean
  estimatedDuration: number
  createdAt: string
}

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onFlowCreated?: () => void
}

export default function OnboardingModal({ isOpen, onClose, onFlowCreated }: OnboardingModalProps) {
  const [activeTab, setActiveTab] = useState("create")
  const [loading, setLoading] = useState(false)
  const [flows, setFlows] = useState<OnboardingFlow[]>([])
  const [selectedFlow, setSelectedFlow] = useState<OnboardingFlow | null>(null)
  
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

  useEffect(() => {
    if (isOpen) {
      fetchOnboardingFlows()
    }
  }, [isOpen])

  const fetchOnboardingFlows = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.onboarding.flows), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setFlows(data.flows || [])
      }
    } catch (error) {
      console.error('Error fetching onboarding flows:', error)
    }
  }

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
        setActiveTab("manage")
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to create onboarding flow")
      }
    } catch (error) {
      console.error('Error creating onboarding flow:', error)
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

  const toggleFlowStatus = async (flowId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.onboarding.flows) + `/${flowId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        toast.success(`Flow ${isActive ? 'activated' : 'deactivated'} successfully!`)
        fetchOnboardingFlows()
      }
    } catch (error) {
      console.error('Error toggling flow status:', error)
      toast.error("Failed to update flow status")
    }
  }

  const deleteFlow = async (flowId: string) => {
    if (!confirm("Are you sure you want to delete this onboarding flow? This action cannot be undone.")) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.onboarding.flows) + `/${flowId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success("Onboarding flow deleted successfully!")
        fetchOnboardingFlows()
      }
    } catch (error) {
      console.error('Error deleting flow:', error)
      toast.error("Failed to delete flow")
    }
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create Flow</TabsTrigger>
            <TabsTrigger value="manage">Manage Flows</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <div className="grid gap-4">
              {flows.map((flow) => (
                <Card key={flow._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{flow.name}</h3>
                          <Badge variant={flow.isActive ? "default" : "secondary"}>
                            {flow.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {flow.targetAudience.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {flow.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {flow.steps.length} steps
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {flow.estimatedDuration} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(flow.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant={flow.isActive ? "outline" : "default"}
                          size="sm"
                          onClick={() => toggleFlowStatus(flow._id, !flow.isActive)}
                        >
                          {flow.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFlow(flow)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteFlow(flow._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {flows.length === 0 && (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Onboarding Flows</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first onboarding flow to help new members get started
                  </p>
                  <Button onClick={() => setActiveTab("create")}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create First Flow
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Flows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{flows.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active onboarding flows
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Active Flows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {flows.filter(f => f.isActive).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently running
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {flows.length > 0 
                      ? Math.round(flows.reduce((sum, f) => sum + f.estimatedDuration, 0) / flows.length)
                      : 0
                    } min
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per flow
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                  <p>Analytics data will appear here as members complete onboarding flows</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
