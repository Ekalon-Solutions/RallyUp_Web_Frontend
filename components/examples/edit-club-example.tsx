"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EditClubModal } from '@/components/modals/edit-club-modal'
import { Building2 } from 'lucide-react'

// Example usage of EditClubModal
export function EditClubExample() {
  const [clubs, setClubs] = useState([
    {
      _id: '1',
      name: 'Sample Club',
      description: 'A sample club for demonstration',
      contactEmail: 'contact@sampleclub.com',
      contactPhone: '1234567890',
      website: 'https://sampleclub.com',
      status: 'active' as const,
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001'
      },
      superAdmin: {
        _id: 'admin1',
        name: 'John Admin',
        email: 'admin@sampleclub.com',
        phoneNumber: '1234567890',
        countryCode: '+1',
        isPhoneVerified: true,
        role: 'super_admin' as const,
        isActive: true
      },
      createdBy: {
        _id: 'owner1',
        name: 'System Owner',
        email: 'owner@system.com'
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ])

  const handleClubUpdated = () => {
    // Refresh clubs data
    // console.log('Club updated, refreshing data...')
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Edit Club Modal Example</h2>
      
      <div className="space-y-4">
        {clubs.map((club) => (
          <div key={club._id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{club.name}</h3>
                <p className="text-sm text-muted-foreground">{club.description}</p>
                <p className="text-sm text-muted-foreground">{club.contactEmail}</p>
              </div>
              <div className="flex gap-2">
                {/* Method 1: Using trigger prop */}
                <EditClubModal
                  club={club}
                  onClubUpdated={handleClubUpdated}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Building2 className="w-4 h-4 mr-2" />
                      Edit Club
                    </Button>
                  }
                />
                
                {/* Method 2: Using default trigger */}
                <EditClubModal
                  club={club}
                  onClubUpdated={handleClubUpdated}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
