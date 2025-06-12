// src/app/leagues/[leagueId]/players/[playerId]/page.tsx

'use client'

import { useParams } from 'next/navigation'

export default function PlayerPage() {
  const { leagueId, playerId } = useParams()

  return (
    <div>
      <h1>Player #{playerId} from League #{leagueId}</h1>
      {/* Later: Show stats, charts, game logs, etc. */}
    </div>
  )
}

