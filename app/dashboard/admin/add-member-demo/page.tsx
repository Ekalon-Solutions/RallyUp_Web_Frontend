"use client"

import { AddMemberModal } from "@/components/modals/add-member-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, Users, CreditCard, DollarSign } from "lucide-react"

export default function AddMemberDemoPage() {
  const handleMemberAdded = () => {
    // console.log("Member was added successfully!")
    // You can add additional logic here like refreshing a member list
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Admin Member Management</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This page demonstrates the enhanced Add Member modal that combines user creation with membership plan selection.
          Admins can now create new users and assign them to membership plans in a single workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>User Creation</CardTitle>
            <CardDescription>
              Comprehensive user registration form with all required fields
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Personal information</li>
              <li>• Contact details</li>
              <li>• Address information</li>
              <li>• ID proof verification</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Plan Selection</CardTitle>
            <CardDescription>
              Choose from available club membership plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• View all available plans</li>
              <li>• Compare features & pricing</li>
              <li>• Select appropriate plan</li>
              <li>• Handle free vs paid plans</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <CardTitle>Payment Handling</CardTitle>
            <CardDescription>
              Flexible payment options for admins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Cash payment (already collected)</li>
              <li>• Online payment (user pays later)</li>
              <li>• Free membership support</li>
              <li>• Welcome email option</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Try the Enhanced Add Member Modal</CardTitle>
          <CardDescription>
            Click the button below to open the comprehensive member creation modal
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <AddMemberModal 
            trigger={
              <Button size="lg" className="px-8">
                <UserPlus className="w-5 h-5 mr-2" />
                Add New Member
              </Button>
            }
            onMemberAdded={handleMemberAdded}
          />
        </CardContent>
      </Card>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Step-by-step workflow for creating new members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold">User Information</h4>
                <p className="text-sm text-muted-foreground">
                  Fill in all required user details including personal information, contact details, 
                  address, and ID proof. The form includes comprehensive validation to ensure data quality.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold">Membership Plan Selection</h4>
                <p className="text-sm text-muted-foreground">
                  Browse available membership plans for the club. View pricing, features, and duration. 
                  Select the most appropriate plan for the new member.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold">Payment & Confirmation</h4>
                <p className="text-sm text-muted-foreground">
                  For paid plans, choose payment handling method. Mark as cash collected or online payment pending. 
                  Complete the process and optionally send a welcome email.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold">Member Created</h4>
                <p className="text-sm text-muted-foreground">
                  The new member is automatically created with the selected membership plan. 
                  They can immediately access club features based on their plan level.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
          <CardDescription>
            What makes this modal special
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">User Experience</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Multi-step wizard interface</li>
                <li>• Progress indicator</li>
                <li>• Form validation with helpful errors</li>
                <li>• Responsive design for all devices</li>
                <li>• Smooth transitions between steps</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Admin Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Bulk member creation</li>
                <li>• Membership plan management</li>
                <li>• Payment status tracking</li>
                <li>• Welcome email automation</li>
                <li>• Club-specific plan filtering</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Data Integrity</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Comprehensive field validation</li>
                <li>• Duplicate prevention</li>
                <li>• Required field enforcement</li>
                <li>• Data format validation</li>
                <li>• Error handling & user feedback</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Integration</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Seamless API integration</li>
                <li>• Real-time membership creation</li>
                <li>• Club context awareness</li>
                <li>• Callback support for updates</li>
                <li>• Toast notifications</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
