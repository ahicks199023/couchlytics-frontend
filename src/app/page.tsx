'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const features = [
  {
    title: 'Upload Tools',
    icon: '📂',
    description: 'Instantly import leagues with player, game, and stat breakdowns.',
  },
  {
    title: 'Analytics Engine',
    icon: '📊',
    description: 'Track leaderboards, efficiency metrics, and power rankings.',
  },
  {
    title: 'GM Toolkit',
    icon: '🧠',
    description: 'Trade evaluator, cap analyzer, and free agent heatmaps.',
  },
  {
    title: 'Draft Assistant',
    icon: '📝',
    description: 'AI-powered draft board builder with sleeper alerts.',
  },
]

const mockLeagues = [
  { name: 'Lost Tapes League', teams: 32, season: '2025', id: 1 },
  { name: 'NextGen Gridiron', teams: 24, season: '2024', id: 2 },
  { name: 'Primetime Franchise', teams: 30, season: '2023', id: 3 },
]

export default function HomePage() {
  const [carouselIndex, setCarouselIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % mockLeagues.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white px-6 py-12 flex flex-col items-center text-center">
      <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-neon-green">Welcome to Couch Commish</h1>
      <p className="text-lg sm:text-xl max-w-2xl mb-10">
        Your all-in-one Madden league management platform. Track stats, manage uploads, and unlock pro tools like the GM Toolkit and Draft Assistant.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-12">
        <Link href="/login" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded text-lg font-semibold">
          Login
        </Link>
        <Link href="/register" className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded text-lg font-semibold">
          Create Account
        </Link>
      </div>

      <section className="w-full max-w-5xl py-8 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, idx) => (
          <div key={idx} className="bg-gray-800 p-6 rounded-lg shadow-md hover:bg-gray-700 transition">
            <div className="text-4xl mb-3">{feature.icon}</div>
            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-300">{feature.description}</p>
          </div>
        ))}
      </section>

      <section className="w-full max-w-xl mt-12 mb-6 bg-gray-900 p-6 rounded-lg text-left">
        <h2 className="text-2xl font-bold mb-4">Featured League</h2>
        <div className="transition-all duration-500">
          <p className="text-xl font-semibold">{mockLeagues[carouselIndex].name}</p>
          <p className="text-sm text-gray-400">
            {mockLeagues[carouselIndex].teams} Teams • Season {mockLeagues[carouselIndex].season}
          </p>
        </div>
      </section>

      <div className="text-xs text-gray-500 mt-4">
        Built by Madden commissioners, for Madden commissioners.
      </div>
    </main>
  )
}
