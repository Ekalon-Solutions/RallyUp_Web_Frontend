'use client'

import { AlertCircle, Lock, Shield, ShieldAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface AccessDeniedPageProps {
  reason?: 'role' | 'feature' | 'financial' | 'systemOwner' | 'superAdmin'
  message?: string
}

/**
 * Access Denied Component for Report Pages
 * 
 * Displays a consistent access denied UI across all report pages when
 * authorization fails. Shows contextual icons based on the denial reason.
 * 
 * @param reason - Type of authorization failure (determines icon)
 * @param message - Custom denial message (falls back to default)
 * 
 * @example
 * ```tsx
 * const auth = useReportAuthorization('total-order-summary')
 * if (!auth.authorized) {
 *   return <AccessDeniedPage reason={auth.reason} message={auth.message} />
 * }
 * ```
 */
export function AccessDeniedPage({ reason, message }: AccessDeniedPageProps) {
  const router = useRouter()

  // Map denial reasons to appropriate icons
  const iconMap = {
    role: AlertCircle,
    feature: Lock,
    financial: Shield,
    systemOwner: ShieldAlert,
    superAdmin: ShieldAlert,
  }

  const Icon = reason ? iconMap[reason] : AlertCircle

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <Icon className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">
            {message || 'You do not have permission to view this report.'}
          </p>
          <Button 
            onClick={() => router.push('/dashboard/reports')} 
            variant="outline"
          >
            Return to Reports Hub
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
