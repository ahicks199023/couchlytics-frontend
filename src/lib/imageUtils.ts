/**
 * Image URL utilities for handling announcement images
 */

import { API_BASE } from '@/lib/config'

/**
 * Constructs the correct image URL for announcement images
 * @param imagePath - The image path from the database (could be filename, full path, or full URL)
 * @returns The complete image URL
 */
export function getAnnouncementImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null
  
  console.log('🖼️ getAnnouncementImageUrl input:', imagePath)
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('🖼️ Full URL detected, returning as-is:', imagePath)
    return imagePath
  }
  
  // If it's a full path starting with /uploads/announcements/, construct the full URL
  if (imagePath.startsWith('/uploads/announcements/')) {
    const fullUrl = `${API_BASE}${imagePath}`
    console.log('🖼️ API path detected, constructed URL:', fullUrl)
    return fullUrl
  }
  
  // If it's a full path starting with /static/uploads/announcements/, convert to API path
  if (imagePath.startsWith('/static/uploads/announcements/')) {
    // Convert /static/uploads/announcements/filename to /uploads/announcements/filename
    const filename = imagePath.replace('/static/uploads/announcements/', '')
    const fullUrl = `${API_BASE}/uploads/announcements/${filename}`
    console.log('🖼️ Static path detected, converted to API path:', fullUrl)
    return fullUrl
  }
  
  // If it's just a filename, construct the full URL
  const fullUrl = `${API_BASE}/uploads/announcements/${imagePath}`
  console.log('🖼️ Filename detected, constructed URL:', fullUrl)
  return fullUrl
}

/**
 * Handles image load errors by hiding the image element
 * @param event - The error event from the img element
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement, Event>) {
  console.error('Image load error:', event.currentTarget.src)
  event.currentTarget.style.display = 'none'
}
