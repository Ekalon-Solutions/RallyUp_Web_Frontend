"use client"

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { getApiUrl } from '@/lib/config'
import { apiClient } from '@/lib/api'
import { triggerBlobDownload } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
  const [results, setResults] = useState<{ success: number; failed: number; errors: Array<{ row: number; error: string }> } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const clubId = (user as any)?.club?._id || (user as any)?.club_id?._id

  useEffect(() => {
    if (open && clubId) fetchPlans()
    if (!open) {
        setFile(null)
        setResults(null)
        setCurrentPage(1)
    }
  }, [open, clubId])

  const fetchPlans = async () => {
    try {
      const res = await apiClient.getMembershipPlans(clubId);
      if (res.error) return
      const data = res.data
      setPlans((data as any)?.data || (data as any) || [])
    } catch (e) {
    }
  }

  const handleFileChange = (f?: File) => {
    setFile(f || null)
    setResults(null)
  }

  const handleDownloadSample = async () => {
    try {
      const csvContent = `email,first_name,last_name,phoneNumber,countryCode,username,date_of_birth,gender,address_line1,city,state_province,zip_code,country,id_proof_type,id_proof_number
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
    
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }
    
    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim())
    
    const rows = lines.slice(1).map(line => {
      const cols = parseCSVLine(line).map(col => col.replace(/^"|"$/g, '').trim())
      const obj: any = {}
      headers.forEach((h, i) => { 
        obj[h] = (cols[i] || '').trim() 
      })
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
    setCurrentPage(1)
    const errors: Array<{ row: number; error: string }> = []
    let successCount = 0
    let failCount = 0

    try {
      const rows = await parseCSV(file)
      for (const [idx, row] of rows.entries()) {
        const convertScientificNotation = (value: string): string => {
          if (!value) return ''
          const trimmed = value.trim()
          if (/^[\d.]+[eE][+-]?\d+$/.test(trimmed)) {
            const num = parseFloat(trimmed)
            if (!isNaN(num)) {
              return Math.round(num).toString()
            }
          }
          return trimmed
        }

        const email = (row.email || '').trim()
        const first_name = (row.first_name || row.firstName || '').trim()
        const last_name = (row.last_name || row.lastName || '').trim()
        let phoneNumber = (row.phoneNumber || row.phone || row.phone_nu || '').trim()
        phoneNumber = convertScientificNotation(phoneNumber)
        phoneNumber = phoneNumber.replace(/[^\d]/g, '')
        
        const countryCode = (row.countryCode || row.country_code || row.countryCo || '+91').trim()
        const normalizedCountryCode = countryCode.startsWith('+') ? countryCode : `+${countryCode}`
        const username = (row.username || email?.split('@')?.[0] || `user${Date.now()}${idx}`).trim()
        
        if (!email) {
          failCount++
          errors.push({ row: idx + 2, error: 'email is required' })
          continue
        }
        if (!first_name) {
          failCount++
          errors.push({ row: idx + 2, error: 'first_name is required' })
          continue
        }
        if (!last_name) {
          failCount++
          errors.push({ row: idx + 2, error: 'last_name is required' })
          continue
        }
        if (!phoneNumber) {
          failCount++
          errors.push({ row: idx + 2, error: 'phoneNumber is required' })
          continue
        }

        const normalizeGender = (gender: string): string => {
          const normalized = gender.toLowerCase().trim()
          if (normalized === 'male' || normalized === 'm') return 'male'
          if (normalized === 'female' || normalized === 'f') return 'female'
          if (normalized === 'non-binary' || normalized === 'nonbinary' || normalized === 'nb') return 'non-binary'
          return 'male'
        }

        const normalizeIdProofType = (idProofType: string): string => {
          const normalized = idProofType.trim()
          if (/^aadha?r$/i.test(normalized)) return 'Aadhar'
          if (/^voter\s*(id)?$/i.test(normalized) || normalized.toLowerCase() === 'voterid') return 'Voter ID'
          if (/^passport$/i.test(normalized)) return 'Passport'
          if (/^driver['\s]?s?\s*(license|licence)$/i.test(normalized) || normalized.toLowerCase() === 'driving license' || normalized.toLowerCase() === 'drivers license') return 'Driver License'
          return 'Aadhar'
        }

        const rawGender = (row.gender || 'male').trim()
        const rawIdProofType = (row.id_proof_type || 'Aadhar').trim()

        let zip_code = (row.zip_code || row.zip || row.zipCode || '').trim()
        if (/^[a-zA-Z\s]+$/.test(zip_code) && zip_code.length > 5) {
          zip_code = '000000'
        }
        if (zip_code.length > 10) {
          zip_code = zip_code.substring(0, 10)
        }

        let date_of_birth = (row.date_of_birth || row.date_of_bi || '1990-01-01').trim()
        if (/^\d+$/.test(date_of_birth)) {
          const numValue = parseInt(date_of_birth, 10)
          if (numValue > 0 && numValue < 100000) {
            const excelEpoch = new Date(1899, 11, 30)
            const date = new Date(excelEpoch.getTime() + numValue * 86400000)
            date_of_birth = date.toISOString().split('T')[0]
          }
        }

        const payload: any = {
          username,
          email,
          first_name,
          last_name,
          phoneNumber,
          countryCode: normalizedCountryCode,
          date_of_birth,
          gender: normalizeGender(rawGender),
          address_line1: (row.address_line1 || row.address_li || 'Not provided').trim(),
          address_line2: (row.address_line2 || '').trim(),
          city: (row.city || 'Not provided').trim(),
          state_province: (row.state_province || row.state_prov || row.state || 'Not provided').trim(),
          zip_code,
          country: (row.country || 'India').trim(),
          id_proof_type: normalizeIdProofType(rawIdProofType),
          id_proof_number: (row.id_proof_number || row.id_proof_r || `TEMP${Date.now()}${idx}`).trim()
        }

        try {
          if (!phoneNumber || phoneNumber.length < 9 || phoneNumber.length > 15) {
            failCount++
            errors.push({ row: idx + 2, error: `Invalid phone number (${phoneNumber || 'empty'})` })
            continue
          }

          if (zip_code.length > 10) {
            failCount++
            errors.push({ row: idx + 2, error: `Zip code too long (${zip_code.length} characters)` })
            continue
          }

          if (/^[a-zA-Z\s]+$/.test(zip_code) && zip_code.length > 5) {
            failCount++
            errors.push({ row: idx + 2, error: `Zip code appears to be a state/city name: "${zip_code}"` })
            continue
          }

          let existingUser = null
          let userId = null

          try {
            const findUserResp = await apiClient.findUserByEmailOrPhone({
              email: email,
              phoneNumber: phoneNumber,
              countryCode: normalizedCountryCode
            })

            if (findUserResp.success && findUserResp.data?.user) {
              existingUser = findUserResp.data.user
              // If the user exists but is marked deleted, attempt to re-register (reactivate) them
              if ((existingUser as any).is_deleted) {
                try {
                  const reactResp = await apiClient.userRegister({ ...payload, clubId } as any)
                  if (reactResp.success) {
                    const created = (reactResp.data && (reactResp.data.user || reactResp.data)) || null
                    userId = (created as any)?._id || (reactResp.data as any)?._id
                  } else {
                    // registration failed for deleted user
                    userId = null
                  }
                } catch (e) {
                  userId = null
                }
              } else {
                userId = existingUser._id
              }
            }
          } catch (err) {
          }

          if (!userId) {
            const regResp = await apiClient.userRegister({ ...payload, clubId } as any)
            if (!regResp.success) {
              failCount++
              const errorDetails = (regResp as any).errorDetails || {}
              const errorMsg = regResp.error || regResp.message || 'Unknown registration error'
              const statusCode = errorDetails.statusCode || (regResp as any).statusCode || 'Unknown'
              const validationErrors = errorDetails.errors || errorDetails.validationErrors || []
              const validationMsg = validationErrors.length > 0 ? ` Validation errors: ${validationErrors.join(', ')}.` : ''
              const cleanError = errorMsg.startsWith('registration failed - ') ? errorMsg.replace('registration failed - ', '') : errorMsg
              errors.push({ row: idx + 2, error: `User registration failed for ${email}: ${cleanError}. Status: ${statusCode}.${validationMsg} ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''}` })
              continue
            }

            const createdUser = (regResp.data && (regResp.data.user || regResp.data)) || null
            userId = (createdUser as any)?._id || (regResp.data as any)?._id

            if (!userId) {
              failCount++
              errors.push({ row: idx + 2, error: `User registration succeeded for ${email} but user ID is missing from server response. Please contact support with this error.` })
              continue
            }
          }

          const plan = plans.find(p => p._id === selectedPlanId)
          if (!plan) {
            failCount++
            errors.push({ row: idx + 2, error: `Selected membership plan (ID: ${selectedPlanId}) not found. The plan may have been deleted. Please select a different plan and try again.` })
            continue
          }

          const startDate = new Date()
          let endDate: Date | null = null
          if (plan && plan.duration && plan.duration > 0) {
            endDate = new Date(startDate)
            endDate.setMonth(endDate.getMonth() + plan.duration)
          }

          const membershipData: any = {
            user_id: userId,
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
            const errorMessage = err.message || memResp.statusText || 'Unknown error'
            const statusCode = memResp.status || 'Unknown'
            const errorDetails = err.errorDetails || err.details || {}
            const validationErrors = errorDetails.errors || errorDetails.validationErrors || []
            const validationMsg = validationErrors.length > 0 ? ` Validation errors: ${validationErrors.join(', ')}.` : ''
            
            if (errorMessage.includes('already has an active membership')) {
              successCount++
            } else {
              failCount++
              errors.push({ row: idx + 2, error: `Membership creation failed for user ${email} (Plan: "${plan.name}"): ${errorMessage}. Status: ${statusCode}.${validationMsg} ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please check the membership plan and user details.` })
            }
            continue
          }
          
          successCount++
        } catch (err: any) {
          failCount++
          const errorMessage = err?.message || 'Unknown error occurred'
          const errorDetails = err?.response?.data || err?.data || {}
          const statusCode = err?.response?.status || err?.status || 'Unknown'
          const validationErrors = errorDetails.errors || []
          const validationMsg = validationErrors.length > 0 ? ` Validation errors: ${validationErrors.join(', ')}.` : ''
          errors.push({ row: idx + 2, error: `Error processing row ${idx + 2} for ${email || 'unknown email'}: ${errorMessage}. Status: ${statusCode}.${validationMsg} ${errorDetails.message ? `Details: ${errorDetails.message}.` : ''} Please check the row data and try again.` })
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
                Required CSV headers: email, first_name, last_name, phoneNumber, countryCode<br/>
                Optional: username, date_of_birth, gender, address_line1, city, state_province, zip_code, country, id_proof_type, id_proof_number
              </p>
            </div>

          {results && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Import Results</div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="text-green-600 font-semibold">Imported: {results.success}</span>
                    <span className="text-red-600 font-semibold">Failed: {results.failed}</span>
                  </div>
                </div>
              </div>
              
              {results.errors.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Row #</TableHead>
                          <TableHead>Error Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.errors
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map((error, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{error.row}</TableCell>
                              <TableCell className="text-red-600">{error.error}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {results.errors.length > itemsPerPage && (
                    <div className="flex items-center justify-between p-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, results.errors.length)} of {results.errors.length} errors
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="text-sm">
                          Page {currentPage} of {Math.ceil(results.errors.length / itemsPerPage)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(Math.ceil(results.errors.length / itemsPerPage), prev + 1))}
                          disabled={currentPage >= Math.ceil(results.errors.length / itemsPerPage)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
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
