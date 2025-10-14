"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  UserPlus, 
  CheckCircle, 
  Clock, 
  Target, 
  ArrowRight, 
  ArrowLeft,
  Star,
  Users,
  Trophy,
  Gift,
  Calendar,
  MessageSquare,
  BookOpen,
  MapPin,
  Settings
} from "lucide-react"
import { toast } from "sonner"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"

interface OnboardingStep {
  title: string
  description: string
  isCompleted: boolean
  isRequired: boolean
  estimatedTime: number
  order: number
}

interface OnboardingFlow {
  _id: string
  name: string
  description: string
  steps: OnboardingStep[]
  targetAudience: string
  estimatedDuration: number
  progress: number
  currentStep: number
  isActive: boolean
}

interface MemberOnboardingDashboardProps {
  userId: string
  userRole: 'member' | 'admin' | 'system_owner'
}

export default function MemberOnboardingDashboard({ userId, userRole }: MemberOnboardingDashboardProps) {
  const [onboardingFlows, setOnboardingFlows] = useState<OnboardingFlow[]>([])
  const [activeFlow, setActiveFlow] = useState<OnboardingFlow | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [showFlowSelection, setShowFlowSelection] = useState(false)

  useEffect(() => {
    fetchOnboardingFlows()
  }, [userId])

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
        // Backend already filters out completed flows for members
        // Filter to only show active flows and initialize step completion state
        const activeFlows = (data.flows || [])
          .filter((flow: any) => flow.isActive)
          .map((flow: any) => ({
            ...flow,
            steps: flow.steps.map((step: any, index: number) => ({
              ...step,
              isCompleted: false, // Initialize all steps as not completed
              estimatedTime: step.estimatedTime || 5 // Default estimated time
            })),
            progress: 0, // Initialize progress as 0
            currentStep: 0 // Start at first step
          }))
        
        setOnboardingFlows(activeFlows)
        
        // If no flows available, user has completed all onboarding
        if (activeFlows.length === 0) {
          setHasCompletedOnboarding(true)
          return
        }
        
        // Handle flow selection logic
        if (activeFlows && activeFlows.length > 0) {
          const flowWithProgress = activeFlows.find((f: OnboardingFlow) => f.progress > 0)
          
          if (flowWithProgress) {
            // User has progress in a specific flow, continue with that one
            setActiveFlow(flowWithProgress)
            setCurrentStepIndex(flowWithProgress.currentStep)
            setShowFlowSelection(false)
          } else if (activeFlows.length === 1) {
            // Only one flow available, start it automatically
            setActiveFlow(activeFlows[0])
            setCurrentStepIndex(0)
            setShowFlowSelection(false)
          } else {
            // Multiple flows available, show selection interface
            setShowFlowSelection(true)
            setActiveFlow(null)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching onboarding flows:', error)
    }
  }

  const completeStep = async (stepIndex: number) => {
    if (!activeFlow) return

    setLoading(true)
    try {
      // Update local state
      const updatedFlow = { ...activeFlow }
      if (stepIndex >= 0 && stepIndex < updatedFlow.steps.length) {
        updatedFlow.steps[stepIndex].isCompleted = true
        
        // Recalculate progress
        const completedSteps = updatedFlow.steps.filter(s => s.isCompleted).length
        updatedFlow.progress = (completedSteps / updatedFlow.steps.length) * 100
        
        // Prepare completed step indices
        const completedStepIndices = updatedFlow.steps
          .map((step, idx) => step.isCompleted ? idx : -1)
          .filter(idx => idx !== -1)
        
        // Update backend
        const token = localStorage.getItem('token')
        const response = await fetch(
          getApiUrl(API_ENDPOINTS.onboardingProgress.updateProgress(activeFlow._id)), 
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              currentStepIndex: stepIndex < updatedFlow.steps.length - 1 ? stepIndex + 1 : stepIndex,
              completedSteps: completedStepIndices,
              progress: updatedFlow.progress,
              status: updatedFlow.progress === 100 ? 'completed' : 'in_progress'
            })
          }
        )
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Failed to save progress. Status:', response.status, 'Error:', errorData)
          throw new Error(`Failed to save progress to server: ${errorData.message || response.statusText}`)
        }
        
        // Check if onboarding is complete
        if (updatedFlow.progress === 100) {
          // Mark onboarding as completed for this user
          localStorage.setItem(`onboarding_completed_${userId}`, 'true')
          setHasCompletedOnboarding(true)
          
          // Refetch flows to get updated list (backend will filter out completed ones)
          await fetchOnboardingFlows()
          
          toast.success("🎉 Congratulations! You've completed this onboarding flow!")
          
          // Return early since fetchOnboardingFlows will handle the flow selection
          return
        }
        
        // Move to next step if available
        if (stepIndex < updatedFlow.steps.length - 1) {
          updatedFlow.currentStep = stepIndex + 1
          setCurrentStepIndex(stepIndex + 1)
        } else {
          toast.success("Step completed successfully!")
        }
        
        setActiveFlow(updatedFlow)
        
        // Also update the flows array to keep it in sync
        setOnboardingFlows(prevFlows => 
          prevFlows.map(flow => 
            flow._id === updatedFlow._id ? updatedFlow : flow
          )
        )
        
        if (stepIndex >= updatedFlow.steps.length - 1) {
          toast.success("Step completed successfully!")
        }
      }
    } catch (error) {
      console.error('Error completing step:', error)
      toast.error("An error occurred while completing the step")
    } finally {
      setLoading(false)
    }
  }

  const selectFlow = (flow: OnboardingFlow) => {
    setActiveFlow(flow)
    setCurrentStepIndex(0)
    setShowFlowSelection(false)
    toast.success(`Starting "${flow.name}" onboarding`)
  }

  const nextStep = () => {
    if (activeFlow && currentStepIndex < activeFlow.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const getStepContent = (step: OnboardingStep) => {
    switch (step.title.toLowerCase()) {
      case 'welcome & introduction':
        return (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Welcome to the Community!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're excited to have you join us! This quick onboarding will help you get familiar with everything our community has to offer.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {activeFlow?.estimatedDuration} min total
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {activeFlow?.steps.length} steps
              </span>
            </div>
          </div>
        )
      
      case 'complete profile':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Complete Your Profile</h3>
            </div>
            <p className="text-muted-foreground">
              Help other members get to know you by filling out your profile information.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Profile Picture</label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                  <UserPlus className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload photo</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <textarea 
                  className="w-full p-3 border rounded-lg resize-none" 
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </div>
        )
      
      case 'community tour':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Community Tour</h3>
            </div>
            <p className="text-muted-foreground">
              Let's explore the key areas of our community together.
            </p>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <h4 className="font-medium">Forums & Discussions</h4>
                  <p className="text-sm text-muted-foreground">Join conversations and share your thoughts</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Calendar className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <h4 className="font-medium">Events & Activities</h4>
                  <p className="text-sm text-muted-foreground">Discover upcoming events and activities</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-500" />
                <div className="flex-1">
                  <h4 className="font-medium">Resources & Guides</h4>
                  <p className="text-sm text-muted-foreground">Access helpful resources and tutorials</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{step.title}</h3>
            <p className="text-muted-foreground">{step.description}</p>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                This step will guide you through: {step.description}
              </p>
            </div>
          </div>
        )
    }
  }

  if (showWelcome && onboardingFlows.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="text-center">
          <CardHeader>
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Welcome to the Community!</CardTitle>
            <p className="text-muted-foreground text-lg">
              {hasCompletedOnboarding
                ? "Congratulations! You've completed all available onboarding flows."
                : "No active onboarding flows are currently available. Please check back later or contact an administrator."
              }
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                {hasCompletedOnboarding
                  ? "You're all set! You can now explore the community and start engaging with other members."
                  : "Onboarding flows help new members get familiar with the community. Administrators can create and activate flows from the main onboarding dashboard."
                }
              </p>
              <Button 
                onClick={() => setShowWelcome(false)} 
                variant="outline"
                className="px-8"
                size="lg"
              >
                Continue to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Flow Selection Screen
  if (showFlowSelection && onboardingFlows.length > 1) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="text-center mb-6">
          <CardHeader>
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Choose Your Onboarding Path</CardTitle>
            <p className="text-muted-foreground text-lg">
              We have multiple onboarding experiences available. Select the one that best fits your needs.
            </p>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {onboardingFlows.map((flow) => (
            <Card key={flow._id} className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-lg">{flow.name}</CardTitle>
                  <div className="flex gap-1">
                    {flow.progress > 0 && (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        {Math.round(flow.progress)}% done
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {flow.estimatedDuration} min
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{flow.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="w-4 h-4" />
                    <span>{flow.steps.length} steps</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>For {flow.targetAudience.replace('_', ' ')}</span>
                  </div>
                  {flow.progress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${flow.progress}%` }}
                      />
                    </div>
                  )}
                  <Button 
                    onClick={() => selectFlow(flow)}
                    className="w-full"
                    size="sm"
                    variant={flow.progress > 0 ? "outline" : "default"}
                  >
                    {flow.progress > 0 ? "Continue This Onboarding" : "Start This Onboarding"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => {
              setShowFlowSelection(false)
              setShowWelcome(true)
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Welcome
          </Button>
        </div>
      </div>
    )
  }

  if (!activeFlow) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="text-center">
          <CardHeader>
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">No Onboarding Available</CardTitle>
            <p className="text-muted-foreground">
              Your onboarding experience is being prepared. Please check back soon!
            </p>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const currentStep = activeFlow.steps[currentStepIndex]
  // Use the flow's progress property which is updated when steps are completed
  const progress = activeFlow.progress || 0

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{activeFlow.name}</CardTitle>
              <p className="text-muted-foreground">{activeFlow.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {onboardingFlows.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    // Refetch flows to get updated list
                    await fetchOnboardingFlows()
                    // After fetching, show selection if there are multiple flows
                    if (onboardingFlows.length > 1) {
                      setShowFlowSelection(true)
                    }
                  }}
                  className="text-xs"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Switch Flow
                </Button>
              )}
              <Badge variant="outline" className="text-sm">
                {Math.round(progress)}% Complete
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="w-full" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step {currentStepIndex + 1} of {activeFlow.steps.length}</span>
            <span>{activeFlow.steps.filter(s => s.isCompleted).length} completed</span>
          </div>
        </CardHeader>
      </Card>

      {/* Current Step */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStep.isCompleted ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <div className="w-6 h-6 border-2 border-muted-foreground/25 rounded-full" />
              )}
              <div>
                <CardTitle className="text-lg">{currentStep.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {currentStep.isRequired ? 'Required' : 'Optional'} • {currentStep.estimatedTime} min
                </p>
              </div>
            </div>
            {currentStep.isCompleted && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {getStepContent(currentStep)}
          
          {!currentStep.isCompleted && (
            <div className="mt-6 pt-6 border-t">
              <Button 
                onClick={() => completeStep(currentStepIndex)}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "Completing..." : "Mark as Complete"}
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={previousStep}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex items-center gap-2">
          {activeFlow.steps.map((step, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${
                index === currentStepIndex
                  ? 'bg-primary'
                  : step.isCompleted
                  ? 'bg-green-500'
                  : 'bg-muted-foreground/25'
              }`}
              onClick={() => setCurrentStepIndex(index)}
            />
          ))}
        </div>
        
        <Button
          onClick={nextStep}
          disabled={currentStepIndex === activeFlow.steps.length - 1}
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Completion Celebration */}
      {progress === 100 && (
        <Card className="mt-6 border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">Congratulations!</h3>
            <p className="text-green-700 mb-4">
              You've completed your onboarding! You're now ready to fully participate in our community.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Star className="w-3 h-3 mr-1" />
                Onboarding Complete
              </Badge>
              <Badge variant="outline" className="text-green-700">
                Welcome to the community!
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
