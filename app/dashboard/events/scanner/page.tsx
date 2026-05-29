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
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'

function parseQrUrl(raw: string): { registrationId: string; attendeeId: string } | null {
  try {
    const url = raw.startsWith('http') ? new URL(raw) : new URL(`https://x.invalid/?${raw}`)
    const registrationId = url.searchParams.get('registrationId')
    const attendeeId = url.searchParams.get('attendeeId')
    if (registrationId && attendeeId) return { registrationId, attendeeId }
  } catch {
  }
  return null
}

function pickPreferredCameraId(devices: MediaDeviceInfo[]): string | undefined {
  const backCamera = devices.find((device) =>
    /back|rear|environment/i.test(device.label)
  )
  return backCamera?.deviceId || devices[0]?.deviceId
}

type ScannerState = 'idle' | 'starting' | 'scanning' | 'error'

export default function ScannerPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserQRCodeReader | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const lastScanRef = useRef<string>('')

  const [scannerState, setScannerState] = useState<ScannerState>('idle')
  const [cameraError, setCameraError] = useState<string>('')
  const [manualInput, setManualInput] = useState<string>('')

  const navigateToAttendance = useCallback((registrationId: string, attendeeId: string) => {
    router.push(
      `/dashboard/events/attendance?registrationId=${encodeURIComponent(registrationId)}&attendeeId=${encodeURIComponent(attendeeId)}`
    )
  }, [router])

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
    readerRef.current = null
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream | null
      stream?.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }, [])

  const handleScanResult = useCallback((raw: string) => {
    if (!raw || raw === lastScanRef.current) return
    lastScanRef.current = raw
    const parsed = parseQrUrl(raw)
    if (parsed) {
      stopScanner()
      navigateToAttendance(parsed.registrationId, parsed.attendeeId)
    } else {
      toast.error('QR code not recognised — make sure you scan a RallyUp event ticket')
    }
  }, [navigateToAttendance, stopScanner])

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return

    setScannerState('starting')
    setCameraError('')
    lastScanRef.current = ''

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported in this browser.')
      }

      const reader = new BrowserQRCodeReader()
      readerRef.current = reader

      const devices = await BrowserQRCodeReader.listVideoInputDevices()
      if (devices.length === 0) {
        const notFound = new DOMException('No camera found on this device.', 'NotFoundError')
        throw notFound
      }

      const deviceId = pickPreferredCameraId(devices)
      const controls = await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result) => {
          if (result) {
            handleScanResult(result.getText())
          }
        }
      )

      controlsRef.current = controls
      setScannerState('scanning')
    } catch (err: unknown) {
      stopScanner()
      const error = err as { name?: string; message?: string }
      const msg =
        error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError'
          ? 'Camera access denied. Please allow camera permissions for this site and try again.'
          : error?.name === 'NotFoundError'
            ? 'No camera found on this device.'
            : error?.name === 'NotReadableError'
              ? 'Camera is already in use by another application.'
              : error?.name === 'OverconstrainedError'
                ? 'Could not use the selected camera. Try another device or browser.'
                : error?.message || 'Failed to start camera.'
      setCameraError(msg)
      setScannerState('error')
    }
  }, [handleScanResult, stopScanner])

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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Camera Scanner</CardTitle>
              <CardDescription>Point the camera at the attendee&apos;s QR code.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                  aria-label="Camera feed"
                />
                {scannerState === 'scanning' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white/70 rounded-lg relative">
                      <span className="absolute -top-px -left-px w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-md" />
                      <span className="absolute -top-px -right-px w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-md" />
                      <span className="absolute -bottom-px -left-px w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-md" />
                      <span className="absolute -bottom-px -right-px w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-md" />
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
                  onClick={() => {
                    stopScanner()
                    setScannerState('idle')
                  }}
                >
                  <CameraOff className="w-4 h-4 mr-2" />
                  Stop Camera
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Manual Entry</CardTitle>
              <CardDescription>
                Paste the ticket URL if the camera is unavailable or you use a hardware scanner.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="manual-qr">Ticket URL or QR payload</Label>
                  <Input
                    id="manual-qr"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="https://…?registrationId=…&attendeeId=…"
                  />
                </div>
                <Button type="submit" variant="secondary" className="w-full">
                  Open Attendance
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
