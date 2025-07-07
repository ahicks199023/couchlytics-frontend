'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import TradeCalculatorForm from './TradeCalculatorForm'
import { API_BASE } from '@/lib/config'

export default function TradeToolPage() {
  const router = useRouter()
  const { leagueId } = useParams()
  const league_id = typeof leagueId === 'string' ? leagueId : ''

  // Debug log for leagueId and league_id
  console.log('[TradeToolPage] leagueId from useParams:', leagueId, '| league_id:', league_id)

  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [leagueInfo, setLeagueInfo] = useState<{ name: string; seasonYear?: number }>({ name: '' })

  // Log render and state
  console.log('[TradeToolPage] Render: authorized =', authorized, '| league_id =', league_id)

  useEffect(() => {
    if (!league_id) {
      console.warn('[TradeToolPage] league_id is missing or invalid. Skipping membership check.')
      return
    }
    const validateAccess = async () => {
      try {
        const res = await fetch(`${API_BASE}/leagues/${league_id}/is-member`, {
          credentials: 'include'
        })
        const data = await res.json()
        if (res.ok && data.isMember) {
          console.log('[TradeToolPage] Membership check passed. User is a member.')
          setAuthorized(true)
        } else {
          console.warn('[TradeToolPage] Membership check failed. User is NOT a member.')
          setAuthorized(false)
          router.push('/unauthorized')
        }
      } catch (err) {
        console.error('[TradeToolPage] Access check failed:', err)
        setAuthorized(false)
        router.push('/unauthorized')
      }
    }
    validateAccess()
  }, [league_id, router])

  useEffect(() => {
    if (!authorized) return
    const fetchLeague = async () => {
      try {
        const res = await fetch(`${API_BASE}/leagues/${league_id}`, {
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
        console.error('[TradeToolPage] Failed to fetch league info:', err)
      }
    }
    fetchLeague()
  }, [authorized, league_id])

  if (authorized === null) {
    console.log('[TradeToolPage] Showing: Checking access...')
    return <p className="text-white text-center mt-10">Checking access...</p>
  }

  if (!authorized) {
    console.log('[TradeToolPage] Showing: Access Denied')
    return <p className="text-red-600 text-center mt-10">Access Denied: You are not a member of this league.</p>
  }

  if (!league_id) {
    console.log('[TradeToolPage] Showing: Invalid league ID')
    // This means the route param is missing or invalid. Check your navigation/routing logic to ensure leagueId is always present in the URL.
    return <p className="text-red-600 text-center mt-10">Invalid league ID. (Check your URL and navigation logic.)</p>
  }

  console.log('[TradeToolPage] Showing: Main Trade Tool Page')
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-neon-green mb-2">
        {leagueInfo.name || 'Loading League Name...'}
      </h1>
      {leagueInfo.seasonYear && (
        <p className="text-gray-400 mb-6">Season Year: {leagueInfo.seasonYear}</p>
      )}
      <TradeCalculatorForm league_id={league_id} />
    </div>
  )
}
