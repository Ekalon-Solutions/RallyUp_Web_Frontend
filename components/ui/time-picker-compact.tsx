"use client"

import React, { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Label } from './label'
import { Clock } from 'lucide-react'

interface TimePickerCompactProps {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function TimePickerCompact({ 
  value, 
  onChange, 
  label, 
  required = false, 
  disabled = false,
  className = "" 
}: TimePickerCompactProps) {
  // Generate time options in 15-minute intervals
  const generateTimeOptions = () => {
    const times: string[] = []
    for (let hour = 1; hour <= 12; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const hourStr = hour.toString()
        const minuteStr = minute.toString().padStart(2, '0')
        times.push(`${hourStr}:${minuteStr} AM`)
        times.push(`${hourStr}:${minuteStr} PM`)
      }
    }
    return times
  }

  const timeOptions = generateTimeOptions()

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="flex items-center gap-1 text-sm font-medium">
          <Clock className="w-4 h-4" />
          {label}
        </Label>
      )}
      
      <Select 
        value={value || "12:00 PM"} 
        onValueChange={onChange} 
        disabled={disabled}
        required={required}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select time..." />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {timeOptions.map((time) => (
            <SelectItem key={time} value={time} className="font-mono">
              {time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
