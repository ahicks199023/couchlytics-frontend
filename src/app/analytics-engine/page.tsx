'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_BASE } from '@/lib/config'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

export default function AnalyticsEnginePage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const leagueId = '12335716' // Default test league ID

  useEffect(() => {
    fetch(`${API_BASE}/me`, { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .then((user) => {
        if (user?.is_premium) {
          setAuthorized(true)
        } else {
          router.push('/upgrade')
        }
      })
      .catch(() => router.push('/upgrade'))
  }, [router])

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-black">
      <AnalyticsDashboard leagueId={leagueId} />
    </div>
  )
}
