import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid, parseISO, differenceInDays } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date utilities
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsedDate)) return 'N/A'
  
  return format(parsedDate, 'MMM d, yyyy')
}

export function formatTime(time: string): string {
  if (!time) return 'N/A'
  
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  
  return `${displayHour}:${minutes} ${ampm}`
}

export function formatDateTime(dateTime: string | Date): string {
  if (!dateTime) return 'N/A'
  
  const parsedDate = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime
  if (!isValid(parsedDate)) return 'N/A'
  
  return format(parsedDate, 'MMM d, yyyy h:mm a')
}

export function getDaysUntilDue(dueDate: string): number {
  if (!dueDate) return 0
  
  const due = parseISO(dueDate)
  const today = new Date()
  
  return differenceInDays(due, today)
}

export function getTestStatus(dueDate: string): 'current' | 'due' | 'overdue' {
  const daysUntil = getDaysUntilDue(dueDate)
  
  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= 30) return 'due'
  return 'current'
}

// Phone number utilities
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  return phone
}

export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10
}

// Email utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Currency utilities
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Address utilities
export function formatAddress(address: string, city: string, zip: string): string {
  return `${address}, ${city} ${zip}`
}

// Device utilities
export function getDeviceDisplayName(type: string, size: string): string {
  return `${type} - ${size}"`
}

// ID generators
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}${timestamp}-${random}`
}

export function generateInvoiceNumber(year: number, sequence: number): string {
  return `${year}-${sequence.toString().padStart(3, '0')}`
}

// Local storage utilities
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error)
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error)
    return defaultValue
  }
}

export function removeFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Failed to remove ${key} from localStorage:`, error)
  }
}

// Array utilities
export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key])
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

// String utilities
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function camelToTitle(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

// Validation utilities
export function required(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return !isNaN(value)
  return value != null
}

export function minLength(value: string, length: number): boolean {
  return value.length >= length
}

export function maxLength(value: string, length: number): boolean {
  return value.length <= length
}

// File utilities
export function downloadAsCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

// Color utilities for status indicators
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Test status
    'PASSED': 'bg-green-100 text-green-800',
    'FAILED': 'bg-red-100 text-red-800',
    'PENDING': 'bg-yellow-100 text-yellow-800',
    
    // Appointment status
    'scheduled': 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-orange-100 text-orange-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-gray-100 text-gray-800',
    
    // Invoice status
    'paid': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'overdue': 'bg-red-100 text-red-800',
    'draft': 'bg-gray-100 text-gray-800',
    
    // Due status
    'current': 'bg-green-100 text-green-800',
    'due': 'bg-yellow-100 text-yellow-800'
  }
  
  return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

// Route optimization utilities
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.756 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Offline detection
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

// Template utilities
export function replaceTemplate(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    return (typeof value === 'string' || typeof value === 'number') ? String(value) : match;
  })
}

// Error handling
export function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'An unknown error occurred'
}

// Export utilities for PDF/printing
export function preparePrintData(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}