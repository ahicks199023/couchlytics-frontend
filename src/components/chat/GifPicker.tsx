'use client'

import React, { useState, useEffect } from 'react'

interface GifPickerProps {
  onGifSelect: (gifUrl: string, gifTitle: string) => void
  onClose: () => void
  className?: string
}

// Mock GIF data - in a real app, you'd integrate with Giphy API
const MOCK_GIFS = [
  { id: '1', url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', title: 'Happy Dance' },
  { id: '2', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', title: 'Laughing' },
  { id: '3', url: 'https://media.giphy.com/media/3o6Zt4HU9qQqQqQqQq/giphy.gif', title: 'Thumbs Up' },
  { id: '4', url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', title: 'Celebration' },
  { id: '5', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', title: 'Excited' },
  { id: '6', url: 'https://media.giphy.com/media/3o6Zt4HU9qQqQqQqQq/giphy.gif', title: 'Applause' },
  { id: '7', url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', title: 'Party' },
  { id: '8', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', title: 'High Five' },
  { id: '9', url: 'https://media.giphy.com/media/3o6Zt4HU9qQqQqQqQq/giphy.gif', title: 'Success' },
  { id: '10', url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', title: 'Victory' },
  { id: '11', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', title: 'Clapping' },
  { id: '12', url: 'https://media.giphy.com/media/3o6Zt4HU9qQqQqQqQq/giphy.gif', title: 'Cheering' },
]

const GIF_CATEGORIES = [
  'Trending',
  'Reactions',
  'Sports',
  'Celebration',
  'Funny',
  'Love'
]

export default function GifPicker({ onGifSelect, onClose, className = '' }: GifPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState('Trending')
  const [searchQuery, setSearchQuery] = useState('')
  const [gifs, setGifs] = useState(MOCK_GIFS)
  const [loading, setLoading] = useState(false)

  // Filter GIFs based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = MOCK_GIFS.filter(gif => 
        gif.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setGifs(filtered)
    } else {
      setGifs(MOCK_GIFS)
    }
  }, [searchQuery])

  const handleGifClick = (gif: typeof MOCK_GIFS[0]) => {
    onGifSelect(gif.url, gif.title)
    onClose()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you'd make an API call here
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 max-w-md ${className}`}>
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full bg-gray-700 text-white px-3 py-2 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            🔍
          </button>
        </div>
      </form>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1 mb-3 border-b border-gray-700 pb-2">
        {GIF_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* GIF Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : gifs.length === 0 ? (
          <div className="col-span-2 text-center text-gray-400 py-8">
            No GIFs found
          </div>
        ) : (
          gifs.map((gif) => (
            <button
              key={gif.id}
              onClick={() => handleGifClick(gif)}
              className="relative group rounded-md overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
            >
              <img
                src={gif.url}
                alt={gif.title}
                className="w-full h-24 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity text-center px-1">
                  {gif.title}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Close Button */}
      <div className="flex justify-end mt-3 pt-2 border-t border-gray-700">
        <button
          onClick={onClose}
          className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}
