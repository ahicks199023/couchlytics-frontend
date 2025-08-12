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

        // If not authenticated, do not auto-redirect. We will render a CTA to continue.
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Invalid or expired invite'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    if (inviteCode) run()
  }, [inviteCode, authenticated, router])

  // If we arrive here authenticated and with invite cookies already consumed, send directly to league
  useEffect(() => {
    if (authenticated && league?.id) {
      // Optional: auto-route to league if there are no teams to select
      // Comment this out if you want to always present the team selection
      // router.replace(`/leagues/${league.id}`)
    }
  }, [authenticated, league])

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

  if (loading) return <div className="min-h-screen flex items-center justify-center p-6 text-gray-300">Loading invite…</div>
  if (error) return <div className="min-h-screen flex items-center justify-center p-6 text-red-400">{error}</div>
  if (!league) return <div className="min-h-screen flex items-center justify-center p-6 text-gray-300">Invite not found.</div>

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold">You're invited to join</h1>
          <h2 className="text-2xl text-neon-green font-bold mt-1">{league.name}</h2>
          <p className="text-gray-400 mt-2">Invite code: <code className="bg-gray-800 px-2 py-1 rounded">{inviteCode}</code></p>
        </div>

        {!authenticated ? (
          <div className="p-5 bg-gray-800/60 rounded-lg border border-gray-700 space-y-4">
            <p className="text-gray-300">
              This is a league invite. Click <span className="font-semibold">Continue</span> to proceed — we'll preserve the invite and send you to sign in or register. After you authenticate, you'll be added to <span className="text-neon-green font-semibold">{league.name}</span> automatically.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'}/invites/${inviteCode}/go`}
                className="bg-neon-green text-black px-4 py-2 rounded font-semibold"
              >
                Continue
              </a>
              <Link href={`/login?invite=${inviteCode}`} className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-800">Sign in</Link>
              <Link href={`/register?invite=${inviteCode}`} className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-800">Create account</Link>
            </div>
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
      </div>
    </main>
  )
}


