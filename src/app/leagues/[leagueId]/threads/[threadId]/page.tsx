'use client'

import { useParams, useRouter } from 'next/navigation'
import ThreadView from '@/components/message-board/ThreadView'

export default function ThreadViewPage() {
  const { leagueId, threadId } = useParams()
  const router = useRouter()

  if (!leagueId || typeof leagueId !== 'string' || !threadId || typeof threadId !== 'string') {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Invalid Thread</h2>
            <p className="text-red-300">League ID and Thread ID are required to view this thread.</p>
          </div>
        </div>
      </div>
    )
  }

  const handleBack = () => {
    // Go back to message boards
    router.push(`/leagues/${leagueId}/message-boards`)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <ThreadView 
        leagueId={leagueId} 
        threadId={threadId} 
        onBack={handleBack}
      />
    </div>
  )
}
