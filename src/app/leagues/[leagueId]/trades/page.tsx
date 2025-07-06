'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { API_BASE } from '@/lib/config'

interface Trade {
  id: number
  leagueId: string
  teamId: number
  fromTeam: string
  toTeam: string
  playersGiven: string
  playersReceived: string
  status: string
  approvalType: string
  submittedBy: string
  submittedAt: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export default function TradeDashboard() {
  const params = useParams()
  const paramLeagueId = params.leagueId
  const leagueId = paramLeagueId as string
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leagueId || leagueId === 'undefined') {
      setError('Invalid or missing league ID.')
      return
    }

    const fetchTrades = async () => {
      try {
        const response = await fetch(`${API_BASE}/leagues/${leagueId}/trades`, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch trades')
        }
        
        const data = await response.json()
        setTrades(data.trades || [])
      } catch (err) {
        console.error('Error fetching trades:', err)
        setError('Failed to load trades.')
      } finally {
        setLoading(false)
      }
    }

    fetchTrades()
  }, [leagueId])

  const voteOnTrade = async (tradeId: number, vote: 'approve' | 'deny') => {
    const res = await fetch(`${API_BASE}/trades/${tradeId}/vote`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote })
    })

    if (res.ok) {
      toast.success(`Trade ${vote}d`)
      setTrades(prev => prev.filter(t => t.id !== tradeId))
    } else {
      const error = await res.json()
      toast.error(error?.error || 'Vote failed')
    }
  }

  const TradeCard = ({ trade, showButtons = false }: { trade: Trade; showButtons?: boolean }) => (
    <div className="bg-[#111827] p-6 rounded-2xl shadow border border-gray-700">
      <div className="text-sm text-gray-400 mb-2">
        League #{trade.leagueId} — Submitted by <span className="text-white">{trade.submittedBy}</span> on{' '}
        {new Date(trade.submittedAt).toLocaleString()}
      </div>
      <h2 className="text-xl font-semibold text-gray-200 mb-4">
        {trade.fromTeam} <span className="text-yellow-400">🡒</span> {trade.toTeam}
      </h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-sm text-green-400 mb-1">Players Given</h3>
          <p className="text-sm">{trade.playersGiven}</p>
        </div>
        <div>
          <h3 className="text-sm text-blue-400 mb-1">Players Received</h3>
          <p className="text-sm">{trade.playersReceived}</p>
        </div>
      </div>
      {showButtons ? (
        <div className="flex gap-3">
          <button
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium"
            onClick={() => voteOnTrade(trade.id, 'approve')}
          >
            Approve ✅
          </button>
          <button
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium"
            onClick={() => voteOnTrade(trade.id, 'deny')}
          >
            Deny ❌
          </button>
        </div>
      ) : (
        <div className="text-sm text-gray-400 mt-2 italic">
          Status: <span className={trade.status === 'approved' ? 'text-green-400' : 'text-red-400'}>{trade.status}</span>{' '}
          — Resolved {trade.resolvedAt ? new Date(trade.resolvedAt).toLocaleDateString() : 'N/A'}
        </div>
      )}
    </div>
  )

  if (error) return <div className="p-4 text-red-500">{error}</div>

  return (
    <div className="min-h-screen px-6 py-10 bg-black text-white">
      <h1 className="text-3xl font-bold mb-8">Trades Dashboard</h1>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          {trades.length > 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">🗳️ Pending Votes</h2>
              <div className="space-y-6">
                {trades.map((trade) => (
                  <TradeCard key={trade.id} trade={trade} showButtons />
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-2xl font-semibold mb-4">📋 Trade History</h2>
            {trades.length === 0 ? (
              <p className="text-gray-500">No finalized trades yet.</p>
            ) : (
              <div className="space-y-6">
                {trades.map((trade) => (
                  <TradeCard key={trade.id} trade={trade} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
