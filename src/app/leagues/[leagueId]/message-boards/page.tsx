'use client'

import { useParams } from 'next/navigation'
import MessageBoard from '@/components/message-board/MessageBoard'

export default function MessageBoardsPage() {
  const { leagueId } = useParams()

  if (!leagueId || typeof leagueId !== 'string') {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Invalid League</h2>
            <p className="text-red-300">League ID is required to view message boards.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <MessageBoard leagueId={leagueId} />
    </div>
  )
}
