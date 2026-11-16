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
  const [challengeToken, setChallengeToken] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/challenge', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Challenge is unavailable')
        return response.json()
      })
      .then((data) => {
        setChallenge(data.challenge)
        setChallengeToken(data.token)
      })
      .catch(() => setError('Unable to load the security challenge. Please refresh.'))
      .finally(() => setVerifying(false))
  }, [])

  const handleVerify = async () => {
    setVerifying(true)
    setError('')
    try {
      const response = await fetch('/api/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: challengeToken, answer: Number(answer) }),
      })
      if (!response.ok) throw new Error('Incorrect or expired answer')
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 public-theme">
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
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label="Challenge answer"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  className="mt-4 h-11 w-full rounded-md border border-blue-300 bg-white px-3 text-center text-lg"
                />
              </div>
              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              
              <Button 
                onClick={handleVerify}
                disabled={!challengeToken || answer === ''}
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
