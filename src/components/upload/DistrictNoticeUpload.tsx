'use client'

import { useState, useRef } from 'react'
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  CheckCircle, 
  AlertCircle,
  Camera,
  Paperclip
} from 'lucide-react'

interface UploadProps {
  deviceId?: string
  customerId?: string
  onUploadSuccess?: (data: any) => void
  onUploadError?: (error: string) => void
  className?: string
  showPreview?: boolean
}

export default function DistrictNoticeUpload({ 
  deviceId, 
  customerId, 
  onUploadSuccess, 
  onUploadError,
  className = '',
  showPreview = true 
}: UploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [uploadMessage, setUploadMessage] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      const error = 'Please upload an image (JPG, PNG, WebP) or PDF file.'
      setUploadStatus('error')
      setUploadMessage(error)
      onUploadError?.(error)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      const error = 'File too large. Maximum size is 5MB.'
      setUploadStatus('error')
      setUploadMessage(error)
      onUploadError?.(error)
      return
    }

    // Show preview for images
    if (file.type.startsWith('image/') && showPreview) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }

    // Upload file
    setUploading(true)
    setUploadStatus('idle')
    setUploadMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (deviceId) formData.append('deviceId', deviceId)
      if (customerId) formData.append('customerId', customerId)

      const response = await fetch('/api/upload/district-notice', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUploadStatus('success')
        setUploadMessage(data.message || 'Upload successful!')
        onUploadSuccess?.(data.data)
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploadStatus('error')
      setUploadMessage(errorMessage)
      onUploadError?.(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setUploadStatus('idle')
    setUploadMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
          dragOver 
            ? 'border-cyan-400 bg-cyan-400/10' 
            : uploadStatus === 'success'
            ? 'border-green-400 bg-green-400/10'
            : uploadStatus === 'error'
            ? 'border-red-400 bg-red-400/10'
            : 'border-cyan-400/30 bg-white/5 hover:border-cyan-400/50 hover:bg-white/10'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="text-center">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-3"></div>
              <p className="text-white font-medium">Uploading...</p>
              <p className="text-white/60 text-sm">Please wait while we process your file</p>
            </>
          ) : uploadStatus === 'success' ? (
            <>
              <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <p className="text-green-400 font-medium">Upload Successful!</p>
              <p className="text-white/80 text-sm">{uploadMessage}</p>
            </>
          ) : uploadStatus === 'error' ? (
            <>
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
              <p className="text-red-400 font-medium">Upload Failed</p>
              <p className="text-red-300 text-sm">{uploadMessage}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearPreview()
                }}
                className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
              >
                Try Again
              </button>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
              <p className="text-white font-medium mb-2">Upload Water District Notice</p>
              <p className="text-white/80 text-sm mb-3">
                Drop your file here or click to browse
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-white/60">
                <div className="flex items-center">
                  <Image className="h-4 w-4 mr-1" />
                  <span>Images</span>
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  <span>PDF</span>
                </div>
                <span>Max 5MB</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview */}
      {previewUrl && showPreview && (
        <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-cyan-400/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-medium">Preview</h4>
            <button
              onClick={clearPreview}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4 text-white/60" />
            </button>
          </div>
          <div className="max-w-sm mx-auto">
            <img
              src={previewUrl}
              alt="District notice preview"
              className="w-full h-auto rounded-lg border border-cyan-400/20"
            />
          </div>
        </div>
      )}

      {/* Helper Text */}
      <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Camera className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-cyan-300 font-medium mb-1">Why Upload Your Water District Notice?</h4>
            <p className="text-white/80 text-sm leading-relaxed">
              Uploading your annual backflow test notice helps your testing company:
            </p>
            <ul className="text-white/70 text-sm mt-2 space-y-1">
              <li>• Quickly locate your backflow device</li>
              <li>• Verify device specifications and requirements</li>
              <li>• Ensure compliance with water district regulations</li>
              <li>• Schedule testing more efficiently</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}