'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'


interface GameLogEntry {
  week: number
  category: string
  value: number
}

interface StatTotals {
  statType: string
  totalValue: number
  scope: string
}


interface GameLogEntry {
  week: number
  category: string
  value: number
}

interface PlayerDetailResponse {
  playerId: number
  name: string
  position: string
  teamId?: number
  teamName?: string
  user?: string
  seasonStats: Record<string, number>
  gameLogs: GameLogEntry[]
  playerBestOvr?: number
  speedRating?: number
  strengthRating?: number
  awareRating?: number
  throwPowerRating?: number
  throwAccRating?: number
  throwOnRunRating?: number
  catchRating?: number
  routeRunShortRating?: number
  specCatchRating?: number
  carryRating?: number
  jukeMoveRating?: number
  breakTackleRating?: number
  passBlockRating?: number
  runBlockRating?: number
  leadBlockRating?: number
  tackleRating?: number
  hitPowerRating?: number
  blockShedRating?: number
  manCoverRating?: number
  zoneCoverRating?: number
  pressRating?: number
  devTrait?: string
  college?: string
  height?: number
  weight?: number
  age?: number
  yearsPro?: number
  birthDay?: number
  birthMonth?: number
  birthYear?: number
  clutchTrait?: boolean
  highMotorTrait?: boolean
  bigHitTrait?: boolean
  stripBallTrait?: boolean
  espnId?: string
  statTotals: StatTotals[]
}

