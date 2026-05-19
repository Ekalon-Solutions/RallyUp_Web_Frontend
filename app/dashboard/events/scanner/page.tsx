"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ProtectedRoute } from '@/components/protected-route'
import { DashboardLayout } from '@/components/dashboard-layout'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScanLine, Camera, CameraOff, Loader2, AlertCircle } from 'lucide-react'

declare global {
  interface Window {
    BarcodeDetector?: any
  }
}

function parseQrUrl(raw: string): { registrationId: string; attendeeId: string } | null {
  try {
    // Handle both full URLs and raw param strings
    const url = raw.startsWith('http') ? new URL(raw) : new URL(`https://x.invalid/?${raw}`)
    const registrationId = url.searchParams.get('registrationId')
    const attendeeId = url.searchParams.get('attendeeId')
    if (registrationId && attendeeId) return { registrationId, attendeeId }
  } catch {
    // not a URL — ignore
  }
  return null
}

type ScannerState = 'idle' | 'starting' | 'scanning' | 'error' | 'unsupported'

export default function ScannerPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<any>(null)
  const rafRef = useRef<number | null>(null)
  const lastScanRef = useRef<string>('')

  const [scannerState, setScannerState] = useState<ScannerState>('idle')
  const [cameraError, setCameraError] = useState<string>('')
  const [manualInput, setManualInput] = useState<string>('')
  const [isBarcodeApiSupported, setIsBarcodeApiSupported] = useState<boolean | null>(null)

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'BarcodeDetector' in window
    setIsBarcodeApiSupported(supported)
    if (!supported) setScannerState('unsupported')
  }, [])

  const navigateToAttendance = useCallback((registrationId: string, attendeeId: string) => {
    router.push(
      `/dashboard/events/attendance?registrationId=${encodeURIComponent(registrationId)}&attendeeId=${encodeURIComponent(attendeeId)}`
    )
  }, [router])

  const stopScanner = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const startScanner = useCallback(async () => {
    setScannerState('starting')
    setCameraError('')
    lastScanRef.current = ''

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      detectorRef.current = new window.BarcodeDetector!({ formats: ['qr_code'] })
      setScannerState('scanning')

      const tick = async () => {
        if (!videoRef.current || !detectorRef.current) return
        try {
          const barcodes = await detectorRef.current.detect(videoRef.current)
          for (const barcode of barcodes) {
            const raw: string = barcode.rawValue
            if (raw === lastScanRef.current) continue // debounce same code
            lastScanRef.current = raw
            const parsed = parseQrUrl(raw)
            if (parsed) {
              stopScanner()
              navigateToAttendance(parsed.registrationId, parsed.attendeeId)
              return
            } else {
              toast.error('QR code not recognised — make sure you scan a RallyUp event ticket')
            }
          }
        } catch {
          // detect() can throw on frames before video is ready — ignore
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch (err: any) {
      const msg =
        err?.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera permissions and try again.'
          : err?.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : err?.message || 'Failed to start camera.'
      setCameraError(msg)
      setScannerState('error')
    }
  }, [navigateToAttendance, stopScanner])

  useEffect(() => {
    return () => stopScanner()
  }, [stopScanner])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = manualInput.trim()
    if (!val) return
    const parsed = parseQrUrl(val)
    if (parsed) {
      navigateToAttendance(parsed.registrationId, parsed.attendeeId)
    } else {
      toast.error('Could not parse the QR value — paste the full ticket URL')
    }
  }

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <div className="p-6 max-w-lg mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ScanLine className="w-6 h-6" />
              QR Scanner
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Scan an attendee&apos;s event QR code to confirm their ticket before marking attendance.
            </p>
          </div>

          {isBarcodeApiSupported === false && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-yellow-800 text-base flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Camera scanning not supported
                </CardTitle>
                <CardDescription className="text-yellow-700">
                  Your browser does not support the BarcodeDetector API (Safari / Firefox). Use a hardware QR
                  scanner or paste the ticket URL below.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {isBarcodeApiSupported && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Camera Scanner</CardTitle>
                <CardDescription>Point the camera at the attendee&apos;s QR code.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Video viewport */}
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    aria-label="Camera feed"
                  />
                  {/* Viewfinder overlay */}
                  {scannerState === 'scanning' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-white/70 rounded-lg relative">
                        <span className="absolute -top-px -left-px w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-md" />
                        <span className="absolute -top-px -right-px w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-md" />
                        <span className="absolute -bottom-px -left-px w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-md" />
                        <span className="absolute -bottom-px -right-px w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-md" />
                        {/* Scanning line animation */}
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-green-400/80 animate-scan-line" />
                      </div>
                    </div>
                  )}
                  {scannerState !== 'scanning' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 gap-2">
                      <CameraOff className="w-12 h-12" />
                      <p className="text-sm">Camera not active</p>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {cameraError}
                  </p>
                )}

                {scannerState === 'idle' || scannerState === 'error' ? (
                  <Button className="w-full" onClick={startScanner}>
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                ) : scannerState === 'starting' ? (
                  <Button className="w-full" disabled>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting…
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { stopScanner(); setScannerState('idle') }}
                  >
                    <CameraOff className="w-4 h-4 mr-2" />
                    Stop Camera
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Manual / hardware scanner fallback */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Manual Entry</CardTitle>
              <CardDescription>
                Paste the full ticket URL from a hardware scanner or share link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="qr-input" className="sr-only">Ticket URL</Label>
                  <Input
                    id="qr-input"
                    placeholder="Paste ticket URL here…"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <Button type="submit">Go</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
