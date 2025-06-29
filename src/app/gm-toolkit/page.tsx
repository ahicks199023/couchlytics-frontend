'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_BASE } from '@/lib/config'

export default function GMToolkitPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/me`, { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .then((user) => {
        if (user?.isPremium) {
          setAuthorized(true)
        } else {
          router.push('/upgrade') // 🔒 Redirect if not premium
        }
      })
      .catch(() => router.push('/upgrade'))
  }, [router])

  if (!authorized) return null // ⏳ Optional: show loader

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 text-white px-6 py-16">
      <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-center">GM Toolkit</h1>
      <p className="text-lg text-gray-300 text-center max-w-2xl mx-auto mb-12">
        Unlock next-level league management with powerful tools built for serious commissioners and GMs.
      </p>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {[
          {
            title: 'Trade Evaluator',
            desc: 'Automatically grade trades using real-time player performance and positional value.',
            icon: '🤝',
          },
          {
            title: 'Cap Space Analyzer',
            desc: 'Visualize current and future cap usage to plan like a real NFL front office.',
            icon: '💰',
          },
          {
            title: 'Draft Board Builder',
            desc: 'Build custom draft boards and get AI-powered sleeper suggestions.',
            icon: '📋',
          },
          {
            title: 'Team Scouting Reports',
            desc: 'Auto-generate scouting pages for each team using gameplay stats and trends.',
            icon: '🕵️‍♂️',
          },
          {
            title: 'Free Agent Heatmap',
            desc: 'Identify high-impact free agents that fit your team scheme and cap.',
            icon: '🔥',
          },
          {
            title: 'GM Comparison Tool',
            desc: 'See how you stack up vs other GMs in the league using win rate and trade ROI.',
            icon: '📊',
          },
        ].map((tool, idx) => (
          <div
            key={idx}
            className="bg-gray-800 p-6 rounded-lg shadow-md hover:bg-gray-700 transition"
          >
            <div className="text-4xl mb-3">{tool.icon}</div>
            <h3 className="text-xl font-bold mb-2">{tool.title}</h3>
            <p className="text-sm text-gray-300">{tool.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