export default function PlayerDetailPage() {
  const { leagueId, id } = useParams()
  const currentYear = new Date().getFullYear()
  const [player, setPlayer] = useState<PlayerDetailResponse | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<number>(currentYear)
  const [selectedCategory, setSelectedCategory] = useState<string>('PassingYards')
  const [isCommissioner, setIsCommissioner] = useState<boolean>(false)
  const [name, setName] = useState<string>('')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
   

  const uniqueStats = Array.from(new Set(player?.statTotals?.map(s => s.statType) || []))
  const filteredLogs = player?.gameLogs?.filter(log => log.category === selectedCategory) || []


  useEffect(() => {
    fetch('http://localhost:5000/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setIsCommissioner(data.isCommissioner || false))
  }, [])

  useEffect(() => {
    if (!leagueId || !id) return
    setLoading(true)
    fetch(`http://localhost:5000/leagues/${leagueId}/players/${id}?season=${selectedSeason}`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then((data: PlayerDetailResponse) => {
        setPlayer(data)
        setName(data.name)
      })
      .catch(() => setError('Failed to load player info'))
      .finally(() => setLoading(false))
  }, [leagueId, id, selectedSeason])

  const saveChanges = () => {
    fetch(`http://localhost:5000/leagues/${leagueId}/players/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name })
    })
      .then(res => res.json())
      .then(() => alert('Player updated'))
      .catch(() => alert('Update failed'))
  }

  const seasonStatEntries = Object.entries(player?.seasonStats || {})
  const chartData = player?.gameLogs
    .filter(log => log.category === selectedCategory)
    .map(log => ({ week: log.week, value: log.value })) || []

  const getRatingsByPosition = (position: string | undefined) => {
    const core: Record<string, number> = {
      playerBestOvr: player?.playerBestOvr ?? 0,
      speedRating: player?.speedRating ?? 0,
      strengthRating: player?.strengthRating ?? 0,
      awareRating: player?.awareRating ?? 0
    }

    const positionRatings: Record<string, number> = {}
    switch (position) {
      case 'QB':
        Object.assign(positionRatings, {
          throwPowerRating: player?.throwPowerRating,
          throwAccRating: player?.throwAccRating,
          throwOnRunRating: player?.throwOnRunRating
        })
        break
      case 'WR':
      case 'TE':
        Object.assign(positionRatings, {
          catchRating: player?.catchRating,
          routeRunShortRating: player?.routeRunShortRating,
          specCatchRating: player?.specCatchRating
        })
        break
      case 'HB':
      case 'FB':
        Object.assign(positionRatings, {
          carryRating: player?.carryRating,
          jukeMoveRating: player?.jukeMoveRating,
          breakTackleRating: player?.breakTackleRating
        })
        break
      case 'LT':
      case 'LG':
      case 'C':
      case 'RG':
      case 'RT':
        Object.assign(positionRatings, {
          passBlockRating: player?.passBlockRating,
          runBlockRating: player?.runBlockRating,
          leadBlockRating: player?.leadBlockRating
        })
        break
      case 'LE':
      case 'RE':
      case 'DT':
      case 'LOLB':
      case 'MLB':
      case 'ROLB':
        Object.assign(positionRatings, {
          tackleRating: player?.tackleRating,
          hitPowerRating: player?.hitPowerRating,
          blockShedRating: player?.blockShedRating
        })
        break
      case 'CB':
      case 'FS':
      case 'SS':
        Object.assign(positionRatings, {
          manCoverRating: player?.manCoverRating,
          zoneCoverRating: player?.zoneCoverRating,
          pressRating: player?.pressRating
        })
        break
    }

    return { ...core, ...positionRatings }
  }

  const getHeightFormatted = (height: number | null | undefined): string => {
    if (!height || isNaN(height)) return '—'
    const feet = Math.floor(height / 12)
    const inches = height % 12
    return `${feet}'${inches}"`
  }

  const getBirthday = () => {
    const { birthDay, birthMonth, birthYear } = player || {}
    return birthDay && birthMonth && birthYear
      ? `${birthMonth}/${birthDay}/${birthYear}`
      : '—'
  }

  if (loading) return <p className="text-gray-400">Loading player details...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (!player) return null

  const ratings = getRatingsByPosition(player.position)
  const traits = [
    'clutchTrait',
    'highMotorTrait',
    'bigHitTrait',
    'stripBallTrait'
  ].filter((trait) => (player as any)?.[trait] === true)

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-gray-800 p-6 rounded shadow text-white">
      {player.espnId && (
        <img
          src={`/headshots/${player.espnId}.png`}
          onError={(e) => (e.currentTarget.src = '/headshots/default.png')}
          alt={player.name}
          className="w-24 h-24 rounded-full object-cover mb-4"
        />
      )}

      <h1 className="text-3xl font-bold mb-2">{player.name}</h1>
      <p className="text-gray-400 mb-2">
        {player.position} |{' '}
        {player.teamId && (
          <Link href={`/leagues/${leagueId}/teams/${player.teamId}`} className="text-blue-400 hover:underline">
            {player.teamName}
          </Link>
        )}
        {player.user && <span className="ml-2">User: {player.user}</span>}
      </p>

      {/* Bio Block */}
      <div className="mb-6 text-sm text-gray-300">
        <p>Dev Trait: <span className="text-white font-semibold">{player.devTrait || '—'}</span></p>
        <p>College: <span className="text-white font-semibold">{player.college || '—'}</span></p>
        <p>Height: <span className="text-white font-semibold">{getHeightFormatted(player.height)}</span></p>
        <p>Weight: <span className="text-white font-semibold">{player.weight || '—'} lbs</span></p>
        <p>Age: <span className="text-white font-semibold">{player.age || '—'}</span></p>
        <p>Birthday: <span className="text-white font-semibold">{getBirthday()}</span></p>
        <p>Years Pro: <span className="text-white font-semibold">{player.yearsPro || '—'}</span></p>
      </div>

      {/* Traits */}
      {traits.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-neon-green mb-2">Traits</h2>
          <div className="flex flex-wrap gap-2">
            {traits.map((trait) => (
              <span key={trait} className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {trait.replace('Trait', '').replace(/([a-z])([A-Z])/g, '$1 $2')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ratings */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neon-green mb-2">Ratings Overview</h2>
        <table className="w-full text-sm bg-gray-900 rounded overflow-hidden mb-2">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="py-2 px-3">Attribute</th>
              <th className="py-2 px-3">Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(ratings).map(([key, value]) => (
              <tr key={key} className="border-t border-gray-700">
                <td className="py-1 px-3 capitalize">{key.replace(/Rating$/, '')}</td>
                <td className="py-1 px-3">{value ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

   {player && player.statTotals && player.statTotals.length > 0 ? (
  <div className="mb-8">
    <h2 className="text-xl font-semibold text-neon-green mb-2">Career & Season Totals</h2>
    <table className="w-full text-sm bg-gray-900 rounded overflow-hidden mb-2">
      <thead>
        <tr className="text-left border-b border-gray-700">
          <th className="py-2 px-3">Stat</th>
          <th className="py-2 px-3">Season</th>
          <th className="py-2 px-3">Career</th>
        </tr>
      </thead>
      <tbody>
        {Array.from(new Set(player.statTotals.map(s => s.statType))).map(stat => {
          const season = player.statTotals.find(s => s.statType === stat && s.scope === 'season')?.totalValue ?? 0
          const career = player.statTotals.find(s => s.statType === stat && s.scope === 'career')?.totalValue ?? 0
          return (
            <tr key={stat} className="border-t border-gray-700">
              <td className="py-1 px-3">{stat}</td>
              <td className="py-1 px-3">{season}</td>
              <td className="py-1 px-3">{career}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
) : null}



     {filteredLogs.length > 0 && (
       <div className="mb-6">
         <h2 className="text-xl font-semibold text-neon-green mb-2">Game Logs</h2>
         <label className="block mb-2">
           <span className="text-sm text-gray-400">Select Stat Category:</span>
           <select
             value={selectedCategory}
             onChange={(e) => setSelectedCategory(e.target.value)}
             className="w-full bg-gray-800 text-white border border-gray-600 p-2 rounded mt-1"
           >
             {uniqueStats.map(stat => (
               <option key={stat} value={stat}>{stat}</option>
             ))}
           </select>
         </label>
         <table className="w-full text-sm bg-gray-900 rounded overflow-hidden">
           <thead>
             <tr className="text-left border-b border-gray-700">
               <th className="py-2 px-3">Week</th>
               <th className="py-2 px-3">{selectedCategory}</th>
             </tr>
           </thead>
           <tbody>
             {filteredLogs.map((log, i) => (
               <tr key={i} className="border-t border-gray-700">
                 <td className="py-1 px-3">{log.week}</td>
                 <td className="py-1 px-3">{log.value}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
     )}

}
