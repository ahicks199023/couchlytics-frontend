'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { acceptInvite, getInvite, getVacantTeamsForInvite } from '@/lib/api'

type VacantTeam = { id: number; name: string }

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
        const info = await getInvite(inviteCode)
        setLeague({ id: info.league_id, name: info.league_name })

        const t = await getVacantTeamsForInvite(inviteCode)
        setTeams(Array.isArray(t?.teams) ? t.teams : [])

        // If not authenticated, route to login/register and bounce back
        if (!authenticated) {
          router.replace(`/login?invite=${encodeURIComponent(inviteCode)}`)
          return
        }
      } catch (e: any) {
        setError(e?.message ?? 'Invalid or expired invite')
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
      await acceptInvite(inviteCode, { user_id: user?.id as any, team_id: selectedTeamId })
      router.replace(`/leagues/${league.id}`)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to accept invite')
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


