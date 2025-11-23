"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Loader2 } from 'lucide-react'

export default function ChallengePage() {
  const router = useRouter()
  const [verifying, setVerifying] = useState(true)
  const [challenge, setChallenge] = useState<string>('')

  useEffect(() => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    setChallenge(`${num1} + ${num2}`)
    
    sessionStorage.setItem('challenge_answer', String(num1 + num2))
    
    setTimeout(() => {
      setVerifying(false)
    }, 2000)
  }, [])

  const handleVerify = () => {
    sessionStorage.setItem('verified', 'true')
    document.cookie = 'verified=true; path=/; max-age=3600; SameSite=Strict'
    
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Security Verification</CardTitle>
          <CardDescription>
            We need to verify you're a human to protect our platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {verifying ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-sm text-muted-foreground">
                Verifying your browser...
              </p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Please solve this simple math problem:
                </p>
                <p className="text-3xl font-bold text-blue-900">{challenge} = ?</p>
              </div>
              
              <Button 
                onClick={handleVerify}
                className="w-full"
                size="lg"
              >
                I'm a Human - Continue
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                This helps us prevent automated scraping and protect our resources
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
