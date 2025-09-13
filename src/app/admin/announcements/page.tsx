'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/adminApi'
import useAuth from '@/Hooks/useAuth'

interface SystemAnnouncement {
  id: number
  title: string
  content: string
  author: string
  author_role: string
  created_at: string
  updated_at: string
  priority: 'low' | 'medium' | 'high'
  category: 'announcement' | 'update' | 'maintenance' | 'feature'
  is_published: boolean
  cover_photo?: string
}

export default function SystemAnnouncementsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<SystemAnnouncement | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user && !user.isAdmin) {
      router.push('/unauthorized')
      return
    }

    if (user?.isAdmin) {
      fetchAnnouncements()
    }
  }, [user, authLoading, router])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await adminApi.getSystemAnnouncements()
      if (data) {
        setAnnouncements(data)
      } else {
        setError('Failed to load announcements')
      }
    } catch (err) {
      console.error('Error fetching announcements:', err)
      setError('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnnouncement = () => {
    setEditingAnnouncement(null)
    setShowCreateForm(true)
  }

  const handleEditAnnouncement = (announcement: SystemAnnouncement) => {
    setEditingAnnouncement(announcement)
    setShowCreateForm(true)
  }

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      await adminApi.deleteSystemAnnouncement(id)
      setAnnouncements(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error('Error deleting announcement:', err)
      alert('Failed to delete announcement')
    }
  }


  const handleTogglePublish = async (id: number, currentStatus: boolean) => {
    try {
      await adminApi.updateSystemAnnouncementStatus(id, !currentStatus)
      setAnnouncements(prev => 
        prev.map(a => a.id === id ? { ...a, is_published: !currentStatus } : a)
      )
    } catch (err) {
      console.error('Error updating announcement status:', err)
      alert('Failed to update announcement status')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20'
      case 'low': return 'text-blue-400 bg-blue-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'announcement': return '📢'
      case 'update': return '🔄'
      case 'maintenance': return '🔧'
      case 'feature': return '✨'
      default: return '📝'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto mb-4"></div>
          <p>Loading system announcements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-neon-green mb-2">
                📢 System Announcements
              </h1>
              <p className="text-xl text-gray-300">
                Manage platform-wide announcements and updates
              </p>
            </div>
            <button
              onClick={handleCreateAnnouncement}
              className="bg-neon-green text-black px-6 py-3 rounded-lg font-semibold hover:bg-green-400 transition-colors"
            >
              + Create Announcement
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Announcements List */}
        <div className="bg-gray-900 rounded-lg border border-gray-800">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white">
              All Announcements ({announcements.length})
            </h2>
          </div>

          {announcements.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📢</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Announcements Yet</h3>
              <p className="text-gray-500 mb-6">Create your first system announcement to get started</p>
              <button
                onClick={handleCreateAnnouncement}
                className="bg-neon-green text-black px-6 py-3 rounded-lg font-semibold hover:bg-green-400 transition-colors"
              >
                Create First Announcement
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="p-6 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">{getCategoryIcon(announcement.category)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {announcement.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>By {announcement.author}</span>
                            <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                              {announcement.author_role}
                            </span>
                            <span>
                              {new Date(announcement.created_at).toLocaleDateString()}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                              {announcement.priority.toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              announcement.is_published 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {announcement.is_published ? 'PUBLISHED' : 'DRAFT'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {announcement.cover_photo && (
                        <div className="mb-4">
                          <img
                            src={announcement.cover_photo}
                            alt={announcement.title}
                            className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-700"
                          />
                        </div>
                      )}
                      
                      <p className="text-gray-300 leading-relaxed mb-4">
                        {announcement.content.length > 200 
                          ? `${announcement.content.substring(0, 200)}...` 
                          : announcement.content
                        }
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleTogglePublish(announcement.id, announcement.is_published)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          announcement.is_published
                            ? 'bg-gray-600 hover:bg-gray-500 text-white'
                            : 'bg-neon-green hover:bg-green-400 text-black'
                        }`}
                      >
                        {announcement.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleEditAnnouncement(announcement)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <AnnouncementForm
          announcement={editingAnnouncement}
          onClose={() => {
            setShowCreateForm(false)
            setEditingAnnouncement(null)
          }}
          onSave={(announcement) => {
            if (editingAnnouncement) {
              setAnnouncements(prev => 
                prev.map(a => a.id === announcement.id ? announcement : a)
              )
            } else {
              setAnnouncements(prev => [announcement, ...prev])
            }
            setShowCreateForm(false)
            setEditingAnnouncement(null)
          }}
        />
      )}
    </div>
  )
}

// Announcement Form Component
function AnnouncementForm({ 
  announcement, 
  onClose, 
  onSave 
}: { 
  announcement: SystemAnnouncement | null
  onClose: () => void
  onSave: (announcement: SystemAnnouncement) => void
}) {
  const [formData, setFormData] = useState({
    title: announcement?.title || '',
    content: announcement?.content || '',
    priority: announcement?.priority || 'medium' as 'low' | 'medium' | 'high',
    category: announcement?.category || 'announcement' as 'announcement' | 'update' | 'maintenance' | 'feature',
    is_published: announcement?.is_published || false
  })
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(announcement?.cover_photo || null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = async (): Promise<string | null> => {
    if (!selectedFile) return announcement?.cover_photo || null

    try {
      setUploadingImage(true)
      const imageUrl = await adminApi.uploadAnnouncementImage(selectedFile)
      return imageUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
      return announcement?.cover_photo || null
    } finally {
      setUploadingImage(false)
    }
  }

  const clearImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) return

    try {
      setLoading(true)
      
      // Upload image if a new one was selected
      const coverPhoto = await handleImageUpload()
      
      // Create announcement data with cover photo
      const announcementData = {
        ...formData,
        cover_photo: coverPhoto || undefined
      }
      
      let savedAnnouncement: SystemAnnouncement
      if (announcement) {
        savedAnnouncement = await adminApi.updateSystemAnnouncement(announcement.id, announcementData)
      } else {
        savedAnnouncement = await adminApi.createSystemAnnouncement(announcementData)
      }
      
      onSave(savedAnnouncement)
    } catch (err) {
      console.error('Error saving announcement:', err)
      alert('Failed to save announcement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">
            {announcement ? 'Edit Announcement' : 'Create New Announcement'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-neon-green focus:outline-none"
              placeholder="Enter announcement title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-neon-green focus:outline-none h-32 resize-none"
              placeholder="Enter announcement content"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-neon-green focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as 'announcement' | 'update' | 'maintenance' | 'feature' }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-neon-green focus:outline-none"
              >
                <option value="announcement">Announcement</option>
                <option value="update">Update</option>
                <option value="maintenance">Maintenance</option>
                <option value="feature">Feature</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cover Photo (Optional)
            </label>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-neon-green focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neon-green file:text-black hover:file:bg-green-400"
              />
              
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {uploadingImage && (
                <div className="flex items-center space-x-2 text-neon-green">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neon-green"></div>
                  <span className="text-sm">Uploading image...</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
              className="w-4 h-4 text-neon-green bg-gray-800 border-gray-700 rounded focus:ring-neon-green"
            />
            <label htmlFor="is_published" className="text-sm text-gray-300">
              Publish immediately
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.content.trim()}
              className="px-6 py-3 bg-neon-green hover:bg-green-400 text-black rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (announcement ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
