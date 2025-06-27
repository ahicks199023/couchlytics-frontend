'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Image from 'next/image'

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
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black via-gray-900 to-gray-800 animate-gradient-x" />
      {/* Hero Section */}
      <section className="w-full max-w-4xl text-center mb-12">
        <Image
          src="/logo.png"
          alt="Couchlytics Logo"
          width={600}
          height={600}
          className="h-48 md:h-64 lg:h-80 w-auto mx-auto mb-8"
          priority
        />
        <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 text-neon-green drop-shadow-lg">
          Welcome to Couchlytics
        </h1>
        <p className="text-xl sm:text-2xl max-w-2xl mx-auto mb-8 text-gray-200 font-medium">
          The ultimate Madden league management platform. Upload league data, review stats, evaluate trades, and dominate every season.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
          <Link
            href="/login"
            className="bg-blue-600/90 hover:bg-blue-700/90 px-8 py-3 rounded-xl text-lg font-bold shadow-lg transition-colors border border-blue-400/30"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="bg-neon-green/90 hover:bg-neon-green/80 px-8 py-3 rounded-xl text-lg font-bold shadow-lg text-black transition-colors border border-green-400/30"
          >
            Create Account
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="backdrop-blur-md bg-gray-800/70 border border-gray-700/40 p-8 rounded-2xl shadow-xl flex flex-col items-center hover:scale-105 hover:bg-gray-700/80 transition-all duration-300"
          >
            <div className="text-5xl mb-4 drop-shadow-lg">{feature.icon}</div>
            <h3 className="text-2xl font-bold mb-2 text-white">{feature.title}</h3>
            <p className="text-base text-gray-300 font-medium">{feature.description}</p>
          </div>
        ))}
      </section>

      {/* League Showcase */}
      <section className="w-full max-w-xl mt-4 mb-10">
        <div className="relative bg-gray-900/80 border border-gray-700/40 rounded-2xl shadow-2xl p-8 flex flex-col items-start backdrop-blur-md">
          <h2 className="text-2xl font-extrabold mb-3 text-neon-green tracking-wide">Featured League</h2>
          <div className="transition-all duration-500">
            <p className="text-2xl font-bold mb-1 text-white">{mockLeagues[carouselIndex].name}</p>
            <p className="text-base text-gray-400">
              {mockLeagues[carouselIndex].teams} Teams • Season {mockLeagues[carouselIndex].season}
            </p>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {mockLeagues.map((_, idx) => (
              <button
                key={idx}
                className={`w-3 h-3 rounded-full border-2 border-neon-green transition-all duration-200 ${carouselIndex === idx ? 'bg-neon-green' : 'bg-transparent'}`}
                onClick={() => setCarouselIndex(idx)}
                aria-label={`Show league ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <footer className="w-full text-center mt-8 mb-2 text-gray-500 text-xs">
        Built by Madden commissioners, for Madden commissioners.
      </footer>

      {/* Optional: Add a subtle animated gradient effect */}
      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 12s ease-in-out infinite;
        }
      `}</style>
    </main>
  )
}

