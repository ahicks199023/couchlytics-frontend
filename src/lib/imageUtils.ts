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
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // If it's a full path starting with /uploads/, construct the full URL
  if (imagePath.startsWith('/uploads/announcements/')) {
    return `${API_BASE}${imagePath}`
  }
  
  // If it's just a filename, construct the full URL
  return `${API_BASE}/uploads/announcements/${imagePath}`
}

/**
 * Handles image load errors by hiding the image element
 * @param event - The error event from the img element
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement, Event>) {
  console.error('Image load error:', event.currentTarget.src)
  event.currentTarget.style.display = 'none'
}
