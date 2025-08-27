'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateAnnouncementPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.leagueId;
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState({
    title: '',
    content: '',
    pinned: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!announcement.title.trim() || !announcement.content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/backend-api/leagues/${leagueId}/announcements`, {
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

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Announcement Content *
            </label>
            <textarea
              value={announcement.content}
              onChange={(e) => setAnnouncement(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your announcement here..."
              rows={10}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 resize-vertical"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Tip: You can use line breaks to format your announcement. Keep it clear and concise for better engagement.
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
                      {announcement.content}
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
        </ul>
      </div>
    </div>
  );
}
