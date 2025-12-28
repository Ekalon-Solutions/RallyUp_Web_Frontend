"use client"

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { getApiUrl } from '@/lib/config'
import { apiClient } from '@/lib/api'
import { triggerBlobDownload } from '@/lib/utils'

interface ImportMembersModalProps {
  trigger?: React.ReactNode
  onImported?: () => void
}

export function ImportMembersModal({ trigger, onImported }: ImportMembersModalProps) {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

  const clubId = (user as any)?.club?._id || (user as any)?.club_id?._id

  useEffect(() => {
    if (open && clubId) fetchPlans()
    if (!open) {
        setFile(null)
        setResults(null)
    }
  }, [open, clubId])

  const fetchPlans = async () => {
    try {
      const res = await apiClient.getMembershipPlans(clubId);
      if (res.error) return
      const data = res.data
      setPlans(data?.data || [])
    } catch (e) {
      // ignore
    }
  }

  const handleFileChange = (f?: File) => {
    setFile(f || null)
    setResults(null)
  }

  const handleDownloadSample = async () => {
    try {
      const csvContent = `email,first_name,last_name,phone_number,countryCode,username,date_of_birth,gender,address_line1,city,state_province,zip_code,country,id_proof_type,id_proof_number
alice.smith@example.com,Alice,Smith,9876543210,+91,alice_smith,1990-05-12,female,12 Lotus Street,Mumbai,Maharashtra,400001,India,Aadhar,1234-5678-9012
bob.johnson@example.com,Bob,Johnson,9123456780,+91,bob_johnson,1985-11-03,male,45 River Road,Delhi,Delhi,110001,India,Passport,P1234567
charlie.brown@example.com,Charlie,Brown,9234567890,+91,charlie_brown,1992-08-20,male,78 Park Avenue,Bangalore,Karnataka,560001,India,Aadhar,9876-5432-1098`

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      triggerBlobDownload(blob, 'sample-members.csv')
      toast.success('Sample CSV downloaded successfully')
    } catch (error) {
      toast.error('Failed to download sample CSV')
    }
  }

  const parseCSV = async (f: File) => {
    const text = await f.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (lines.length === 0) return []
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1).map(line => {
      const cols = line.split(',')
      const obj: any = {}
      headers.forEach((h, i) => { obj[h] = (cols[i] || '').trim() })
      return obj
    })
    return rows
  }

  const handleImport = async () => {
    if (!file) return toast.error('Please select a CSV file')
    if (!plans || plans.length === 0) return toast.error('No membership plans found for this club')
    if (!selectedPlanId) return toast.error('Please select a membership plan to assign')

    setProcessing(true)
    setResults(null)
    const errors: string[] = []
    let successCount = 0
    let failCount = 0

    try {
      const rows = await parseCSV(file)
      for (const [idx, row] of rows.entries()) {
        const email = (row.email || '').trim()
        const first_name = (row.first_name || row.firstName || '').trim()
        const last_name = (row.last_name || row.lastName || '').trim()
        const phone_number = (row.phone_number || row.phone || '').trim()
        const countryCode = (row.countryCode || row.country_code || '+91').trim()
        const username = (row.username || email?.split('@')?.[0] || `user${Date.now()}${idx}`).trim()
        
        if (!email) {
          failCount++
          errors.push(`Row ${idx + 2}: email is required`)
          continue
        }
        if (!first_name) {
          failCount++
          errors.push(`Row ${idx + 2}: first_name is required`)
          continue
        }
        if (!last_name) {
          failCount++
          errors.push(`Row ${idx + 2}: last_name is required`)
          continue
        }
        if (!phone_number) {
          failCount++
          errors.push(`Row ${idx + 2}: phone_number is required`)
          continue
        }

        // Normalize gender to lowercase
        const normalizeGender = (gender: string): string => {
          const normalized = gender.toLowerCase().trim()
          // Handle variations
          if (normalized === 'male' || normalized === 'm') return 'male'
          if (normalized === 'female' || normalized === 'f') return 'female'
          if (normalized === 'non-binary' || normalized === 'nonbinary' || normalized === 'nb') return 'non-binary'
          // Default to male if invalid
          return 'male'
        }

        // Normalize ID proof type to match enum values
        const normalizeIdProofType = (idProofType: string): string => {
          const normalized = idProofType.trim()
          // Handle Aadhar variations
          if (/^aadha?r$/i.test(normalized)) return 'Aadhar'
          // Handle Voter ID variations
          if (/^voter\s*(id)?$/i.test(normalized) || normalized.toLowerCase() === 'voterid') return 'Voter ID'
          // Handle Passport
          if (/^passport$/i.test(normalized)) return 'Passport'
          // Handle Driver License variations
          if (/^driver['\s]?s?\s*(license|licence)$/i.test(normalized) || normalized.toLowerCase() === 'driving license' || normalized.toLowerCase() === 'drivers license') return 'Driver License'
          // Default to Aadhar if invalid
          return 'Aadhar'
        }

        const rawGender = (row.gender || 'male').trim()
        const rawIdProofType = (row.id_proof_type || 'Aadhar').trim()

        const payload: any = {
          username,
          email,
          first_name,
          last_name,
          phone_number,
          countryCode,
          date_of_birth: (row.date_of_birth || '1990-01-01').trim(),
          gender: normalizeGender(rawGender),
          address_line1: (row.address_line1 || 'Not provided').trim(),
          address_line2: (row.address_line2 || '').trim(),
          city: (row.city || 'Not provided').trim(),
          state_province: (row.state_province || row.state || 'Not provided').trim(),
          zip_code: (row.zip_code || row.zip || '000000').trim(),
          country: (row.country || 'India').trim(),
          id_proof_type: normalizeIdProofType(rawIdProofType),
          id_proof_number: (row.id_proof_number || `TEMP${Date.now()}${idx}`).trim()
        }

        try {
          const regResp = await apiClient.userRegister({ ...payload, clubId } as any)
          if (!regResp.success) {
            failCount++
            errors.push(`Row ${idx + 2}: registration failed - ${regResp.error || regResp.message || 'unknown'}`)
            continue
          }

          const createdUser = (regResp.data && (regResp.data.user || regResp.data)) || null
          const newUserId = createdUser?._id || regResp.data?._id

          if (!newUserId) {
            failCount++
            errors.push(`Row ${idx + 2}: registration succeeded but user id missing`) 
            continue
          }

          const plan = plans.find(p => p._id === selectedPlanId)
          const startDate = new Date()
          let endDate: Date | null = null
          if (plan && plan.duration && plan.duration > 0) {
            endDate = new Date(startDate)
            endDate.setMonth(endDate.getMonth() + plan.duration)
          }

          const membershipData: any = {
            user_id: newUserId,
            membership_level_id: selectedPlanId,
            level_name: plan?.name || '',
            club_id: clubId,
            start_date: startDate,
            duration_days: plan.duration > 0 ? plan.duration * 30 : undefined,
          }
          if (endDate) membershipData.end_date = endDate

          const memResp = await fetch(getApiUrl('/user-memberships'), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(membershipData)
          })

          if (!memResp.ok) {
            const err = await memResp.json().catch(() => ({}))
            failCount++
            errors.push(`Row ${idx + 2}: membership creation failed - ${err.message || memResp.statusText}`)
            continue
          }

          successCount++
        } catch (err: any) {
          failCount++
          errors.push(`Row ${idx + 2}: ${err.message || 'error'}`)
        }
      }

      setResults({ success: successCount, failed: failCount, errors })
      if (successCount > 0) {
        toast.success(`${successCount} members imported successfully`)
        onImported?.()
      }
      if (failCount > 0) {
        toast.error(`${failCount} rows failed. See details.`)
      }
    } catch (err) {
      toast.error('Failed to process file')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Import Members in Bulk</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Members in Bulk</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple members at once. All members will be assigned to the selected membership plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Membership Plan</Label>
            {plans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No membership plans found for this club. Please create one before importing.</p>
            ) : (
              <Select onValueChange={(v) => setSelectedPlanId(v)} value={selectedPlanId || undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => <SelectItem key={p._id} value={p._id}>{p.name} — {p.price} {p.currency}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

            <div>
              <Label>CSV File</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : undefined)}
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSample}
                  className="text-sm"
                >
                  Download example CSV
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Required CSV headers: email, first_name, last_name, phone_number, countryCode<br/>
                Optional: username, date_of_birth, gender, address_line1, city, state_province, zip_code, country, id_proof_type, id_proof_number
              </p>
            </div>

          {results && (
            <div className="p-3 border rounded">
              <div>Imported: {results.success}</div>
              <div>Failed: {results.failed}</div>
              {results.errors.length > 0 && (
                <div className="mt-2 text-sm text-red-600">
                  {results.errors.slice(0,10).map((e, i) => <div key={i}>{e}</div>)}
                  {results.errors.length > 10 && <div>...and more</div>}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={processing || plans.length === 0}>
              {processing ? 'Processing...' : 'Import'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImportMembersModal
