"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  UserPlus, 
  Plus,
  Trash2,
  Target
} from "lucide-react"
import OnboardingModal from "@/components/modals/onboarding-modal"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"
import { toast } from "sonner"
import UserOnboardingProgressAdmin from "@/components/admin/user-onboarding-progress-admin"

interface OnboardingFlow {
  _id: string
  name: string
  description: string
  steps: {
    id?: string
    _id?: string
    title: string
    description: string
    isRequired: boolean
  }[]
  targetAudience: 'new_members' | 'existing_members' | 'all'
  isActive: boolean
  estimatedDuration: number
  createdAt: string
}

export default function OnboardingDashboard() {
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [flows, setFlows] = useState<OnboardingFlow[]>([])
  const [loading, setLoading] = useState(false)
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editTargetAudience, setEditTargetAudience] = useState<'new_members' | 'existing_members' | 'all'>('new_members')
  const [editEstimatedDuration, setEditEstimatedDuration] = useState(15)
  const [editSteps, setEditSteps] = useState<Array<{ id: string; title: string; description: string; isRequired: boolean }>>([])
  const [updatingFlow, setUpdatingFlow] = useState(false)

  // Fetch flows when component mounts
  useEffect(() => {
    fetchFlows()
  }, [])

  const fetchFlows = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.onboarding.flows), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setFlows(data.flows || [])
      } else {
        // console.error('Failed to fetch flows')
      }
    } catch (error) {
      // console.error('Error fetching flows:', error)
    } finally {
      setLoading(false)
    }
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
        fetchFlows() // Refresh the list
      } else {
        toast.error('Failed to update flow status')
      }
    } catch (error) {
      // console.error('Error toggling flow status:', error)
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
        fetchFlows() // Refresh the list
      } else {
        toast.error("Failed to delete flow")
      }
    } catch (error) {
      // console.error('Error deleting flow:', error)
      toast.error("Failed to delete flow")
    }
  }

  const startEditingFlow = (flow: OnboardingFlow) => {
    setEditingFlowId(flow._id)
    setEditName(flow.name)
    setEditDescription(flow.description)
    setEditTargetAudience(flow.targetAudience)
    setEditEstimatedDuration(flow.estimatedDuration)
    setEditSteps(
      (flow.steps || []).map((step, index) => ({
        id: step.id || step._id || `step-${index}`,
        title: step.title,
        description: step.description,
        isRequired: step.isRequired,
      }))
    )
  }

  const resetEditing = () => {
    setEditingFlowId(null)
    setEditName("")
    setEditDescription("")
    setEditTargetAudience('new_members')
    setEditEstimatedDuration(15)
    setEditSteps([])
    setUpdatingFlow(false)
  }

  const updateEditingStep = (index: number, field: keyof Omit<typeof editSteps[number], "id">, value: any) => {
    const nextSteps = [...editSteps]
    nextSteps[index] = { ...nextSteps[index], [field]: value }
    setEditSteps(nextSteps)
  }

  const addEditingStep = () => {
    setEditSteps([
      ...editSteps,
      { id: `step-${Date.now()}`, title: "", description: "", isRequired: true },
    ])
  }

  const removeEditingStep = (index: number) => {
    setEditSteps(editSteps.filter((_, i) => i !== index))
  }

  const handleUpdateFlow = async () => {
    if (!editingFlowId) return
    if (!editName.trim()) {
      toast.error("Flow name is required")
      return
    }
    if (editSteps.length === 0) {
      toast.error("At least one step is required")
      return
    }

    setUpdatingFlow(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.onboarding.flows) + `/${editingFlowId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          targetAudience: editTargetAudience,
          estimatedDuration: editEstimatedDuration,
          steps: editSteps.map(step => ({
            title: step.title,
            description: step.description,
            isRequired: step.isRequired,
          })),
        }),
      })

      if (response.ok) {
        toast.success("Onboarding flow updated successfully!")
        resetEditing()
        fetchFlows()
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to update flow")
      }
    } catch (error) {
      toast.error("Failed to update flow")
    } finally {
      setUpdatingFlow(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Member Onboarding & Engagement</h1>
          <p className="text-muted-foreground">
            Create and manage onboarding flows for your community
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowOnboardingModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Create Onboarding Flow
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
          {editingFlowId && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Edit Onboarding Flow</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetEditing}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleUpdateFlow} disabled={updatingFlow}>
                      {updatingFlow ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Flow Name *</Label>
                    <Input
                      id="edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-duration">Estimated Duration (minutes)</Label>
                    <Input
                      id="edit-duration"
                      type="number"
                      min={5}
                      max={120}
                      value={editEstimatedDuration}
                      onChange={(e) => setEditEstimatedDuration(parseInt(e.target.value) || 15)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select value={editTargetAudience} onValueChange={(value: any) => setEditTargetAudience(value)}>
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
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Steps</Label>
                    <Badge variant="secondary">{editSteps.length} steps</Badge>
                  </div>
                  {editSteps.map((step, index) => (
                    <div key={step.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Step {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEditingStep(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                      <Input
                        placeholder="Step title"
                        value={step.title}
                        onChange={(e) => updateEditingStep(index, 'title', e.target.value)}
                      />
                      <Textarea
                        placeholder="Step description"
                        rows={2}
                        value={step.description}
                        onChange={(e) => updateEditingStep(index, 'description', e.target.value)}
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-required-${step.id}`}
                          checked={step.isRequired}
                          onChange={(e) => updateEditingStep(index, 'isRequired', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor={`edit-required-${step.id}`} className="text-sm">
                          Required step
                        </Label>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={addEditingStep}>
                    <Target className="w-4 h-4 mr-2" />
                    Add Step
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Onboarding Flows</CardTitle>
                <Button onClick={() => setShowOnboardingModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Flow
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Loading onboarding flows...</p>
                </div>
              ) : flows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Onboarding Flows Yet</h3>
                  <p className="mb-4">
                    Create your first onboarding flow to help new members get started
                  </p>
                  <Button onClick={() => setShowOnboardingModal(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create First Flow
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {flows.map((flow) => (
                    <Card key={flow._id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{flow.name}</h4>
                          <p className="text-sm text-muted-foreground">{flow.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={flow.isActive ? "default" : "secondary"}>
                            {flow.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleFlowStatus(flow._id, !flow.isActive)}
                          >
                            {flow.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditingFlow(flow)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteFlow(flow._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p>Steps: {flow.steps.length}</p>
                        <p>Duration: {flow.estimatedDuration} minutes</p>
                        <p>Target Audience: {flow.targetAudience}</p>
                        <p>Created: {new Date(flow.createdAt).toLocaleDateString()}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Progress Tracking */}
          <UserOnboardingProgressAdmin />
      </div>

      {/* Modals */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onFlowCreated={() => {
          setShowOnboardingModal(false)
          fetchFlows() // Refresh the flows list
        }}
      />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
