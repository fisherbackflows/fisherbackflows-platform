'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';

interface FileUploadProps {
  category: 'document' | 'image' | 'certificate' | 'report' | 'signature' | 'photo';
  appointmentId?: string;
  customerId?: string;
  isPublic?: boolean;
  expiresInDays?: number;
  maxFiles?: number;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  category: string;
}

interface UploadProgress {
  fileId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export default function FileUpload({
  category,
  appointmentId,
  customerId,
  isPublic = false,
  expiresInDays,
  maxFiles = 5,
  onUploadComplete,
  onUploadError,
  className = '',
  disabled = false
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptedFileTypes = useCallback(() => {
    const typeMap = {
      'image': '.jpg,.jpeg,.png,.webp,.gif',
      'photo': '.jpg,.jpeg,.png,.webp',
      'document': '.pdf,.doc,.docx',
      'certificate': '.pdf,.jpg,.jpeg,.png',
      'report': '.pdf',
      'signature': '.png,.svg'
    };
    return typeMap[category];
  }, [category]);

  const getMaxFileSize = useCallback(() => {
    const sizeMap = {
      'image': 10 * 1024 * 1024,     // 10MB
      'photo': 10 * 1024 * 1024,     // 10MB
      'document': 50 * 1024 * 1024,  // 50MB
      'certificate': 25 * 1024 * 1024, // 25MB
      'report': 50 * 1024 * 1024,    // 50MB
      'signature': 2 * 1024 * 1024   // 2MB
    };
    return sizeMap[category];
  }, [category]);

  const validateFile = useCallback((file: File): string | null => {
    // Size validation
    const maxSize = getMaxFileSize();
    if (file.size > maxSize) {
      return `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`;
    }

    // Type validation
    const acceptedTypes = getAcceptedFileTypes().split(',');
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type not allowed. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    // Filename validation
    if (file.name.length > 255) {
      return 'Filename too long';
    }

    if (!/^[a-zA-Z0-9._\-\s]+$/.test(file.name)) {
      return 'Invalid filename. Only letters, numbers, spaces, dots, hyphens, and underscores are allowed';
    }

    return null;
  }, [getMaxFileSize, getAcceptedFileTypes]);

  const uploadFile = useCallback(async (file: File): Promise<void> => {
    const fileId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize progress tracking
    setUploadProgress(prev => new Map(prev.set(fileId, {
      fileId,
      progress: 0,
      status: 'uploading'
    })));

    try {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadOptions = {
        category,
        appointmentId,
        customerId,
        isPublic,
        expiresInDays,
        metadata: {
          originalSize: file.size,
          uploadedAt: new Date().toISOString()
        }
      };
      
      formData.append('options', JSON.stringify(uploadOptions));

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 90); // Reserve 10% for processing
          setUploadProgress(prev => new Map(prev.set(fileId, {
            fileId,
            progress,
            status: 'uploading'
          })));
        }
      });

      // Upload promise
      const uploadPromise = new Promise<UploadedFile>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                // Show security warnings if any
                if (response.securityWarnings && response.securityWarnings.length > 0) {
                  response.securityWarnings.forEach((warning: string) => {
                    toast.warning(`Security notice: ${warning}`);
                  });
                }
                resolve(response.file);
              } else {
                reject(new Error(response.error || 'Upload failed'));
              }
            } catch (error) {
              reject(new Error('Invalid server response'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error || `Upload failed with status ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', '/api/files/upload');
        xhr.send(formData);
      });

      // Update to processing status
      setUploadProgress(prev => new Map(prev.set(fileId, {
        fileId,
        progress: 90,
        status: 'processing'
      })));

      // Wait for upload to complete
      const uploadedFile = await uploadPromise;

      // Complete the upload
      setUploadProgress(prev => new Map(prev.set(fileId, {
        fileId,
        progress: 100,
        status: 'complete'
      })));

      // Add to uploaded files
      setUploadedFiles(prev => [...prev, uploadedFile]);

      // Success notification
      toast.success(`${file.name} uploaded successfully`);

      // Remove progress after delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Update progress with error
      setUploadProgress(prev => new Map(prev.set(fileId, {
        fileId,
        progress: 0,
        status: 'error',
        error: error.message
      })));

      // Error notification
      toast.error(error.message || 'Upload failed');
      
      // Call error callback
      if (onUploadError) {
        onUploadError(error.message);
      }

      // Remove progress after delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
      }, 5000);
    }
  }, [category, appointmentId, customerId, isPublic, expiresInDays, validateFile, onUploadError]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (disabled) return;

    // Check file count limit
    if (uploadedFiles.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);

    try {
      // Upload files in parallel
      const uploadPromises = Array.from(files).map(file => uploadFile(file));
      await Promise.allSettled(uploadPromises);

      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete(uploadedFiles);
      }
    } finally {
      setUploading(false);
    }
  }, [disabled, uploadedFiles, maxFiles, uploadFile, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFilesSelected,
    accept: getAcceptedFileTypes().split(',').reduce((acc, type) => {
      acc[type.trim()] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles,
    maxSize: getMaxFileSize(),
    disabled: disabled || uploading,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    onDropRejected: (rejectedFiles) => {
      setDragActive(false);
      rejectedFiles.forEach(rejection => {
        const errors = rejection.errors.map(e => e.message).join(', ');
        toast.error(`${rejection.file.name}: ${errors}`);
      });
    }
  });

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryIcon = (category: string): string => {
    const icons = {
      document: '📄',
      image: '🖼️',
      certificate: '🏆',
      report: '📊',
      signature: '✍️',
      photo: '📸'
    };
    return icons[category as keyof typeof icons] || '📁';
  };

  const getProgressColor = (status: string): string => {
    switch (status) {
      case 'complete': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'processing': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className={`file-upload-container ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        
        <div className="mb-4 text-4xl">
          {getCategoryIcon(category)}
        </div>
        
        <div className="text-lg mb-2">
          {isDragActive ? (
            <span className="text-blue-600">Drop files here</span>
          ) : (
            <span>Drag & drop files here, or click to select</span>
          )}
        </div>
        
        <div className="text-sm text-gray-500">
          <p>Accepted formats: {getAcceptedFileTypes()}</p>
          <p>Maximum size: {Math.round(getMaxFileSize() / 1024 / 1024)}MB</p>
          <p>Maximum files: {maxFiles}</p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.size > 0 && (
        <div className="mt-4 space-y-3">
          {Array.from(uploadProgress.values()).map((progress) => (
            <div key={progress.fileId} className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-gray-500">{progress.progress}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress.status)}`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              
              {progress.status === 'error' && progress.error && (
                <div className="text-sm text-red-600">{progress.error}</div>
              )}
              
              {progress.status === 'processing' && (
                <div className="text-sm text-yellow-600">Processing file...</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-gray-700">Uploaded Files</h4>
          
          {uploadedFiles.map((file) => (
            <div key={file.id} className="bg-white border rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getCategoryIcon(file.category)}</span>
                <div>
                  <div className="font-medium text-sm">{file.originalName}</div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {file.mimeType}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {file.thumbnailUrl && (
                  <img 
                    src={file.thumbnailUrl} 
                    alt="Thumbnail" 
                    className="w-8 h-8 object-cover rounded"
                  />
                )}
                
                <button
                  onClick={() => window.open(file.url, '_blank')}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View
                </button>
                
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-red-600 hover:text-red-800 text-sm ml-2"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}