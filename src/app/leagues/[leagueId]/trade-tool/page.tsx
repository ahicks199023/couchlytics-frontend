'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import TradeCalculatorForm from '@/components/TradeCalculatorForm'

export default function TradeToolPage() {
  const router = useRouter()
  const { leagueId: paramLeagueId } = useParams()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [leagueInfo, setLeagueInfo] = useState<{ name: string; seasonYear?: number }>({ name: '' })

  const leagueId = parseInt(paramLeagueId as string)

  useEffect(() => {
    if (!leagueId) return

    const validateAccess = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/league/${leagueId}/is-member`, {
          credentials: 'include'
        })

        const data = await res.json()
        if (res.ok && data.isMember) {
          setAuthorized(true)
        } else {
          setAuthorized(false)
          router.push('/unauthorized')
        }
      } catch (err) {
        console.error("Access check failed:", err)
        setAuthorized(false)
        router.push('/unauthorized')
      }
    }

    validateAccess()
  }, [leagueId, router])

  useEffect(() => {
    if (!authorized) return

    const fetchLeague = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/leagues/${leagueId}`, {
          credentials: 'include'
        })
        const data = await res.json()
        if (res.ok && data.league?.name) {
          setLeagueInfo({
            name: data.league.name,
            seasonYear: data.league.seasonYear
          })
        }
      } catch (err) {
        console.error("Failed to fetch league info:", err)
      }
    }

    fetchLeague()
  }, [authorized, leagueId])

  if (authorized === null) {
    return <p className="text-white text-center mt-10">Checking access...</p>
  }

  if (!authorized) {
    return <p className="text-red-600 text-center mt-10">Access Denied: You are not a member of this league.</p>
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-neon-green mb-2">
        {leagueInfo.name || 'Loading League Name...'}
      </h1>
      {leagueInfo.seasonYear && (
        <p className="text-gray-400 mb-6">Season Year: {leagueInfo.seasonYear}</p>
      )}
      <TradeCalculatorForm leagueId={leagueId} />
    </div>
  )
}
