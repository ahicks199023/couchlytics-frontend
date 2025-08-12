'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { acceptInvite, getInvite, getVacantTeamsForInvite } from '@/lib/api'

type VacantTeam = { id: number; name: string }
type InviteInfo = { league_id: number; league_name: string }
type VacantTeamsResponse = { teams: VacantTeam[] }

export default function JoinLeaguePage() {
  const { invite_code } = useParams()
  const inviteCode = invite_code as string
  const router = useRouter()
  const { authenticated, user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [league, setLeague] = useState<{ id: number; name: string } | null>(null)
  const [teams, setTeams] = useState<VacantTeam[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>(undefined)

  useEffect(() => {
    const run = async () => {
      try {
        const info = (await getInvite(inviteCode)) as InviteInfo
        setLeague({ id: info.league_id, name: info.league_name })

        const t = (await getVacantTeamsForInvite(inviteCode)) as Partial<VacantTeamsResponse>
        setTeams(Array.isArray(t?.teams) ? t.teams : [])

        // If not authenticated, go through backend handoff to set cookies then redirect to configured FE target
        if (!authenticated) {
          if (typeof window !== 'undefined') {
            window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'}/invites/${inviteCode}/go`
          }
          return
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Invalid or expired invite'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    if (inviteCode) run()
  }, [inviteCode, authenticated, router])

  const onJoin = async () => {
    if (!league) return
    try {
      setLoading(true)
      const userId = typeof user?.id === 'number' ? user.id : undefined
      await acceptInvite(inviteCode, { user_id: userId, team_id: selectedTeamId })
      router.replace(`/leagues/${league.id}`)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to accept invite'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6">Loading invite…</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>
  if (!league) return <div className="p-6">Invite not found.</div>

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Join {league.name}</h1>
      <p className="text-gray-600 mb-6">Invite code: <code>{inviteCode}</code></p>

      {!authenticated ? (
        <div className="p-4 bg-yellow-100 rounded border border-yellow-300">
          Please <Link href={`/login?invite=${inviteCode}`} className="underline">sign in</Link> to continue.
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Team (optional)</label>
            <select
              className="w-full border rounded p-2 bg-white dark:bg-gray-900"
              value={selectedTeamId ?? ''}
              onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">No team preference</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <button onClick={onJoin} className="bg-neon-green text-black px-4 py-2 rounded">Join</button>
        </div>
      )}
    </main>
  )
}


