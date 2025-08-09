'use client'

import React, { useState, useRef } from 'react'

interface FileUploadProps {
  onFileSelect: (files: File[]) => void
  maxFiles?: number
  maxSize?: number // in MB
  allowedTypes?: string[]
}

export default function FileUpload({ 
  onFileSelect, 
  maxFiles = 5, 
  maxSize = 10, // 10MB default
  allowedTypes = ['image/*', 'application/pdf', 'text/*', 'video/*', 'audio/*']
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`)
        return false
      }

      // Check file type
      const isValidType = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1))
        }
        return file.type === type
      })

      if (!isValidType) {
        alert(`File type ${file.type} is not allowed.`)
        return false
      }

      return true
    })

    if (validFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed.`)
      return
    }

    onFileSelect(validFiles)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="relative">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="text-gray-500">
          <div className="text-lg mb-2">📎</div>
          <div className="text-sm">
            Click to upload or drag files here
          </div>
          <div className="text-xs mt-1">
            Max {maxFiles} files, {maxSize}MB each
          </div>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  )
} 