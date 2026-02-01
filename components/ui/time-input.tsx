"use client"

import React, { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Input } from './input'
import { Label } from './label'
import { Clock } from 'lucide-react'

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function TimeInput({ 
  value, 
  onChange, 
  label, 
  required = false, 
  disabled = false,
  className = "" 
}: TimeInputProps) {
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM')

  useEffect(() => {
    if (value) {
      const timeRegex = /^(\d{1,2}):(\d{2})\s?(AM|PM|am|pm)$/
      const match = value.match(timeRegex)
      if (match) {
        setHours(match[1])
        setMinutes(match[2])
        setPeriod(match[3].toUpperCase() as 'AM' | 'PM')
      }
    } else {
      setHours('12')
      setMinutes('00')
      setPeriod('PM')
    }
  }, [value])

  useEffect(() => {
    if (hours && minutes) {
      const formattedTime = `${hours}:${minutes.padStart(2, '0')} ${period}`
      onChange(formattedTime)
    }
  }, [hours, minutes, period, onChange])

  const handleHourChange = (newHour: string) => {
    if (newHour === '') {
      setHours('')
      return
    }
    const hourNum = parseInt(newHour)
    if (hourNum >= 1 && hourNum <= 12) {
      setHours(newHour)
    }
  }

  const handleMinuteChange = (newMinute: string) => {
    if (newMinute === '') {
      setMinutes('')
      return
    }
    const minuteNum = parseInt(newMinute)
    if (minuteNum >= 0 && minuteNum <= 59) {
      setMinutes(newMinute.padStart(2, '0'))
    }
  }

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod as 'AM' | 'PM')
  }

  const commonTimes = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
    '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
  ]

  const handleQuickTimeSelect = (time: string) => {
    onChange(time)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="flex items-center gap-1 text-sm font-medium">
          <Clock className="w-4 h-4" />
          {label}
        </Label>
      )}
      
      <div className="flex items-center gap-2 p-3 border rounded-lg bg-background">
        <div className="flex items-center gap-1 flex-1">
          <Input
            type="number"
            placeholder="12"
            value={hours}
            onChange={(e) => handleHourChange(e.target.value)}
            min="1"
            max="12"
            required={required}
            disabled={disabled}
            className="text-center text-lg font-mono border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary h-8 w-12"
          />
          <span className="text-lg font-mono text-muted-foreground">:</span>
          <Input
            type="number"
            placeholder="00"
            value={minutes}
            onChange={(e) => handleMinuteChange(e.target.value)}
            min="0"
            max="59"
            required={required}
            disabled={disabled}
            className="text-center text-lg font-mono border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary h-8 w-12"
          />
        </div>
        
        <div className="w-20">
          <Select value={period} onValueChange={handlePeriodChange} disabled={disabled}>
            <SelectTrigger className="h-8 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM" className="font-medium">AM</SelectItem>
              <SelectItem value="PM" className="font-medium">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Quick Select:</Label>
        <div className="flex flex-wrap gap-1">
          {commonTimes.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => handleQuickTimeSelect(time)}
              disabled={disabled}
              className={`px-2 py-1 text-xs rounded-md border transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                value === time 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background hover:bg-muted border-border'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
