'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/config';

export default function CreateAnnouncementPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.leagueId;
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [announcement, setAnnouncement] = useState({
    title: '',
    content: '',
    pinned: false,
    coverPhoto: null as string | null
  });
  const coverPhotoRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Convert image to base64 for storage
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle cover photo upload
  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const base64 = await convertToBase64(file);
      setAnnouncement(prev => ({ ...prev, coverPhoto: base64 }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle image paste in content
  const handleContentPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        
        const file = item.getAsFile();
        if (!file) continue;

        // Validate file size (max 2MB for inline images)
        if (file.size > 2 * 1024 * 1024) {
          alert('Image size must be less than 2MB');
          continue;
        }

        try {
          setUploadingImage(true);
          const base64 = await convertToBase64(file);
          
          // Insert image into content at cursor position
          const textarea = contentRef.current;
          if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const imageMarkdown = `\n![Image](${base64})\n`;
            
            const newContent = 
              announcement.content.substring(0, start) + 
              imageMarkdown + 
              announcement.content.substring(end);
            
            setAnnouncement(prev => ({ ...prev, content: newContent }));
            
            // Set cursor position after the image
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
            }, 0);
          }
        } catch (error) {
          console.error('Error processing pasted image:', error);
          alert('Failed to process pasted image');
        } finally {
          setUploadingImage(false);
        }
      }
    }
  };

  // Remove cover photo
  const removeCoverPhoto = () => {
    setAnnouncement(prev => ({ ...prev, coverPhoto: null }));
    if (coverPhotoRef.current) {
      coverPhotoRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!announcement.title.trim() || !announcement.content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/announcements`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcement),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create announcement');
      }

                // Success - redirect back to commissioner&apos;s hub
      router.push(`/leagues/${leagueId}/commissioner`);
      
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert(error instanceof Error ? error.message : 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href={`/leagues/${leagueId}/commissioner`}
          className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
        >
          ← Back to Commissioner&apos;s Hub
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Create League Announcement</h1>
        <p className="text-gray-400">
          Share important updates and news with your league members
        </p>
      </div>

      {/* Announcement Form */}
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Announcement Title *
            </label>
            <input
              type="text"
              value={announcement.title}
              onChange={(e) => setAnnouncement(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter announcement title..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Cover Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cover Photo (Optional)
            </label>
            <div className="space-y-3">
              {announcement.coverPhoto ? (
                <div className="relative">
                  <img 
                    src={announcement.coverPhoto} 
                    alt="Cover preview" 
                    className="w-full h-48 object-cover rounded-lg border border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={removeCoverPhoto}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors cursor-pointer"
                  onClick={() => coverPhotoRef.current?.click()}
                >
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400">
                    Click to upload a cover photo
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              )}
              <input
                ref={coverPhotoRef}
                type="file"
                accept="image/*"
                onChange={handleCoverPhotoUpload}
                className="hidden"
              />
              {uploadingImage && (
                <div className="text-center">
                  <div className="inline-flex items-center text-sm text-blue-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                    Uploading image...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Announcement Content *
            </label>
            <textarea
              ref={contentRef}
              value={announcement.content}
              onChange={(e) => setAnnouncement(prev => ({ ...prev, content: e.target.value }))}
              onPaste={handleContentPaste}
              placeholder="Write your announcement here... You can paste images directly into the content!"
              rows={10}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 resize-vertical"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Tip: You can paste images directly into the content! Use line breaks to format your announcement. Keep it clear and concise for better engagement.
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="pinned"
                checked={announcement.pinned}
                onChange={(e) => setAnnouncement(prev => ({ ...prev, pinned: e.target.checked }))}
                className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="pinned" className="ml-2 text-sm text-gray-300">
                Pin this announcement to the top
              </label>
            </div>
            <p className="text-xs text-gray-400 ml-6">
              Pinned announcements will appear at the top of the league bulletin board
            </p>
          </div>

          {/* Preview Section */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-white mb-4">Preview</h3>
            <div className="bg-gray-700 rounded-lg p-4">
              {announcement.title ? (
                <>
                  {/* Cover Photo */}
                  {announcement.coverPhoto && (
                    <div className="mb-4">
                      <img 
                        src={announcement.coverPhoto} 
                        alt="Cover" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center mb-2">
                    <h4 className="text-lg font-bold text-white">{announcement.title}</h4>
                    {announcement.pinned && (
                      <span className="ml-2 px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded">
                        📌 Pinned
                      </span>
                    )}
                  </div>
                  {announcement.content ? (
                    <div className="text-gray-300 whitespace-pre-wrap">
                      {announcement.content.split('\n').map((line, index) => {
                        // Check if line contains an image markdown
                        const imageMatch = line.match(/!\[.*?\]\((.*?)\)/);
                        if (imageMatch) {
                          return (
                            <div key={index} className="my-4">
                              <img 
                                src={imageMatch[1]} 
                                alt="Content image" 
                                className="max-w-full h-auto rounded-lg border border-gray-600"
                              />
                            </div>
                          );
                        }
                        return <div key={index}>{line}</div>;
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Announcement content will appear here...</p>
                  )}
                  <div className="mt-4 text-xs text-gray-400 border-t border-gray-600 pt-2">
                    Posted by Commissioner • Just now
                  </div>
                </>
              ) : (
                <p className="text-gray-500 italic">Fill in the title and content to see a preview</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
            <Link
              href={`/leagues/${leagueId}/commissioner`}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !announcement.title.trim() || !announcement.content.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-white font-medium"
            >
              {loading ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </div>
      </form>

      {/* Guidelines */}
      <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-400 font-medium mb-2">📝 Announcement Guidelines</h3>
        <ul className="text-sm text-blue-300 space-y-1">
          <li>• Keep announcements relevant to your league</li>
          <li>• Use clear, concise language</li>
          <li>• Pin important announcements that all members should see</li>
          <li>• Consider timing - post announcements when members are most active</li>
          <li>• Include action items or deadlines when applicable</li>
          <li>• Add cover photos to make announcements more engaging</li>
          <li>• Paste images directly into content for visual storytelling</li>
          <li>• Keep images under 5MB for cover photos, 2MB for inline images</li>
        </ul>
      </div>
    </div>
  );
}
